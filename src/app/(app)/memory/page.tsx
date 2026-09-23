'use client';

import * as React from 'react';
import { Languages, Search } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { Button, Card, EmptyState, Input, useToast } from '@/components/ui';
import { DEMO_MEMORY } from '@/lib/data/workspace';

export default function MemoryPage() {
  const [query, setQuery] = React.useState('');
  const toast = useToast();

  const results = DEMO_MEMORY.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [m.sourceText, m.translation, m.speakerName, m.chapterName, m.context].some((f) => f?.toLowerCase().includes(q));
  });

  return (
    <AppShellPage>
      <PageHeader title="Translation memory" lede="Every translation you approve becomes reusable across the project." />

      <div className="relative mt-7 max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search source or translated dialogue"
          className="pl-9"
          aria-label="Search translation memory"
        />
      </div>

      {results.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Languages size={18} />}
          title={query ? 'Nothing matches that search.' : 'Nothing here yet.'}
          body={
            query
              ? 'Try a shorter phrase, or search by character name or chapter.'
              : 'Approved translations will automatically appear here and be reused in later chapters.'
          }
          action={query ? <Button onClick={() => setQuery('')}>Clear search</Button> : undefined}
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
                    {new Date(m.approvedAt).toLocaleDateString()} · used {m.occurrences}×
                  </span>
                </div>
                <p className="mt-3 text-[14px] text-ink-muted">{m.sourceText}</p>
                <p className="mt-1.5 text-[17px] leading-relaxed">{m.translation}</p>
                <p className="mt-2.5 text-[12.5px] text-ink-faint">{m.context}</p>
                <div className="mt-4 flex gap-2 border-t border-line pt-4">
                  <Button size="sm" onClick={() => toast({ message: 'Translation applied to the selected region.', tone: 'ok' })}>
                    Use translation
                  </Button>
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast({ message: 'Applied to every occurrence in this project.', tone: 'info' })}
                  >
                    Change globally
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppShellPage>
  );
}
