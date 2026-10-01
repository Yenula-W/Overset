'use client';

import * as React from 'react';
import { Plus, Trash2, UsersRound, X } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { NoProjects, ProjectPicker, useProjectChoice } from '@/components/app/project-picker';
import { ConfirmModal } from '@/components/app/project-form';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { useLiveQuery, useUser } from '@/lib/store/hooks';
import { deleteCharacter, listChapters, listCharacters, listMemory, listPages, saveCharacter } from '@/lib/store/repo';
import type { CharacterRecord } from '@/lib/store/schema';
import type { Character } from '@/lib/types/domain';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#6C63E8', '#4F8A5B', '#B4833A', '#B4544A', '#3F7CAC', '#8A5BA8', '#2F2F36'];

const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function CharactersPage() {
  const user = useUser();
  const toast = useToast();
  const { projects, project, choose, loading } = useProjectChoice();
  const [editing, setEditing] = React.useState<Partial<CharacterRecord> | null>(null);

  const data = useLiveQuery(
    async () => {
      if (!project) return null;
      const [characters, memory, chapters] = await Promise.all([
        listCharacters(user.id, project.id),
        listMemory(user.id, project.id),
        listChapters(user.id, project.id),
      ]);
      // Lines per speaker come from the chapters themselves.
      const lines = new Map<string, number>();
      for (const c of chapters)
        for (const p of await listPages(user.id, c.id))
          for (const r of p.regions) if (r.speakerId) lines.set(r.speakerId, (lines.get(r.speakerId) ?? 0) + 1);
      return { characters, memory, lines };
    },
    [user.id, project?.id],
    ['characters', 'memory', 'pages', 'chapters'],
  );

  if (!loading && projects?.length === 0) {
    return (
      <AppShellPage>
        <PageHeader title="Characters" />
        <NoProjects what="Characters" />
      </AppShellPage>
    );
  }

  const characters = data.data?.characters ?? [];
  const blank: Partial<CharacterRecord> = { color: COLORS[characters.length % COLORS.length], aliases: [], voice: [], personality: [], formality: 'medium', slang: 'light', speechRules: [], relationships: [], dialogueCount: 0 };

  return (
    <AppShellPage>
      <PageHeader
        title="Characters"
        lede={project ? `${project.name} · voice, formality, and speech rules shown beside each speaker’s lines.` : ' '}
        actions={
          <Button onClick={() => setEditing(blank)} disabled={!project}>
            <Plus size={15} />
            Add character
          </Button>
        }
      />
      {projects && project && (
        <div className="mt-6">
          <ProjectPicker projects={projects} value={project.id} onChange={choose} />
        </div>
      )}

      {!data.data ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : characters.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<UsersRound size={18} />}
          title="No characters yet."
          body="Add recurring speakers so their voice and speech rules sit beside every line they say, and QA can catch slips."
          action={<Button onClick={() => setEditing(blank)}>Add character</Button>}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {characters.map((c) => (
            <button key={c.id} onClick={() => setEditing(c)} className="text-left">
              <Card className="h-full p-5 transition-[border-color,box-shadow] hover:border-ink/20 hover:shadow-card">
                <div className="flex items-start gap-3">
                  <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{c.name}</h3>
                    <p className="text-[12.5px] text-ink-muted">{c.role || 'No role set'}</p>
                  </div>
                </div>
                {c.voice.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.voice.map((v) => (
                      <Badge key={v}>{v}</Badge>
                    ))}
                  </div>
                )}
                <dl className="mt-4 flex gap-5 border-t border-line pt-3.5 text-[12px] text-ink-muted">
                  <div>
                    <dt className="sr-only">Formality</dt>
                    <dd className="capitalize">
                      <span className="font-medium text-ink">{c.formality}</span> formality
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Lines</dt>
                    <dd>
                      <span className="font-medium text-ink">{formatNumber(data.data!.lines.get(c.id) ?? 0)}</span> lines
                    </dd>
                  </div>
                </dl>
              </Card>
            </button>
          ))}
        </div>
      )}

      {project && (
        <CharacterModal
          character={editing}
          all={characters}
          history={editing?.id ? (data.data?.memory ?? []).filter((m) => m.speakerId === editing.id) : []}
          onClose={() => setEditing(null)}
          onSave={async (c) => {
            await saveCharacter(user.id, { ...c, projectId: project.id });
            toast({ message: c.id ? 'Character updated.' : `${c.name} added.`, tone: 'ok' });
          }}
          onDelete={async (id) => {
            await deleteCharacter(user.id, id);
            toast({ message: 'Character deleted.', tone: 'ok' });
          }}
        />
      )}
    </AppShellPage>
  );
}

