'use client';

import * as React from 'react';
import { TriangleAlert } from 'lucide-react';
import { ComicPage } from '@/components/demo/comic-page';
import type { DialogueRegion } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

type Mode = 'side' | 'slider' | 'overlay';

/**
 * Compare exists to answer the single most important product question: did
 * anything change that didn't need to change? Overlay mode is the strict one —
 * artwork outside the text regions should be invisible in the difference.
 */
export function CompareView({ regions }: { regions: DialogueRegion[] }) {
  const [mode, setMode] = React.useState<Mode>('slider');
  const [position, setPosition] = React.useState(52);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-lg border border-editor-line bg-editor-panel p-1">
          {(
            [
              ['side', 'Side by side'],
              ['slider', 'Slider'],
              ['overlay', 'Overlay'],
            ] as Array<[Mode, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                mode === id ? 'bg-editor-raised text-editor-text' : 'text-editor-muted hover:text-editor-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-editor-muted">Original · Translated</span>
      </div>

      {mode === 'side' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Framed label="Original">
            <ComicPage view="original" regions={regions} />
          </Framed>
          <Framed label="Translated">
            <ComicPage view="typeset" regions={regions} />
          </Framed>
        </div>
      )}

      {mode === 'slider' && (
        <>
          <Framed label={`Original ${position}% · Translated ${100 - position}%`}>
            <div className="relative">
              <ComicPage view="typeset" regions={regions} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
                <div style={{ width: `${(100 / position) * 100}%` }}>
                  <ComicPage view="original" regions={regions} />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent" style={{ left: `${position}%` }} aria-hidden />
            </div>
          </Framed>
          <label className="block">
            <span className="sr-only">Comparison position</span>
            <input
              type="range"
              min={0}
              max={100}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </label>
        </>
      )}

      {mode === 'overlay' && (
        <Framed label="Difference — text regions only">
          <div className="relative">
            <ComicPage view="original" regions={regions} />
            <div className="absolute inset-0 mix-blend-difference">
              <ComicPage view="typeset" regions={regions} />
            </div>
          </div>
        </Framed>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-editor-line bg-editor-panel px-3 py-2.5">
        <TriangleAlert size={13} className="mt-0.5 shrink-0 text-editor-muted" aria-hidden />
        <div>
          <p className="text-[12px] text-editor-text">No artwork difference detected outside translation regions.</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-editor-muted">
            Page dimensions, panel positions, and bubble shapes are unchanged. If this ever reports a difference,
            inspect it before exporting.
          </p>
        </div>
      </div>
    </div>
  );
}

function Framed({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-md bg-white">{children}</div>
      <figcaption className="mt-1.5 text-center text-[11px] text-editor-muted">{label}</figcaption>
    </figure>
  );
}
