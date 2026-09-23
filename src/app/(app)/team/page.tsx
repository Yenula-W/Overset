import type { Metadata } from 'next';
import { MessageSquare, UserPlus } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, StatusBadge } from '@/components/ui';
import { DEMO_COMMENTS, DEMO_TEAM } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Team' };

const WORKFLOW = [
  ['AI translation', 'PanelFlow drafts every region with full chapter context.'],
  ['Translator review', 'Wording, speaker, OCR, and reading order are corrected here.'],
  ['Proofreader', 'Meaning, grammar, voice, and terminology consistency.'],
  ['Typesetter', 'Fit, line breaks, and placement inside the original bubbles.'],
  ['Final approval', 'The owner signs off, and the chapter becomes exportable.'],
];

const ROLE_TONE = { owner: 'dark', translator: 'accent', proofreader: 'ok', typesetter: 'warn', viewer: 'neutral' } as const;

export default function TeamPage() {
  return (
    <AppShellPage>
      <PageHeader
        title="Team"
        lede="Roles decide who can change what, and every comment stays attached to the bubble it was about."
        actions={
          <Button>
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
              <span className="text-[12.5px] text-ink-muted">{DEMO_TEAM.length} of 5 seats used</span>
            </CardHeader>
            <ul className="divide-y divide-line">
              {DEMO_TEAM.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                  <Avatar name={m.name} color={m.avatarColor} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{m.name}</p>
                    <p className="text-[12.5px] text-ink-muted">{m.email}</p>
                  </div>
                  <Badge tone={ROLE_TONE[m.role]} className="capitalize">
                    {m.role}
                  </Badge>
                  <StatusBadge tone={m.status === 'active' ? 'ok' : 'neutral'} label={m.status === 'active' ? 'Active' : 'Invited'} />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <span className="text-[12.5px] text-ink-muted">Attached to individual regions</span>
            </CardHeader>
            <ul className="divide-y divide-line">
              {DEMO_COMMENTS.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-ink-faint" aria-hidden />
                    <span className="text-[13px] font-medium">{c.authorName}</span>
                    <span className="text-[12px] text-ink-faint">Chapter 14 · region {c.regionId}</span>
                    {c.resolved && <Badge tone="ok" className="ml-auto">Resolved</Badge>}
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{c.body}</p>
                  {c.replies.map((r) => (
                    <p key={r.id} className="mt-2.5 border-l-2 border-line pl-3 text-[13.5px] leading-relaxed text-ink-muted">
                      <span className="font-medium text-ink">{r.authorName}: </span>
                      {r.body}
                    </p>
                  ))}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary">
                      Reply
                    </Button>
                    <Button size="sm" variant="ghost">
                      {c.resolved ? 'Reopen' : 'Resolve'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
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
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-[10.5px] font-semibold tabular-nums">
                    {i + 1}
                  </span>
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
    </AppShellPage>
  );
}
