'use client';

import * as React from 'react';
import { Tabs } from '@/components/ui';
import { ComicPage, type PageView } from '@/components/demo/comic-page';
import { DEMO_REGIONS } from '@/lib/data/chapter';

const STATES: Array<{ id: PageView; label: string; caption: string }> = [
  { id: 'original', label: 'Original', caption: 'The chapter exactly as it arrived. Nothing has been touched yet.' },
  { id: 'detected', label: 'Detected', caption: 'Dialogue, narration, SFX, and signs are found and classified separately.' },
  { id: 'translated', label: 'Translated', caption: 'Each region is translated with the conversation around it, not on its own.' },
  { id: 'cleaned', label: 'Cleaned', caption: 'Only the source text is removed. The artwork and the bubbles stay exactly as they were.' },
  { id: 'typeset', label: 'Typeset', caption: 'English is fitted back into the same bubbles, at the same size, on the same page.' },
];

/**
 * One page, five states. Using the same artwork across every tab is the point:
 * a visitor can see for themselves that nothing outside the text changed.
 */
export function WorkflowDemo() {
  const [view, setView] = React.useState<PageView>('original');
  const active = STATES.find((s) => s.id === view)!;

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
      <div className="order-2 overflow-hidden rounded-xl2 border border-line bg-[#26262B] p-5 sm:p-8 lg:order-1">
        <div className="mx-auto max-w-[460px] overflow-hidden rounded-md bg-white shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]">
          <ComicPage view={view} regions={DEMO_REGIONS} showLabels />
        </div>
      </div>

      <div className="order-1 lg:order-2 lg:sticky lg:top-24">
        <Tabs
          items={STATES.map((s) => ({ id: s.id, label: s.label }))}
          value={view}
          onChange={(id) => setView(id as PageView)}
          className="flex-wrap"
        />
        <p key={active.id} className="mt-5 animate-fade-in text-[15px] leading-relaxed text-ink-muted">
          {active.caption}
        </p>
        <dl className="mt-7 space-y-3 border-t border-line pt-5">
          <Row label="Page dimensions" value="840 × 1180 px — unchanged" />
          <Row label="Panels" value="4 detected, 0 moved" />
          <Row label="Text regions" value="7 (5 dialogue · 1 narration · 1 SFX)" />
          <Row label="Pixels modified" value="Text regions only" />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink">{value}</dd>
    </div>
  );
}
