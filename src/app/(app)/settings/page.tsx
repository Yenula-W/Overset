'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ImportLocalCard } from '@/components/app/import-local';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  Modal,
  Select,
  Tabs,
  useToast,
} from '@/components/ui';
import { callService } from '@/lib/client-services';
import { planById } from '@/lib/billing';
import { passwordSchema } from '@/lib/auth';
import { AuthError, changePassword, cloudEnabled, logOut, updateProfile } from '@/lib/store/auth';
import { useLiveQuery, useUser } from '@/lib/store/hooks';
import { deleteAccount, deleteAllUploads, exportAccountData, getUsage, listAllPages } from '@/lib/store/repo';
import { storageEstimate } from '@/lib/store/db';
import { downloadBlob, formatBytes } from '@/lib/download';
import { formatNumber } from '@/lib/utils';
import type { LanguageCode, UserPreferences } from '@/lib/types/domain';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'billing', label: 'Billing' },
  { id: 'data', label: 'Data' },
];

export default function SettingsPage() {
  const [tab, setTab] = React.useState('account');

  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (TABS.some((t) => t.id === hash)) setTab(hash);
  }, []);

  return (
    <AppShellPage className="max-w-3xl">
      <PageHeader title="Settings" />
      <Tabs items={TABS} value={tab} onChange={setTab} className="mt-6" />
      <div className="mt-6 space-y-6">
        {tab === 'account' && <><AccountTab /><ServiceStatus /></>}
        {tab === 'preferences' && <PreferencesTab />}
        {tab === 'billing' && <BillingTab />}
        {tab === 'data' && <DataTab />}
      </div>
    </AppShellPage>
  );
}

function ServiceStatus() {
  const [services, setServices] = React.useState<{ai:boolean;email:boolean;billing:boolean} | null>(null);
  const [error, setError] = React.useState('');
  const [retrying, setRetrying] = React.useState(false);
  const toast = useToast();
  React.useEffect(() => {
    if (cloudEnabled) void callService<{ai:boolean;email:boolean;billing:boolean}>('/api/services').then(setServices).catch(() => setError('Service status is temporarily unavailable.'));
  }, []);
  if (!cloudEnabled) return null;
  return <Card><CardHeader><CardTitle>Connected services</CardTitle></CardHeader><CardBody>
    {error ? <p role="alert" className="text-[13px] text-danger">{error}</p> : <dl className="space-y-3 text-[13px]">
      {([['ai','AI processing'],['email','Email delivery'],['billing','Payments']] as const).map(([id,label]) => <div key={id} className="flex items-center justify-between gap-4"><dt>{label}</dt><dd><Badge tone={services?.[id] ? 'ok' : 'neutral'}>{services ? services[id] ? 'Connected' : 'Not connected' : 'Checking…'}</Badge></dd></div>)}
    </dl>}
    {services?.email && <Button className="mt-4" size="sm" variant="secondary" loading={retrying} onClick={async () => {
      setRetrying(true);
      try { await callService('/api/email/retry',{method:'POST'}); toast({message:'Queued email delivery retried.',tone:'ok'}); }
      catch (e) { toast({message:e instanceof Error ? e.message : 'Could not retry email.',tone:'warn'}); }
      finally { setRetrying(false); }
    }}>Retry queued emails</Button>}
  </CardBody></Card>;
}

