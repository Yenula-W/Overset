'use client';

import * as React from 'react';
import { BookMarked, Lock, Plus, Search, Unlock } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { Badge, Button, Card, EmptyState, Input, Modal, Table, Td, Th, Tr } from '@/components/ui';
import { DEMO_GLOSSARY } from '@/lib/data/glossary';
import { DEMO_CHARACTERS } from '@/lib/data/characters';
import type { GlossaryEntry } from '@/lib/types/domain';

const STATUS_TONE = { locked: 'accent', approved: 'ok', suggested: 'neutral' } as const;

export default function GlossaryPage() {
  const [query, setQuery] = React.useState('');
  const [entries, setEntries] = React.useState(DEMO_GLOSSARY);
  const [selected, setSelected] = React.useState<GlossaryEntry | null>(null);

  const filtered = entries.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [e.original, e.translation, e.romanization, e.type].some((f) => f?.toLowerCase().includes(q));
  });

  function toggleLock(entry: GlossaryEntry) {
    const next = entry.status === 'locked' ? ('approved' as const) : ('locked' as const);
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: next } : e)));
    setSelected((s) => (s && s.id === entry.id ? { ...s, status: next } : s));
  }

  return (
    <AppShellPage>
      <PageHeader
        title="Project glossary"
        lede="The Fallen Hero · terminology Overset applies to every new chapter."
        actions={
          <Button>
            <Plus size={15} />
            Add term
          </Button>
        }
      />

      <div className="relative mt-7 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms" className="pl-9" aria-label="Search glossary" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<BookMarked size={18} />}
          title="No terms match that search."
          body="Try a different spelling, or add the term so future chapters use it consistently."
          action={<Button onClick={() => setQuery('')}>Clear search</Button>}
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <Tr key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                  <Td>
                    <span className="font-medium">{e.original}</span>
                    {e.romanization && <span className="ml-2 text-[12px] italic text-ink-faint">{e.romanization}</span>}
                  </Td>
                  <Td>{e.translation}</Td>
                  <Td className="capitalize text-ink-muted">{e.type}</Td>
                  <Td className="text-right tabular-nums">{e.occurrences}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[e.status]} className="capitalize">
                      {e.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.original ?? ''}
        description={selected?.romanization}
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button variant="secondary" onClick={() => toggleLock(selected)}>
                {selected.status === 'locked' ? <Unlock size={14} /> : <Lock size={14} />}
                {selected.status === 'locked' ? 'Unlock term' : 'Lock term'}
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <Detail label="Translation">
              <p className="text-[18px] font-medium">{selected.translation}</p>
            </Detail>
            {selected.alternatives.length > 0 && (
              <Detail label="Alternatives">
                <ul className="flex flex-wrap gap-1.5">
                  {selected.alternatives.map((a) => (
                    <li key={a} className="rounded-lg border border-line px-2.5 py-1 text-[13px] text-ink-muted">
                      {a}
                    </li>
                  ))}
                </ul>
              </Detail>
            )}
            {selected.notes && (
              <Detail label="Notes">
                <p className="text-[14px] leading-relaxed text-ink-muted">{selected.notes}</p>
              </Detail>
            )}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 text-[13px]">
              {[
                ['Occurrences', String(selected.occurrences)],
                ['Type', selected.type],
                ['First appearance', selected.firstAppearance ?? '—'],
                ['Last appearance', selected.lastAppearance ?? '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            {selected.characterIds.length > 0 && (
              <Detail label="Characters associated">
                <ul className="flex flex-wrap gap-1.5">
                  {selected.characterIds.map((id) => {
                    const c = DEMO_CHARACTERS.find((x) => x.id === id);
                    if (!c) return null;
                    return (
                      <li key={id} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[13px]">
                        <span className="h-2 w-2 rounded-full" style={{ background: c.color }} aria-hidden />
                        {c.name}
                      </li>
                    );
                  })}
                </ul>
              </Detail>
            )}
            {selected.status === 'locked' && (
              <p className="rounded-lg bg-accent-soft px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">
                This term is locked. Future translations use this wording unless you change it here.
              </p>
            )}
          </div>
        )}
      </Modal>
    </AppShellPage>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{label}</p>
      {children}
    </div>
  );
}
