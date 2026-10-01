'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessageSquare, Trash2, UserPlus } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { ConfirmModal } from '@/components/app/project-form';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Modal, Select, StatusBadge, useToast } from '@/components/ui';
import { planById } from '@/lib/billing';
import { getAllByIndex } from '@/lib/store/db';
import { useLiveQuery, useUser } from '@/lib/store/hooks';
import { inviteMember, listTeam, removeMember, updateMemberRole } from '@/lib/store/repo';
import type { CommentRecord, TeamRecord } from '@/lib/store/schema';
import type { TeamRole } from '@/lib/types/domain';

const WORKFLOW = [
  ['AI translation', 'Drafts every region with full chapter context — once an AI provider is connected.'],
  ['Translator review', 'Wording, speaker, source text, and reading order are corrected here.'],
  ['Proofreader', 'Meaning, grammar, voice, and terminology consistency.'],
  ['Typesetter', 'Fit, line breaks, and placement inside the original bubbles.'],
  ['Final approval', 'The owner signs off, and the chapter is exported.'],
];

const ROLES: TeamRole[] = ['translator', 'proofreader', 'typesetter', 'viewer'];
const ROLE_TONE = { owner: 'dark', translator: 'accent', proofreader: 'ok', typesetter: 'warn', viewer: 'neutral' } as const;

export default function TeamPage() {
  const user = useUser();
  const toast = useToast();
  const plan = planById(user.plan);
  const team = useLiveQuery(() => listTeam(user.id), [user.id], ['team']);
  const comments = useLiveQuery(
    () => getAllByIndex<CommentRecord>('comments', 'ownerId', user.id).then((c) => c.filter((x) => !x.parentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)),
    [user.id],
    ['comments'],
  );
  const [inviting, setInviting] = React.useState(false);
  const [removing, setRemoving] = React.useState<TeamRecord | null>(null);

  const members = team.data ?? [];
  const seatsUsed = members.length + 1;

  return (
    <AppShellPage>
      <PageHeader
        title="Team"
        lede="Roles decide who does which step, and comments stay attached to the region they’re about."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus size={15} />
            Invite member
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <span className="text-[12.5px] text-ink-muted">
                {seatsUsed} of {plan.seats} {plan.seats === 1 ? 'seat' : 'seats'} on {plan.name}
              </span>
            </CardHeader>
            <ul className="divide-y divide-line">
              <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                <Avatar name={user.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{user.name} (you)</p>
                  <p className="text-[12.5px] text-ink-muted">{user.email}</p>
                </div>
                <Badge tone="dark">Owner</Badge>
              </li>
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                  <Avatar name={m.name} color={m.avatarColor} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{m.name}</p>
                    <p className="text-[12.5px] text-ink-muted">{m.email}</p>
                  </div>
                  <Select
                    aria-label={`Role for ${m.name}`}
                    value={m.role}
                    onChange={async (e) => {
                      await updateMemberRole(user.id, m.id, e.target.value as TeamRole);
                      toast({ message: `${m.name} is now a ${e.target.value}.`, tone: 'ok' });
                    }}
                    className="h-8 w-auto py-0 text-[12.5px] capitalize"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r[0].toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </Select>
                  <StatusBadge tone={m.status === 'active' ? 'ok' : 'neutral'} label={m.status === 'active' ? 'Active' : 'Invited'} />
                  <button onClick={() => setRemoving(m)} className="rounded-md p-1.5 text-ink-faint hover:bg-ink/5 hover:text-danger" aria-label={`Remove ${m.name}`}>
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            {members.length > 0 && (
              <p className="border-t border-line px-5 py-3 text-[12px] leading-relaxed text-ink-faint">
                Invitations are saved, but none are emailed yet, and invited people can’t sign in from their own devices until
                accounts move to a server.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent comments</CardTitle>
              <span className="text-[12.5px] text-ink-muted">Attached to individual regions</span>
            </CardHeader>
            {(comments.data ?? []).length === 0 ? (
              <CardBody>
                <p className="text-[13px] text-ink-muted">Comments you leave on regions in the editor appear here.</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-line">
                {comments.data!.map((c) => (
                  <li key={c.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={13} className="text-ink-faint" aria-hidden />
                      <span className="text-[13px] font-medium">{c.authorName}</span>
                      <time className="text-[12px] text-ink-faint">{new Date(c.createdAt).toLocaleDateString()}</time>
                      {c.resolved && (
                        <Badge tone="ok" className="ml-auto">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{c.body}</p>
                    <Link href={`/translate/editor?chapter=${c.chapterId}`} className="mt-2 inline-block text-[12.5px] text-ink underline underline-offset-2">
                      Open in editor
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="space-y-4">
              {WORKFLOW.map(([step, detail], i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-[10.5px] font-semibold tabular-nums">{i + 1}</span>
                  <div>
                    <p className="text-[13.5px] font-medium">{step}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      <InviteModal
        open={inviting}
        overSeats={seatsUsed >= plan.seats}
        planName={plan.name}
        onClose={() => setInviting(false)}
        onInvite={async (v) => {
          await inviteMember(user.id, v);
          toast({ message: `${v.name || v.email} added as ${v.role}.`, tone: 'ok' });
        }}
      />

      <ConfirmModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name ?? 'member'}?`}
        confirmLabel="Remove"
        body="Their comments stay on the regions they were left on."
        onConfirm={async () => {
          if (removing) await removeMember(user.id, removing.id);
        }}
      />
    </AppShellPage>
  );
}

function InviteModal({
  open,
  overSeats,
  planName,
  onClose,
  onInvite,
}: {
  open: boolean;
  overSeats: boolean;
  planName: string;
  onClose: () => void;
  onInvite: (v: { name: string; email: string; role: TeamRole }) => Promise<void>;
}) {
  const [v, setV] = React.useState({ name: '', email: '', role: 'translator' as TeamRole });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setV({ name: '', email: '', role: 'translator' });
      setError(null);
    }
  }, [open]);

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      await onInvite(v);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That invite couldn’t be saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a team member"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={busy}>
            Add to team
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {overSeats && (
          <p className="rounded-lg bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">
            The {planName} plan includes no more seats. Billing isn’t connected yet, so you can still add people for now.
          </p>
        )}
        <Field label="Email" htmlFor="i-email" error={error ?? undefined}>
          <Input id="i-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoFocus />
        </Field>
        <Field label="Name" htmlFor="i-name" hint="Optional.">
          <Input id="i-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="Role" htmlFor="i-role">
          <Select id="i-role" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as TeamRole })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r[0].toUpperCase() + r.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-[12px] leading-relaxed text-ink-faint">No email is sent — sending invitations needs an email service, which isn’t connected yet.</p>
      </div>
    </Modal>
  );
}