function AccountTab() {
  const user = useUser();
  const toast = useToast();
  const router = useRouter();
  const [profileError, setProfileError] = React.useState<Record<string, string>>({});
  const [pwError, setPwError] = React.useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPw, setSavingPw] = React.useState(false);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const errs: Record<string, string> = {};
    if (!name) errs.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email address.';
    setProfileError(errs);
    if (Object.keys(errs).length) return;
    setSavingProfile(true);
    try {
      const saved = await updateProfile(user.id, { name, email });
      toast(
        saved.pendingEmail
          ? { message: `Profile saved. Open the link we sent to ${saved.pendingEmail} to finish changing your email.`, tone: 'info' }
          : { message: 'Profile saved.', tone: 'ok' },
      );
    } catch (err) {
      setProfileError({ [err instanceof AuthError ? (err.field ?? 'form') : 'form']: err instanceof Error ? err.message : 'Couldn’t save.' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const current = String(form.get('current') ?? '');
    const next = String(form.get('new') ?? '');
    const confirm = String(form.get('confirm') ?? '');
    const errs: Record<string, string> = {};
    if (!current) errs.currentPassword = 'Enter your current password.';
    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) errs.new = parsed.error.issues[0]?.message ?? 'Choose a stronger password.';
    else if (next !== confirm) errs.confirm = 'The passwords don’t match.';
    setPwError(errs);
    if (Object.keys(errs).length) return;
    setSavingPw(true);
    try {
      await changePassword(user.id, current, next);
      formEl.reset();
      toast({ message: 'Password updated.', tone: 'ok' });
    } catch (err) {
      setPwError({ [err instanceof AuthError ? (err.field ?? 'form') : 'form']: err instanceof Error ? err.message : 'Couldn’t update.' });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            {profileError.form && <p role="alert" className="text-[13px] text-danger">{profileError.form}</p>}
            <Field label="Name" htmlFor="name" error={profileError.name}>
              <Input id="name" name="name" defaultValue={user.name} autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="email" error={profileError.email}>
              <Input id="email" name="email" type="email" defaultValue={user.email} autoComplete="email" />
            </Field>
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            {pwError.form && <p role="alert" className="text-[13px] text-danger">{pwError.form}</p>}
            <Field label="Current password" htmlFor="current" error={pwError.currentPassword}>
              <Input id="current" name="current" type="password" autoComplete="current-password" />
            </Field>
            <Field label="New password" htmlFor="new" hint="At least 10 characters, including a number." error={pwError.new}>
              <Input id="new" name="new" type="password" autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm" error={pwError.confirm}>
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
            </Field>
            <Button type="submit" variant="secondary" loading={savingPw}>
              Update password
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardBody>
          <Button
            variant="secondary"
            onClick={async () => {
              await logOut();
              router.replace('/login');
            }}
          >
            Log out
          </Button>
        </CardBody>
      </Card>
    </>
  );
}

function PreferencesTab() {
  const user = useUser();
  const toast = useToast();
  const [saving, setSaving] = React.useState(false);
  const [prefs, setPrefs] = React.useState(user.preferences);

  async function save() {
    setSaving(true);
    try {
      await updateProfile(user.id, { preferences: prefs });
      toast({ message: 'Preferences saved.', tone: 'ok' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace preferences</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <Field label="Default source language" htmlFor="srclang" hint="Pre-selected when you start a translation.">
          <Select
            id="srclang"
            value={prefs.primarySourceLanguage ?? 'auto'}
            onChange={(e) =>
              setPrefs({ ...prefs, primarySourceLanguage: e.target.value === 'auto' ? undefined : (e.target.value as LanguageCode) })
            }
          >
            <option value="auto">No default</option>
            <option value="ko">Korean</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </Select>
        </Field>
        <Field label="What you mostly translate" htmlFor="medium">
          <Select
            id="medium"
            value={prefs.primaryMedium ?? 'manhwa'}
            onChange={(e) => setPrefs({ ...prefs, primaryMedium: e.target.value as UserPreferences['primaryMedium'] })}
          >
            <option value="manhwa">Manhwa</option>
            <option value="manga">Manga</option>
            <option value="webtoon">Webtoons</option>
            <option value="other">Other comics</option>
          </Select>
        </Field>
        <div className="space-y-2.5 border-t border-line pt-4">
          <Checkbox
            label="Email me when a chapter finishes processing"
            description="Saved now; emails start once an email service is connected."
            checked={prefs.emailOnProcessed ?? true}
            onChange={(e) => setPrefs({ ...prefs, emailOnProcessed: e.target.checked })}
          />
          <Checkbox
            label="Email me when someone comments on my translation"
            checked={prefs.emailOnComment ?? true}
            onChange={(e) => setPrefs({ ...prefs, emailOnComment: e.target.checked })}
          />
        </div>
        <Button onClick={() => void save()} loading={saving}>
          Save preferences
        </Button>
      </CardBody>
    </Card>
  );
}

function BillingTab() {
  const user = useUser();
  const plan = planById(user.plan);
  const usage = useLiveQuery(() => getUsage(user.id), [user.id], ['usage']);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <Badge tone="accent">{plan.name}</Badge>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-[14px] text-ink-muted">
            {plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}/month`} · {formatNumber(plan.pageAllowance)} pages included ·{' '}
            {formatNumber(usage.data?.pagesProcessed ?? 0)} used this month.
          </p>
          <div className="flex gap-2 pt-1">
            <Button href="/pricing">Compare plans</Button>
            <Button variant="secondary" href="/usage">
              View usage
            </Button>
          </div>
        </CardBody>
      </Card>
      <p className="text-[12.5px] leading-relaxed text-ink-faint">
        Upgrading needs a payment provider, which isn’t connected yet. Payment details will be handled by that provider —
        Overset never stores card numbers.
      </p>
    </>
  );
}

function DataTab() {
  const user = useUser();
  const toast = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = React.useState<null | 'uploads' | 'account'>(null);
  const [typed, setTyped] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const pages = useLiveQuery(() => listAllPages(user.id), [user.id], ['pages']);
  const storage = useLiveQuery(() => storageEstimate(), [], ['blobs', 'pages']);
  const uploadBytes = (pages.data ?? []).reduce((sum, p) => sum + p.bytes, 0);

  async function exportData() {
    const data = await exportAccountData(user.id);
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `overset-data-${new Date().toISOString().slice(0, 10)}.json`);
    toast({ message: 'Your data is downloading.', tone: 'ok' });
  }

  async function run() {
    setBusy(true);
    try {
      if (confirm === 'uploads') {
        const n = await deleteAllUploads(user.id);
        toast({ message: `Deleted ${n} uploaded ${n === 1 ? 'page' : 'pages'}.`, tone: 'ok' });
        setConfirm(null);
      } else if (confirm === 'account') {
        await deleteAccount(user.id);
        await logOut();
        router.replace('/');
      }
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'That didn’t work. Try again.', tone: 'warn' });
    } finally {
      setBusy(false);
      setTyped('');
    }
  }

  return (
    <>
      <ImportLocalCard />
      <Card>
        <CardHeader>
          <CardTitle>Your content</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-[14px] leading-relaxed text-ink-muted">
            You retain the rights to everything you upload. Your projects and page images are stored {cloudEnabled ? 'in your Overset account' : 'in this browser'}
            {storage.data ? ` — ${formatBytes(storage.data.usedBytes)} used` : ''}, and {formatNumber(pages.data?.length ?? 0)}{' '}
            uploaded {pages.data?.length === 1 ? 'page takes' : 'pages take'} {formatBytes(uploadBytes)}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void exportData()}>
              Export all my data
            </Button>
            <Button variant="secondary" onClick={() => setConfirm('uploads')} disabled={!pages.data?.length}>
              Delete uploaded pages
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger">Delete account</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-[14px] leading-relaxed text-ink-muted">
            This permanently removes your projects, chapters, uploaded pages, glossaries, characters, and translation
            memory. It cannot be undone.
          </p>
          <Button variant="danger" onClick={() => setConfirm('account')}>
            Delete account
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={confirm !== null}
        onClose={() => {
          setConfirm(null);
          setTyped('');
        }}
        title={confirm === 'account' ? 'Delete your account?' : 'Delete every uploaded page?'}
        description="This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void run()} loading={busy} disabled={confirm === 'account' && typed !== 'DELETE'}>
              {confirm === 'account' ? 'Delete everything' : 'Delete pages'}
            </Button>
          </>
        }
      >
        {confirm === 'account' ? (
          <div className="space-y-3">
            <p className="text-[14px] leading-relaxed text-ink-muted">
              Export your data first if you want to keep it. Type <strong className="text-ink">DELETE</strong> to confirm.
            </p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type DELETE to confirm" autoFocus />
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed text-ink-muted">
            Removes all {formatNumber(pages.data?.length ?? 0)} page images and their regions. Projects, glossaries,
            characters, and translation memory stay.
          </p>
        )}
      </Modal>
    </>
  );
}
