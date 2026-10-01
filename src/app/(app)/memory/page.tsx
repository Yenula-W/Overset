'use client';

import * as React from 'react';
import { Languages, Search, Trash2 } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { NoProjects, ProjectPicker, useProjectChoice } from '@/components/app/project-picker';
import { ConfirmModal } from '@/components/app/project-form';
import { Button, Card, EmptyState, Input, Skeleton, Textarea, useToast } from '@/components/ui';
import { useLiveQuery, useUser, useActiveWorkspace } from '@/lib/store/hooks';
import { applyTranslationGlobally, deleteMemoryEntry, listMemory, updateMemoryEntry } from '@/lib/store/repo';
import type { MemoryRecord } from '@/lib/store/schema';

export default function MemoryPage() {
  const user = useUser();
  const workspace = useActiveWorkspace();
  const toast = useToast();
  const { projects, project, choose, loading } = useProjectChoice();
  const [query, setQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [globalFor, setGlobalFor] = React.useState<MemoryRecord | null>(null);
  const [deleting, setDeleting] = React.useState<MemoryRecord | null>(null);

  const memory = useLiveQuery(() => (project ? listMemory(workspace.id, project.id) : Promise.resolve([])), [workspace.id, project?.id], ['memory']);

  if (!loading && projects?.length === 0) {
    return (
      <AppShellPage>
        <PageHeader title="Translation memory" />
        <NoProjects what="Translation memories" />
      </AppShellPage>
    );
  }

  const q = query.trim().toLowerCase();
  const results = (memory.data ?? []).filter(
    (m) => !q || [m.sourceText, m.translation, m.speakerName, m.chapterName, m.context].some((f) => f?.toLowerCase().includes(q)),
  );

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: 'Translation copied — paste it into any region.', tone: 'ok' });
    } catch {
      toast({ message: 'Your browser blocked the clipboard. Select the text and copy it instead.', tone: 'warn' });
    }
  }

  return (
    <AppShellPage>
      <PageHeader title="Translation memory" lede="Every translation you approve is saved here and offered again when the same line comes back." />

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search source or translated dialogue" className="pl-9" aria-label="Search translation memory" />
        </div>
        {projects && project && <ProjectPicker projects={projects} value={project.id} onChange={choose} />}
      </div>

      {!memory.data ? (
        <Skeleton className="mt-5 h-40" />
      ) : results.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Languages size={18} />}
          title={q ? 'Nothing matches that search.' : 'Nothing here yet.'}
          body={q ? 'Try a shorter phrase, or search by character name or chapter.' : 'Approved translations will automatically appear here and be offered again in later chapters.'}
          action={q ? <Button onClick={() => setQuery('')}>Clear search</Button> : undefined}
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {results.map((m) => (
            <li key={m.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
                  <span className="font-medium text-ink">{m.chapterName}</span>
                  <span>{m.regionLabel}</span>
                  {m.speakerName && <span>· {m.speakerName}</span>}
                  <span className="ml-auto">
                    {new Date(m.approvedAt).toLocaleDateString()} · {m.occurrences} {m.occurrences === 1 ? 'occurrence' : 'occurrences'}
                  </span>
                </div>
                <p className="mt-3 text-[14px] text-ink-muted" lang="ko">
                  {m.sourceText}
                </p>
                {editingId === m.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Edit translation" autoFocus />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!draft.trim()}
                        onClick={async () => {
                          await updateMemoryEntry(workspace.id, m.id, draft);
                          setEditingId(null);
                          toast({ message: 'Memory updated. Existing chapters are unchanged.', tone: 'ok' });
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[17px] leading-relaxed">{m.translation}</p>
                )}
                {m.context && <p className="mt-2.5 text-[12.5px] text-ink-faint">{m.context}</p>}
                {editingId !== m.id && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                    <Button size="sm" onClick={() => void copy(m.translation)}>
                      Use translation
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(m.id);
                        setDraft(m.translation);
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setGlobalFor(m)}>
                      Change globally
                    </Button>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setDeleting(m)} aria-label="Delete memory entry">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={globalFor !== null}
        onClose={() => setGlobalFor(null)}
        title="Change this line everywhere?"
        confirmLabel="Change globally"
        body={
          <>
            Every region in <strong className="text-ink">{project?.name}</strong> whose source text is “{globalFor?.sourceText}” will be set to “
            {globalFor?.translation}” and marked for re-approval. Each change is recorded in that chapter’s version history.
          </>
        }
        onConfirm={async () => {
          if (!globalFor || !project) return;
          const n = await applyTranslationGlobally(workspace.id, project.id, globalFor.sourceText, globalFor.translation, user.name);
          toast({ message: n ? `Updated ${n} ${n === 1 ? 'region' : 'regions'}.` : 'Every matching region already uses this translation.', tone: 'ok' });
        }}
      />

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this memory entry?"
        confirmLabel="Delete"
        body="It won’t be suggested again. Existing translations aren’t changed."
        onConfirm={async () => {
          if (deleting) await deleteMemoryEntry(workspace.id, deleting.id);
        }}
      />
    </AppShellPage>
  );
}