function CharacterModal({
  character,
  all,
  history,
  onClose,
  onSave,
  onDelete,
}: {
  character: Partial<CharacterRecord> | null;
  all: CharacterRecord[];
  history: Array<{ id: string; sourceText: string; translation: string; chapterName: string; regionLabel: string }>;
  onClose: () => void;
  onSave: (c: Omit<CharacterRecord, 'id' | 'ownerId' | 'projectId'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [v, setV] = React.useState<Partial<CharacterRecord>>({});
  const [text, setText] = React.useState({ aliases: '', voice: '', personality: '', rules: '' });
  const [newRel, setNewRel] = React.useState({ characterId: '', relation: '' });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (!character) return;
    setV(character);
    setText({
      aliases: (character.aliases ?? []).join(', '),
      voice: (character.voice ?? []).join(', '),
      personality: (character.personality ?? []).join(', '),
      rules: (character.speechRules ?? []).join('\n'),
    });
    setNewRel({ characterId: '', relation: '' });
    setError(null);
  }, [character]);

  const others = all.filter((c) => c.id !== v.id);

  async function save() {
    if (!v.name?.trim()) {
      setError('Give the character a name.');
      return;
    }
    setBusy(true);
    try {
      await onSave({
        id: v.id,
        name: v.name.trim(),
        aliases: splitList(text.aliases),
        role: v.role?.trim() ?? '',
        color: v.color ?? COLORS[0],
        voice: splitList(text.voice),
        personality: splitList(text.personality),
        formality: (v.formality ?? 'medium') as Character['formality'],
        slang: (v.slang ?? 'light') as Character['slang'],
        speechRules: text.rules.split('\n').map((r) => r.trim()).filter(Boolean),
        relationships: v.relationships ?? [],
        dialogueCount: v.dialogueCount ?? 0,
        notes: v.notes?.trim() || undefined,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Modal
        open={character !== null && !confirming}
        onClose={onClose}
        title={character?.id ? v.name || 'Character' : 'Add character'}
        size="lg"
        footer={
          <>
            {character?.id && (
              <Button variant="ghost" className="mr-auto text-danger" onClick={() => setConfirming(true)}>
                <Trash2 size={14} />
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void save()} loading={busy}>
              {character?.id ? 'Save' : 'Add character'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && <p role="alert" className="rounded-lg bg-dangerSoft px-3 py-2.5 text-[13px] text-danger">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="c-name">
              <Input id="c-name" value={v.name ?? ''} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Role" htmlFor="c-role">
              <Input id="c-role" value={v.role ?? ''} onChange={(e) => setV({ ...v, role: e.target.value })} placeholder="e.g. Protagonist" />
            </Field>
          </div>
          <Field label="Aliases" htmlFor="c-alias" hint="Comma-separated.">
            <Input id="c-alias" value={text.aliases} onChange={(e) => setText({ ...text, aliases: e.target.value })} />
          </Field>
          <div>
            <p className="mb-1.5 text-[13px] font-medium">Colour</p>
            <div className="flex gap-2" role="radiogroup" aria-label="Colour">
              {COLORS.map((c) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={v.color === c}
                  aria-label={c}
                  onClick={() => setV({ ...v, color: c })}
                  className={`h-7 w-7 rounded-full ring-offset-2 ${v.color === c ? 'ring-2 ring-ink' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Voice" htmlFor="c-voice" hint="Comma-separated, e.g. Casual, Sarcastic">
              <Input id="c-voice" value={text.voice} onChange={(e) => setText({ ...text, voice: e.target.value })} />
            </Field>
            <Field label="Personality" htmlFor="c-pers" hint="Comma-separated.">
              <Input id="c-pers" value={text.personality} onChange={(e) => setText({ ...text, personality: e.target.value })} />
            </Field>
            <Field label="Formality" htmlFor="c-form" hint="High formality makes QA flag contractions.">
              <Select id="c-form" value={v.formality ?? 'medium'} onChange={(e) => setV({ ...v, formality: e.target.value as Character['formality'] })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field label="Slang" htmlFor="c-slang">
              <Select id="c-slang" value={v.slang ?? 'light'} onChange={(e) => setV({ ...v, slang: e.target.value as Character['slang'] })}>
                <option value="none">None</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </Select>
            </Field>
          </div>
          <Field label="Speech rules" htmlFor="c-rules" hint="One per line — shown beside every line this character speaks.">
            <Textarea id="c-rules" value={text.rules} onChange={(e) => setText({ ...text, rules: e.target.value })} />
          </Field>

          <div>
            <p className="mb-1.5 text-[13px] font-medium">Relationships</p>
            {(v.relationships ?? []).length > 0 && (
              <ul className="mb-2 divide-y divide-line rounded-xl border border-line">
                {(v.relationships ?? []).map((r) => (
                  <li key={r.characterId} className="flex items-center justify-between px-3.5 py-2 text-[13.5px]">
                    <span className="font-medium">{r.name}</span>
                    <span className="flex items-center gap-2 text-ink-muted">
                      {r.relation}
                      <button
                        onClick={() => setV({ ...v, relationships: (v.relationships ?? []).filter((x) => x.characterId !== r.characterId) })}
                        aria-label={`Remove relationship with ${r.name}`}
                        className="rounded p-0.5 hover:bg-ink/5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {others.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Select aria-label="Related character" value={newRel.characterId} onChange={(e) => setNewRel({ ...newRel, characterId: e.target.value })} className="max-w-[200px]">
                  <option value="">Choose a character…</option>
                  {others
                    .filter((o) => !(v.relationships ?? []).some((r) => r.characterId === o.id))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                </Select>
                <Input aria-label="Relationship" value={newRel.relation} onChange={(e) => setNewRel({ ...newRel, relation: e.target.value })} placeholder="e.g. Childhood friend" className="max-w-[220px]" />
                <Button
                  variant="secondary"
                  disabled={!newRel.characterId || !newRel.relation.trim()}
                  onClick={() => {
                    const other = others.find((o) => o.id === newRel.characterId);
                    if (!other) return;
                    setV({ ...v, relationships: [...(v.relationships ?? []), { characterId: other.id, name: other.name, relation: newRel.relation.trim() }] });
                    setNewRel({ characterId: '', relation: '' });
                  }}
                >
                  Add
                </Button>
              </div>
            ) : (
              <p className="text-[12.5px] text-ink-muted">Add other characters to record how they relate.</p>
            )}
          </div>

          <Field label="Notes" htmlFor="c-notes">
            <Textarea id="c-notes" value={v.notes ?? ''} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          </Field>

          {character?.id && (
            <div>
              <p className="mb-2 text-[13px] font-medium">Approved dialogue</p>
              {history.length === 0 ? (
                <p className="text-[12.5px] text-ink-muted">Lines you approve for this character will appear here.</p>
              ) : (
                <ul className="space-y-2">
                  {history.slice(0, 8).map((m) => (
                    <li key={m.id} className="rounded-xl border border-line px-3.5 py-3">
                      <p className="text-[13px] text-ink-muted">{m.sourceText}</p>
                      <p className="mt-1 text-[14px]">{m.translation}</p>
                      <p className="mt-1.5 text-[12px] text-ink-faint">
                        {m.chapterName} · {m.regionLabel}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete ${v.name ?? 'character'}?`}
        confirmLabel="Delete character"
        body="Lines assigned to them keep their text but lose the speaker."
        onConfirm={async () => {
          if (v.id) await onDelete(v.id);
          onClose();
        }}
      />
    </>
  );
}
