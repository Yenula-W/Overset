'use client';

import * as React from 'react';
import { Plus, UsersRound } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { Badge, Button, Card, EmptyState, Modal } from '@/components/ui';
import { DEMO_CHARACTERS } from '@/lib/data/characters';
import { DEMO_MEMORY } from '@/lib/data/workspace';
import type { Character } from '@/lib/types/domain';
import { formatNumber } from '@/lib/utils';

export default function CharactersPage() {
  const [selected, setSelected] = React.useState<Character | null>(null);

  if (DEMO_CHARACTERS.length === 0) {
    return (
      <AppShellPage>
        <PageHeader title="Characters" />
        <EmptyState
          className="mt-8"
          icon={<UsersRound size={18} />}
          title="No characters identified yet."
          body="Characters detected during translation can be saved here, along with their voice and speech rules."
          action={<Button href="/translate">Translate a chapter</Button>}
        />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage>
      <PageHeader
        title="Characters"
        lede="The Fallen Hero · voice, formality, and speech rules PanelFlow applies when translating each speaker."
        actions={
          <Button>
            <Plus size={15} />
            Add character
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DEMO_CHARACTERS.map((c) => (
          <button key={c.id} onClick={() => setSelected(c)} className="text-left">
            <Card className="h-full p-5 transition-[border-color,box-shadow] hover:border-ink/20 hover:shadow-card">
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                <div className="min-w-0">
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{c.name}</h3>
                  <p className="text-[12.5px] text-ink-muted">{c.role}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.voice.map((v) => (
                  <Badge key={v}>{v}</Badge>
                ))}
              </div>
              <dl className="mt-4 flex gap-5 border-t border-line pt-3.5 text-[12px] text-ink-muted">
                <div>
                  <dt className="sr-only">Formality</dt>
                  <dd className="capitalize">
                    <span className="font-medium text-ink">{c.formality}</span> formality
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Approved lines</dt>
                  <dd>
                    <span className="font-medium text-ink">{formatNumber(c.dialogueCount)}</span> lines
                  </dd>
                </div>
              </dl>
            </Card>
          </button>
        ))}
      </div>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.name ?? ''} description={selected?.role} size="lg">
        {selected && (
          <div className="space-y-6">
            {selected.aliases.length > 0 && (
              <Block label="Aliases">
                <p className="text-[14px] text-ink-muted">{selected.aliases.join(' · ')}</p>
              </Block>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Block label="Voice">
                <div className="flex flex-wrap gap-1.5">
                  {selected.voice.map((v) => (
                    <Badge key={v} tone="accent">
                      {v}
                    </Badge>
                  ))}
                </div>
              </Block>
              <Block label="Personality">
                <div className="flex flex-wrap gap-1.5">
                  {selected.personality.map((p) => (
                    <Badge key={p}>{p}</Badge>
                  ))}
                </div>
              </Block>
              <Block label="Formality">
                <p className="text-[14px] capitalize text-ink-muted">{selected.formality}</p>
              </Block>
              <Block label="Slang">
                <p className="text-[14px] capitalize text-ink-muted">{selected.slang}</p>
              </Block>
            </div>

            <Block label="Speech rules">
              <ul className="space-y-1.5">
                {selected.speechRules.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-[14px] leading-relaxed text-ink-muted">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </Block>

            {selected.relationships.length > 0 && (
              <Block label="Relationships">
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {selected.relationships.map((r) => (
                    <li key={r.characterId} className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-ink-muted">{r.relation}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            <Block label="Approved dialogue">
              <ul className="space-y-2">
                {DEMO_MEMORY.filter((m) => m.speakerId === selected.id).map((m) => (
                  <li key={m.id} className="rounded-xl border border-line px-3.5 py-3">
                    <p className="text-[13px] text-ink-muted">{m.sourceText}</p>
                    <p className="mt-1 text-[14px]">{m.translation}</p>
                    <p className="mt-1.5 text-[12px] text-ink-faint">
                      {m.chapterName} · {m.regionLabel}
                    </p>
                  </li>
                ))}
                {DEMO_MEMORY.filter((m) => m.speakerId === selected.id).length === 0 && (
                  <li className="text-[13.5px] text-ink-muted">No approved lines saved for this character yet.</li>
                )}
              </ul>
            </Block>

            {selected.notes && (
              <p className="rounded-lg bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">{selected.notes}</p>
            )}
          </div>
        )}
      </Modal>
    </AppShellPage>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{label}</p>
      {children}
    </div>
  );
}
