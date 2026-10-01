'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { chapterStatus } from '@/components/app/project-card';
import { ProjectPreferences } from '@/components/app/project-preferences';
import { ConfirmModal, ProjectFormModal } from '@/components/app/project-form';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Input, Modal, Progress, Skeleton, StatusBadge, useToast } from '@/components/ui';
import { useLiveQuery, useActiveWorkspace } from '@/lib/store/hooks';
import {
  deleteChapter,
  deleteProject,
  getProject,
  listChapters,
  listCharacters,
  listGlossary,
  listMemory,
  listPages,
  listTeam,
  updateChapter,
  updateProject,
} from '@/lib/store/repo';
import { chapterStats, effectiveStatus } from '@/lib/stats';
import type { ChapterRecord } from '@/lib/store/schema';
import { LANGUAGE_LABELS } from '@/lib/types/domain';
import { formatNumber } from '@/lib/utils';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const workspace = useActiveWorkspace();
  const router = useRouter();
  const toast = useToast();

  const data = useLiveQuery(
    async () => {
      const project = await getProject(workspace.id, id);
      const [chapters, characters, glossary, memory, team] = await Promise.all([
        listChapters(workspace.id, id),
        listCharacters(workspace.id, id),
        listGlossary(workspace.id, id),
        listMemory(workspace.id, id),
        listTeam(workspace.id),
      ]);
      const withStats = await Promise.all(
        chapters.map(async (c) => {
          const stats = chapterStats(await listPages(workspace.id, c.id));
          return { chapter: c, stats, status: effectiveStatus(c, stats) };
        }),
      );
      return { project, chapters: withStats, characters, glossary, memory, team };
    },
    [workspace.id, id],
    ['projects', 'chapters', 'pages', 'characters', 'glossary', 'memory', 'team'],
  );

  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [renaming, setRenaming] = React.useState<ChapterRecord | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [removing, setRemoving] = React.useState<ChapterRecord | null>(null);

  if (data.error) {
    return (
      <AppShellPage>
        <EmptyState
          title="This project isn’t available."
          body="It may have been deleted, or it belongs to a different account."
          action={<Button href="/projects">Back to projects</Button>}
        />
      </AppShellPage>
    );
  }

  if (!data.data) {
    return (
      <AppShellPage>
        <Skeleton className="h-12 w-72" />
        <Skeleton className="mt-8 h-64" />
      </AppShellPage>
    );
  }

  const { project, chapters, characters, glossary, memory, team } = data.data;
  const pages = chapters.reduce((s, c) => s + c.stats.pageCount, 0);

  return (
    <AppShellPage>
      <div className="flex items-start gap-4">
        <span className="h-12 w-12 shrink-0 rounded-xl" style={{ background: project.coverColor }} aria-hidden />
        <PageHeader
          className="flex-1"
          title={project.name}
          lede={`${LANGUAGE_LABELS[project.sourceLanguage]} → ${LANGUAGE_LABELS[project.targetLanguage]} · ${chapters.length} ${chapters.length === 1 ? 'chapter' : 'chapters'} · ${formatNumber(pages)} pages`}
          actions={workspace.canEdit &&
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Edit project">
                <Pencil size={14} />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(true)} aria-label="Delete project">
                <Trash2 size={14} />
                Delete
              </Button>
              <Button href={`/translate?project=${project.id}`}>
                <Plus size={15} />
                New chapter
              </Button>
            </>
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
            {chapters.length === 0 ? (
              <CardBody>
                <p className="text-[13.5px] text-ink-muted">
                  No chapters yet.{' '}
                  <Link href={`/translate?project=${project.id}`} className="font-medium text-ink underline underline-offset-2">
                    Upload the first one
                  </Link>
                  .
                </p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-line">
                {chapters.map(({ chapter: c, stats, status }) => {
                  const tone = chapterStatus(status);
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                      <Link href={`/translate/editor?chapter=${c.id}`} className="min-w-0 flex-1 hover:underline">
                        <p className="text-[14.5px] font-medium">{c.name}</p>
                        <p className="text-[12.5px] text-ink-muted">
                          {stats.pageCount} {stats.pageCount === 1 ? 'page' : 'pages'} · {formatNumber(stats.approved)} / {formatNumber(stats.regionCount)} regions approved
                        </p>
                      </Link>
                      <div className="w-28">
                        <Progress value={stats.progress} label={`${c.name} progress`} />
                      </div>
                      <StatusBadge tone={tone.tone} label={tone.label} />
                      <div hidden={!workspace.canEdit} className={workspace.canEdit ? "flex gap-0.5" : "hidden"}>
                        <button
                          onClick={() => {
                            setRenaming(c);
                            setRenameValue(c.name);
                          }}
                          className="rounded-md p-1.5 text-ink-faint hover:bg-ink/5 hover:text-ink"
                          aria-label={`Rename ${c.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setRemoving(c)} className="rounded-md p-1.5 text-ink-faint hover:bg-ink/5 hover:text-danger" aria-label={`Delete ${c.name}`}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <ProjectPreferences
            preferences={project.preferences}
            onSave={async (preferences) => {
              await updateProject(workspace.id, project.id, { preferences });
              toast({ message: 'Preferences saved. New chapters will use them.', tone: 'ok' });
            }}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-2.5 text-[13px]">
                {[
                  ['Chapters', String(chapters.length)],
                  ['Pages', formatNumber(pages)],
                  ['Text regions', formatNumber(chapters.reduce((s, c) => s + c.stats.regionCount, 0))],
                  ['Approved', formatNumber(chapters.reduce((s, c) => s + c.stats.approved, 0))],
                  ['Memory entries', formatNumber(memory.length)],
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

          <SideList title="Characters" href={`/characters?project=${project.id}`} empty="No characters yet.">
            {characters.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center gap-2.5 px-5 py-2.5">
                <span className="h-6 w-6 rounded-full" style={{ background: c.color }} aria-hidden />
                <span className="flex-1 text-[13px] font-medium">{c.name}</span>
                <span className="text-[12px] text-ink-muted">{c.role}</span>
              </li>
            ))}
          </SideList>

          <SideList title="Glossary" href={`/glossary?project=${project.id}`} empty="No terms yet.">
            {glossary.slice(0, 5).map((g) => (
              <li key={g.id} className="flex items-center gap-2 px-5 py-2.5">
                <span className="text-[13px] font-medium">{g.original}</span>
                <span className="text-ink-faint" aria-hidden>
                  →
                </span>
                <span className="flex-1 truncate text-[13px] text-ink-muted">{g.translation}</span>
                {g.status === 'locked' && <Badge tone="accent">Locked</Badge>}
              </li>
            ))}
          </SideList>

          <SideList title="Team" href="/team" linkLabel="Manage" empty="Just you so far.">
            {team.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 px-5 py-2.5">
                <Avatar name={m.name} color={m.avatarColor} size={24} />
                <span className="flex-1 text-[13px] font-medium">{m.name}</span>
                <span className="text-[12px] capitalize text-ink-muted">{m.role}</span>
              </li>
            ))}
          </SideList>
        </div>
      </div>

      <ProjectFormModal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit project"
        submitLabel="Save"
        initial={project}
        onSubmit={async (v) => {
          await updateProject(workspace.id, project.id, v);
          toast({ message: 'Project updated.', tone: 'ok' });
        }}
      />

      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        title={`Delete ${project.name}?`}
        confirmLabel="Delete project"
        body={`This removes ${chapters.length} ${chapters.length === 1 ? 'chapter' : 'chapters'}, ${formatNumber(pages)} uploaded ${pages === 1 ? 'page' : 'pages'}, and the project’s glossary, characters, and translation memory.`}
        onConfirm={async () => {
          await deleteProject(workspace.id, project.id);
          toast({ message: `${project.name} was deleted.`, tone: 'ok' });
          router.replace('/projects');
        }}
      />

      <ConfirmModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Delete ${removing?.name ?? 'chapter'}?`}
        confirmLabel="Delete chapter"
        body="Its pages, regions, comments, and history are removed. Translation memory from approved lines is kept."
        onConfirm={async () => {
          if (!removing) return;
          await deleteChapter(workspace.id, removing.id);
          toast({ message: `${removing.name} was deleted.`, tone: 'ok' });
        }}
      />

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Rename chapter"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim()}
              onClick={async () => {
                if (!renaming) return;
                await updateChapter(workspace.id, renaming.id, { name: renameValue.trim() });
                setRenaming(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} aria-label="Chapter name" autoFocus />
      </Modal>
    </AppShellPage>
  );
}

function SideList({
  title,
  href,
  linkLabel = 'All',
  empty,
  children,
}: {
  title: string;
  href: string;
  linkLabel?: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Link href={href} className="text-[12.5px] text-ink-muted hover:text-ink">
          {linkLabel} <ArrowUpRight size={11} className="inline" aria-hidden />
        </Link>
      </CardHeader>
      {children.length ? <ul className="divide-y divide-line">{children}</ul> : <p className="px-5 py-4 text-[13px] text-ink-muted">{empty}</p>}
    </Card>
  );
}
