'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { DEMO_SUBSCRIPTION, DEMO_USAGE, DEMO_USER } from '@/lib/data/workspace';
import { planById } from '@/lib/billing';
import { clearSession } from '@/lib/auth';
import { formatNumber } from '@/lib/utils';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'billing', label: 'Billing' },
  { id: 'data', label: 'Data' },
];

export default function SettingsPage() {
  const [tab, setTab] = React.useState('account');
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  const plan = planById(DEMO_SUBSCRIPTION.plan);

  function logOut() {
    clearSession();
    router.push('/login');
  }

  return (
    <AppShellPage className="max-w-3xl">
      <PageHeader title="Settings" />
      <Tabs items={TABS} value={tab} onChange={setTab} className="mt-6" />

      <div className="mt-6 space-y-6">
        {tab === 'account' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <Field label="Name" htmlFor="name">
                  <Input id="name" defaultValue={DEMO_USER.name} autoComplete="name" />
                </Field>
                <Field label="Email" htmlFor="email">
                  <Input id="email" type="email" defaultValue={DEMO_USER.email} autoComplete="email" />
                </Field>
                <Button onClick={() => toast({ message: 'Profile saved.', tone: 'ok' })}>Save changes</Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <Field label="Current password" htmlFor="current">
                  <Input id="current" type="password" autoComplete="current-password" />
                </Field>
                <Field label="New password" htmlFor="new" hint="At least 10 characters, including a number.">
                  <Input id="new" type="password" autoComplete="new-password" />
                </Field>
                <Button variant="secondary" onClick={() => toast({ message: 'Password updated.', tone: 'ok' })}>
                  Update password
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session</CardTitle>
              </CardHeader>
              <CardBody>
                <Button variant="secondary" onClick={logOut}>
                  Log out
                </Button>
              </CardBody>
            </Card>
          </>
        )}

        {tab === 'preferences' && (
          <Card>
            <CardHeader>
              <CardTitle>Workspace preferences</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <Field label="Default source language" htmlFor="srclang">
                <Select id="srclang" defaultValue={DEMO_USER.preferences.primarySourceLanguage}>
                  <option value="ko">Korean</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </Select>
              </Field>
              <Field label="What you mostly translate" htmlFor="medium">
                <Select id="medium" defaultValue={DEMO_USER.preferences.primaryMedium}>
                  <option value="manhwa">Manhwa</option>
                  <option value="manga">Manga</option>
                  <option value="webtoon">Webtoons</option>
                  <option value="other">Other comics</option>
                </Select>
              </Field>
              <div className="space-y-2.5 border-t border-line pt-4">
                <Checkbox label="Reduce motion" description="Turns off transitions and animated detection overlays." />
                <Checkbox label="Email me when a chapter finishes processing" defaultChecked />
                <Checkbox label="Email me when someone comments on my translation" defaultChecked />
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'billing' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Plan</CardTitle>
                <Badge tone="accent">{plan.name}</Badge>
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-[14px] text-ink-muted">
                  ${plan.priceMonthly}/month · {formatNumber(plan.pageAllowance)} pages included ·{' '}
                  {formatNumber(DEMO_USAGE.pagesUsed)} used this cycle.
                </p>
                <p className="text-[13px] text-ink-muted">
                  Renews {new Date(DEMO_SUBSCRIPTION.currentPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button href="/pricing">Change plan</Button>
                  <Button variant="secondary" href="/usage">
                    View usage
                  </Button>
                </div>
              </CardBody>
            </Card>
            <p className="text-[12.5px] leading-relaxed text-ink-faint">
              Payment details are handled by the payment provider. Overset never stores card numbers.
            </p>
          </>
        )}

        {tab === 'data' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Your content</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-[14px] leading-relaxed text-ink-muted">
                  You retain the rights to everything you upload. Projects are private to you and the people you invite.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => toast({ message: 'Export queued. We’ll email you a link.', tone: 'info' })}>
                    Export all my data
                  </Button>
                  <Button variant="secondary" onClick={() => toast({ message: 'Uploaded source files cleared.', tone: 'ok' })}>
                    Delete uploaded files
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
                  This permanently removes your projects, chapters, uploaded pages, glossaries, and translation memory.
                  It cannot be undone.
                </p>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Delete account
                </Button>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        description="This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(false)}>
              Delete everything
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink-muted">
          Deleting your account removes {formatNumber(DEMO_USER.name.length > 0 ? 14 : 0)} projects, every uploaded
          chapter, and all approved translations. Export your data first if you want to keep it.
        </p>
      </Modal>
    </AppShellPage>
  );
}
