'use client';

import * as React from 'react';
import { BookMarked, Lock, Pencil, Plus, Search, Trash2, Unlock } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { NoProjects, ProjectPicker, useProjectChoice } from '@/components/app/project-picker';
import { ConfirmModal } from '@/components/app/project-form';
import { Badge, Button, Card, Checkbox, EmptyState, Field, Input, Modal, Select, Skeleton, Table, Td, Textarea, Th, Tr, useToast } from '@/components/ui';
import { useLiveQuery, useActiveWorkspace } from '@/lib/store/hooks';
import { deleteGlossaryEntry, listChapters, listCharacters, listGlossary, listPages, saveGlossaryEntry } from '@/lib/store/repo';
import type { GlossaryRecord } from '@/lib/store/schema';
import type { GlossaryStatus, GlossaryType } from '@/lib/types/domain';

const STATUS_TONE = { locked: 'accent', approved: 'ok', suggested: 'neutral' } as const;
const TYPES: GlossaryType[] = ['name', 'location', 'ability', 'organization', 'title', 'item', 'technique', 'idiom', 'honorific', 'term'];

interface Usage {
  count: number;
  first?: string;
  last?: string;
}

export default function GlossaryPage() {
  const workspace = useActiveWorkspace();
  const toast = useToast();
  const { projects, project, choose, loading } = useProjectChoice();
  const [query, setQuery] = React.useState('');
  const [editing, setEditing] = React.useState<Partial<GlossaryRecord> | null>(null);
  const [deleting, setDeleting] = React.useState<GlossaryRecord | null>(null);

  const data = useLiveQuery(
    async () => {
      if (!project) return null;
      const [entries, characters, chapters] = await Promise.all([
        listGlossary(workspace.id, project.id),
        listCharacters(workspace.id, project.id),
        listChapters(workspace.id, project.id),
      ]);
      // Usage is counted from the actual chapters, oldest first.
      const lines: Array<{ where: string; text: string }> = [];
      for (const c of [...chapters].sort((a, b) => a.number - b.number)) {
        for (const p of await listPages(workspace.id, c.id)) {
          for (const r of [...p.regions].sort((a, b) => a.readingOrder - b.readingOrder))
            if (r.sourceText) lines.push({ where: `${c.name} · page ${p.order}`, text: r.sourceText });
        }
      }
      const usage = new Map<string, Usage>();
      for (const e of entries) {
        const hits = lines.filter((l) => e.original && l.text.includes(e.original));
        usage.set(e.id, { count: hits.length, first: hits[0]?.where, last: hits[hits.length - 1]?.where });
      }
      return { entries, characters, usage };
    },
    [workspace.id, project?.id],
    ['glossary', 'characters', 'pages', 'chapters'],
  );

  if (!loading && projects?.length === 0) {
    return (
      <AppShellPage>
        <PageHeader title="Glossary" />
        <NoProjects what="Glossaries" />
      </AppShellPage>
    );
  }

  const entries = data.data?.entries ?? [];
  const q = query.trim().toLowerCase();
  const filtered = entries.filter((e) => !q || [e.original, e.translation, e.romanization, e.type, ...e.alternatives].some((f) => f?.toLowerCase().includes(q)));

  async function toggleLock(entry: GlossaryRecord) {
    const status: GlossaryStatus = entry.status === 'locked' ? 'approved' : 'locked';
    await saveGlossaryEntry(workspace.id, { ...entry, status });
    toast({ message: status === 'locked' ? `“${entry.original}” is locked.` : `“${entry.original}” is unlocked.`, tone: 'ok' });
  }

  return (
    <AppShellPage>
      <PageHeader
        title="Project glossary"
        lede={project ? `${project.name} · terminology QA checks every chapter against.` : ' '}
        actions={workspace.canEdit &&
          <Button onClick={() => setEditing({ status: 'approved', type: 'term', alternatives: [], characterIds: [] })} disabled={!project}>
            <Plus size={15} />
            Add term
          </Button>
        }
      />

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms" className="pl-9" aria-label="Search glossary" />
        </div>
        {projects && project && <ProjectPicker projects={projects} value={project.id} onChange={choose} />}
      </div>

      {!data.data ? (
        <Skeleton className="mt-5 h-48" />
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<BookMarked size={18} />}
          title={q ? 'No terms match that search.' : 'No terms yet.'}
          body={
            q
              ? 'Try a different spelling, or add the term so future chapters use it consistently.'
              : 'Add names, places, techniques, and titles. QA flags any translation that drifts from the approved wording.'
          }
          action={q ? <Button onClick={() => setQuery('')}>Clear search</Button> : workspace.canEdit ? <Button onClick={() => setEditing({ status: 'approved', type: 'term', alternatives: [], characterIds: [] })}>Add term</Button> : undefined}
        />
      ) : (
        <Card className="mt-5 overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Original</Th>
                <Th>Translation</Th>
                <Th>Type</Th>
                <Th className="text-right">Uses</Th>
                <Th>Status</Th>
                <Th className="w-0">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const u = data.data!.usage.get(e.id);
                return (
                  <Tr key={e.id}>
                    <Td>
                      <button onClick={() => setEditing(e)} className="text-left hover:underline">
                        <span className="font-medium">{e.original}</span>
                        {e.romanization && <span className="ml-2 text-[12px] italic text-ink-faint">{e.romanization}</span>}
                      </button>
                      {u?.first && <span className="block text-[11.5px] text-ink-faint">First seen {u.first}</span>}
                    </Td>
                    <Td>{e.translation}</Td>
                    <Td className="capitalize text-ink-muted">{e.type}</Td>
                    <Td className="text-right tabular-nums">{u?.count ?? 0}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[e.status]} className="capitalize">
                        {e.status}
                      </Badge>
                    </Td>
                    <Td>
                      <div hidden={!workspace.canEdit} className={workspace.canEdit ? "flex gap-0.5" : "hidden"}>
                        <IconBtn label={e.status === 'locked' ? `Unlock ${e.original}` : `Lock ${e.original}`} onClick={() => void toggleLock(e)}>
                          {e.status === 'locked' ? <Unlock size={13} /> : <Lock size={13} />}
                        </IconBtn>
                        <IconBtn label={`Edit ${e.original}`} onClick={() => setEditing(e)}>
                          <Pencil size={13} />
                        </IconBtn>
                        <IconBtn label={`Delete ${e.original}`} onClick={() => setDeleting(e)} danger>
                          <Trash2 size={13} />
                        </IconBtn>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {project && (
        <TermModal
          entry={editing}
          usage={editing?.id ? data.data?.usage.get(editing.id) : undefined}
          characters={data.data?.characters ?? []}
          onClose={() => setEditing(null)}
          onSave={async (v) => {
            await saveGlossaryEntry(workspace.id, { ...v, projectId: project.id, occurrences: v.id ? data.data?.usage.get(v.id)?.count ?? 0 : 0 });
            toast({ message: v.id ? 'Term updated.' : 'Term added.', tone: 'ok' });
          }}
        />
      )}

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete “${deleting?.original ?? ''}”?`}
        confirmLabel="Delete term"
        body="QA will stop checking translations against it. Existing translations aren’t changed."
        onConfirm={async () => {
          if (deleting) await deleteGlossaryEntry(workspace.id, deleting.id);
        }}
      />
    </AppShellPage>
  );
}

function TermModal({
  entry,
  usage,
  characters,
  onClose,
  onSave,
}: {
  entry: Partial<GlossaryRecord> | null;
  usage?: Usage;
  characters: Array<{ id: string; name: string; color: string }>;
  onClose: () => void;
  onSave: (v: Omit<GlossaryRecord, 'id' | 'ownerId' | 'projectId' | 'occurrences'> & { id?: string }) => Promise<void>;
}) {
  const [v, setV] = React.useState<Partial<GlossaryRecord>>({});
  const [alts, setAlts] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (entry) {
      setV(entry);
      setAlts((entry.alternatives ?? []).join(', '));
      setError(null);
    }
  }, [entry]);

  async function save() {
    if (!v.original?.trim() || !v.translation?.trim()) {
      setError('Both the original and the approved translation are required.');
      return;
    }
    setBusy(true);
    try {
      await onSave({
        id: v.id,
        original: v.original.trim(),
        romanization: v.romanization?.trim() || undefined,
        translation: v.translation.trim(),
        alternatives: alts.split(',').map((a) => a.trim()).filter(Boolean),
        type: (v.type ?? 'term') as GlossaryType,
        notes: v.notes?.trim() || undefined,
        status: (v.status ?? 'approved') as GlossaryStatus,
        firstAppearance: usage?.first ?? v.firstAppearance,
        lastAppearance: usage?.last ?? v.lastAppearance,
        characterIds: v.characterIds ?? [],
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const readOnly = !useActiveWorkspace().canEdit;
  return (
    <Modal
      open={entry !== null}
      onClose={onClose}
      title={readOnly ? 'Term details' : entry?.id ? 'Edit term' : 'Add term'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {!readOnly && <Button onClick={() => void save()} loading={busy}>
            {entry?.id ? 'Save' : 'Add term'}
          </Button>}
        </>
      }
    >
      <fieldset disabled={readOnly} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-dangerSoft px-3 py-2.5 text-[13px] text-danger">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Original" htmlFor="t-orig">
            <Input id="t-orig" value={v.original ?? ''} onChange={(e) => setV({ ...v, original: e.target.value })} autoFocus />
          </Field>
          <Field label="Romanization" htmlFor="t-rom">
            <Input id="t-rom" value={v.romanization ?? ''} onChange={(e) => setV({ ...v, romanization: e.target.value })} />
          </Field>
        </div>
        <Field label="Approved translation" htmlFor="t-tr">
          <Input id="t-tr" value={v.translation ?? ''} onChange={(e) => setV({ ...v, translation: e.target.value })} />
        </Field>
        <Field label="Alternatives" htmlFor="t-alt" hint="Comma-separated. QA names them when they slip into a translation.">
          <Input id="t-alt" value={alts} onChange={(e) => setAlts(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="t-type">
            <Select id="t-type" value={v.type ?? 'term'} onChange={(e) => setV({ ...v, type: e.target.value as GlossaryType })}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="t-status">
            <Select id="t-status" value={v.status ?? 'approved'} onChange={(e) => setV({ ...v, status: e.target.value as GlossaryStatus })}>
              <option value="suggested">Suggested — not enforced</option>
              <option value="approved">Approved — QA warns on drift</option>
              <option value="locked">Locked — drift is critical</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes" htmlFor="t-notes">
          <Textarea id="t-notes" value={v.notes ?? ''} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
        {characters.length > 0 && (
          <fieldset>
            <legend className="text-[13px] font-medium">Characters associated</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {characters.map((c) => (
                <Checkbox
                  key={c.id}
                  label={c.name}
                  checked={(v.characterIds ?? []).includes(c.id)}
                  onChange={(e) =>
                    setV({ ...v, characterIds: e.target.checked ? [...(v.characterIds ?? []), c.id] : (v.characterIds ?? []).filter((x) => x !== c.id) })
                  }
                />
              ))}
            </div>
          </fieldset>
        )}
        {entry?.id && (
          <dl className="grid grid-cols-3 gap-4 border-t border-line pt-4 text-[13px]">
            <div>
              <dt className="text-ink-muted">Uses</dt>
              <dd className="mt-0.5 font-medium">{usage?.count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">First appearance</dt>
              <dd className="mt-0.5 font-medium">{usage?.first ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Last appearance</dt>
              <dd className="mt-0.5 font-medium">{usage?.last ?? '—'}</dd>
            </div>
          </dl>
        )}
      </fieldset>
    </Modal>
  );
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={`rounded-md p-1.5 text-ink-faint hover:bg-ink/5 ${danger ? 'hover:text-danger' : 'hover:text-ink'}`}>
      {children}
    </button>
  );
}
