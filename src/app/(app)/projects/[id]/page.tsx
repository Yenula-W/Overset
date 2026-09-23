import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Plus } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { chapterStatus } from '@/components/app/project-card';
import { ProjectPreferences } from '@/components/app/project-preferences';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, Progress, StatusBadge } from '@/components/ui';
import { chaptersForProject, DEMO_PROJECTS, DEMO_TEAM, projectById } from '@/lib/data/workspace';
import { DEMO_CHARACTERS } from '@/lib/data/characters';
import { DEMO_GLOSSARY } from '@/lib/data/glossary';
import { LANGUAGE_LABELS } from '@/lib/types/domain';
import { formatNumber } from '@/lib/utils';

export function generateStaticParams() {
  return DEMO_PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: projectById(id)?.name ?? 'Project' };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projectById(id);
  if (!project) notFound();

  const chapters = chaptersForProject(project.id);
  const team = DEMO_TEAM.filter((m) => project.teamMemberIds.includes(m.id));
  const characters = DEMO_CHARACTERS.slice(0, 4);
  const glossary = DEMO_GLOSSARY.slice(0, 5);

  return (
    <AppShellPage>
      <div className="flex items-start gap-4">
        <span className="h-12 w-12 shrink-0 rounded-xl" style={{ background: project.coverColor }} aria-hidden />
        <PageHeader
          className="flex-1"
          title={project.name}
          lede={`${LANGUAGE_LABELS[project.sourceLanguage]} → ${LANGUAGE_LABELS[project.targetLanguage]} · ${project.chapterCount} chapters · ${formatNumber(project.pageCount)} pages`}
          actions={
            <Button href="/translate">
              <Plus size={15} />
              New chapter
            </Button>
          }
        />
      </div>

      {project.description && <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">{project.description}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chapters</CardTitle>
              <span className="text-[12.5px] text-ink-muted">{chapters.length} in this project</span>
            </CardHeader>
            <ul className="divide-y divide-line">
              {chapters.map((c) => {
                const status = chapterStatus(c.status);
                return (
                  <li key={c.id}>
                    <Link href="/translate/editor" className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-medium">{c.name}</p>
                        <p className="text-[12.5px] text-ink-muted">
                          {c.pageCount} pages · {formatNumber(c.approvedRegionCount)} / {formatNumber(c.regionCount)} regions approved
                        </p>
                      </div>
                      <div className="w-28">
                        <Progress value={c.progress} label={`${c.name} progress`} />
                      </div>
                      <StatusBadge tone={status.tone} label={status.label} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          <ProjectPreferences preferences={project.preferences} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-2.5 text-[13px]">
                {[
                  ['Chapters', String(project.chapterCount)],
                  ['Pages', formatNumber(project.pageCount)],
                  ['Characters', String(project.characterCount)],
                  ['Glossary terms', String(project.glossaryCount)],
                  ['Last updated', new Date(project.updatedAt).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Characters</CardTitle>
              <Link href="/characters" className="text-[12.5px] text-ink-muted hover:text-ink">
                All <ArrowUpRight size={11} className="inline" aria-hidden />
              </Link>
            </CardHeader>
            <ul className="divide-y divide-line">
              {characters.map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 px-5 py-2.5">
                  <span className="h-6 w-6 rounded-full" style={{ background: c.color }} aria-hidden />
                  <span className="flex-1 text-[13px] font-medium">{c.name}</span>
                  <span className="text-[12px] text-ink-muted">{c.role}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Glossary</CardTitle>
              <Link href="/glossary" className="text-[12.5px] text-ink-muted hover:text-ink">
                All <ArrowUpRight size={11} className="inline" aria-hidden />
              </Link>
            </CardHeader>
            <ul className="divide-y divide-line">
              {glossary.map((g) => (
                <li key={g.id} className="flex items-center gap-2 px-5 py-2.5">
                  <span className="text-[13px] font-medium">{g.original}</span>
                  <span className="text-ink-faint" aria-hidden>→</span>
                  <span className="flex-1 truncate text-[13px] text-ink-muted">{g.translation}</span>
                  {g.status === 'locked' && <Badge tone="accent">Locked</Badge>}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <Link href="/team" className="text-[12.5px] text-ink-muted hover:text-ink">
                Manage <ArrowUpRight size={11} className="inline" aria-hidden />
              </Link>
            </CardHeader>
            <ul className="divide-y divide-line">
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 px-5 py-2.5">
                  <Avatar name={m.name} color={m.avatarColor} size={24} />
                  <span className="flex-1 text-[13px] font-medium">{m.name}</span>
                  <span className="text-[12px] capitalize text-ink-muted">{m.role}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AppShellPage>
  );
}
