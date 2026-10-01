'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, LibraryBig, Plus, Sparkles } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { ProjectCard, chapterStatus } from '@/components/app/project-card';
import { ProjectFormModal } from '@/components/app/project-form';
import { Button, Card, EmptyState, Skeleton, StatusBadge, useToast } from '@/components/ui';
import { useActiveWorkspace, useUser } from '@/lib/store/hooks';
import { useWorkspace } from '@/lib/store/workspace';
import { createProject } from '@/lib/store/repo';
import { LANGUAGE_LABELS } from '@/lib/types/domain';
import { formatNumber, greeting } from '@/lib/utils';

export default function DashboardPage() {
  const user = useUser();
  const workspace = useActiveWorkspace();
  const router = useRouter();
  const toast = useToast();
  const ws = useWorkspace();
  const [creating, setCreating] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);

  async function loadSample() {
    setSeeding(true);
    try {
      const { seedSampleProject } = await import('@/lib/sample');
      const { chapterId } = await seedSampleProject(workspace.id);
      toast({ message: 'Sample project added.', tone: 'ok' });
      router.push(`/translate/editor?chapter=${chapterId}`);
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'The sample couldn’t be added.', tone: 'warn' });
      setSeeding(false);
    }
  }

  const data = ws.data;
  const regions = data?.chapters.reduce((s, c) => s + c.stats.regionCount, 0) ?? 0;
  const approved = data?.chapters.reduce((s, c) => s + c.stats.approved, 0) ?? 0;
  const waiting = data?.chapters.filter((c) => c.status === 'review').length ?? 0;

  const metrics = [
    { value: formatNumber(data?.pages.length ?? 0), label: 'Pages uploaded', href: '/usage' },
    { value: formatNumber(data?.projects.length ?? 0), label: data?.projects.length === 1 ? 'Project' : 'Projects', href: '/projects' },
    { value: formatNumber(regions), label: 'Text regions', href: '/projects' },
    { value: formatNumber(approved), label: 'Approved translations', href: '/memory' },
  ];

  return (
    <AppShellPage>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}.`}
        lede={
          !data
            ? ' '
            : waiting > 0
              ? `${waiting} ${waiting === 1 ? 'chapter is' : 'chapters are'} waiting on you.`
              : data.projects.length
                ? 'Everything is up to date.'
                : 'Start by creating a project or trying the sample.'
        }
        actions={
          <Button href="/translate" size="md">
            <Plus size={15} />
            New translation
          </Button>
        }
      />

      {ws.error && (
        <p role="alert" className="mt-6 rounded-xl bg-dangerSoft px-4 py-3 text-[13px] text-danger">
          Your workspace couldn’t be loaded: {ws.error.message}
        </p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl2 border border-line bg-line lg:grid-cols-4">
        {metrics.map((m) => (
          <Link key={m.label} href={m.href} className="group bg-surface p-5 transition-colors hover:bg-canvas">
            <dd className="text-[30px] font-semibold tabular-nums tracking-[-0.035em]">{data ? m.value : <Skeleton className="h-9 w-16" />}</dd>
            <dt className="mt-1 flex items-center gap-1 text-[13px] text-ink-muted">
              {m.label}
              <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </dt>
          </Link>
        ))}
      </dl>

      {data && data.projects.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<LibraryBig size={18} />}
          title="No projects yet."
          body="Create your first project to keep chapters, characters, and terminology organized — or open the sample to see the whole workflow."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCreating(true)}>Create project</Button>
              <Button variant="secondary" onClick={() => void loadSample()} loading={seeding}>
                <Sparkles size={14} />
                Try the sample project
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Continue working</h2>
              <Link href="/projects" className="text-[13px] text-ink-muted transition-colors hover:text-ink">
                All projects
              </Link>
            </div>
            <Card className="mt-4 overflow-hidden">
              {!data ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : data.chapters.length === 0 ? (
                <p className="px-5 py-6 text-[13.5px] text-ink-muted">
                  No chapters yet.{' '}
                  <Link href="/translate" className="font-medium text-ink underline underline-offset-2">
                    Upload one
                  </Link>{' '}
                  to start translating.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.chapters.slice(0, 5).map(({ chapter, project, stats, status }) => {
                    const tone = chapterStatus(status);
                    return (
                      <li key={chapter.id}>
                        <Link
                          href={`/translate/editor?chapter=${chapter.id}`}
                          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-canvas"
                        >
                          <span className="h-7 w-7 shrink-0 rounded-md" style={{ background: project?.coverColor }} aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="text-[14.5px] font-medium">{project?.name}</p>
                            <p className="text-[12.5px] text-ink-muted">
                              {chapter.name} · {LANGUAGE_LABELS[chapter.sourceLanguage]} → {LANGUAGE_LABELS[chapter.targetLanguage]}
                            </p>
                          </div>
                          <span className="text-[13px] tabular-nums text-ink-muted">
                            {formatNumber(stats.approved)} / {formatNumber(stats.regionCount)} approved
                          </span>
                          <StatusBadge tone={tone.tone} label={status === 'complete' ? 'Complete' : status === 'review' ? `${stats.progress}%` : tone.label} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </section>

          {data && (
            <section className="mt-10">
              <div className="flex items-end justify-between">
                <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Projects</h2>
                <button onClick={() => setCreating(true)} className="text-[13px] text-ink-muted transition-colors hover:text-ink">
                  + New project
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {data.projects.map((p) => {
                  const latest = data.chapters.find((c) => c.chapter.projectId === p.id);
                  return (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      latest={latest?.chapter}
                      latestStats={latest?.stats}
                      latestStatus={latest?.status}
                      totals={data.totalsByProject.get(p.id) ?? { chapters: 0, pages: 0, terms: 0 }}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <ProjectFormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="New project"
        submitLabel="Create project"
        onSubmit={async (v) => {
          const p = await createProject(workspace.id, v);
          toast({ message: `Created ${p.name}.`, tone: 'ok' });
          router.push(`/projects/${p.id}`);
        }}
      />
    </AppShellPage>
  );
}
