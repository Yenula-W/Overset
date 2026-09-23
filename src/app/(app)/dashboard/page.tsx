import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { ProjectCard, chapterStatus } from '@/components/app/project-card';
import { Button, Card, StatusBadge } from '@/components/ui';
import { DEMO_CHAPTERS, DEMO_PROJECTS, DEMO_USER, projectById } from '@/lib/data/workspace';
import { LANGUAGE_LABELS } from '@/lib/types/domain';
import { formatNumber, greeting } from '@/lib/utils';

export const metadata: Metadata = { title: 'Home' };

const METRICS = [
  { value: '621', label: 'Pages translated', href: '/usage' },
  { value: '14', label: 'Projects', href: '/projects' },
  { value: '38,491', label: 'Dialogue bubbles', href: '/memory' },
  { value: '8.3 hrs', label: 'Estimated processing time saved', href: '/usage' },
];

export default function DashboardPage() {
  const recent = DEMO_CHAPTERS.slice(0, 3);

  return (
    <AppShellPage>
      <PageHeader
        title={`${greeting()}, ${DEMO_USER.name}.`}
        lede="Three chapters are waiting on you."
        actions={
          <Button href="/translate" size="md">
            <Plus size={15} />
            New translation
          </Button>
        }
      />

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl2 border border-line bg-line lg:grid-cols-4">
        {METRICS.map((m) => (
          <Link key={m.label} href={m.href} className="group bg-surface p-5 transition-colors hover:bg-canvas">
            <dd className="text-[30px] font-semibold tracking-[-0.035em] tabular-nums">{m.value}</dd>
            <dt className="mt-1 flex items-center gap-1 text-[13px] text-ink-muted">
              {m.label}
              <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </dt>
          </Link>
        ))}
      </dl>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Continue working</h2>
          <Link href="/projects" className="text-[13px] text-ink-muted transition-colors hover:text-ink">
            All projects
          </Link>
        </div>
        <Card className="mt-4 overflow-hidden">
          <ul className="divide-y divide-line">
            {recent.map((chapter) => {
              const project = projectById(chapter.projectId);
              const status = chapterStatus(chapter.status);
              return (
                <li key={chapter.id}>
                  <Link href="/translate/editor" className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-canvas">
                    <span className="h-7 w-7 shrink-0 rounded-md" style={{ background: project?.coverColor }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-medium">{project?.name}</p>
                      <p className="text-[12.5px] text-ink-muted">
                        {chapter.name} · {project ? `${LANGUAGE_LABELS[project.sourceLanguage]} → ${LANGUAGE_LABELS[project.targetLanguage]}` : ''}
                      </p>
                    </div>
                    <span className="text-[13px] tabular-nums text-ink-muted">
                      {formatNumber(chapter.approvedRegionCount)} / {formatNumber(chapter.regionCount)} approved
                    </span>
                    <StatusBadge tone={status.tone} label={chapter.status === 'complete' ? 'Complete' : `${chapter.progress}%`} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Projects</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DEMO_PROJECTS.map((p) => (
            <ProjectCard key={p.id} project={p} latest={DEMO_CHAPTERS.find((c) => c.projectId === p.id)} />
          ))}
        </div>
      </section>
    </AppShellPage>
  );
}
