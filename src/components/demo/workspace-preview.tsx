'use client';

import * as React from 'react';
import { Check, Maximize2, Minus, Plus, RefreshCw, SquarePen } from 'lucide-react';
import { ComicPage, type PageView } from './comic-page';
import { DEMO_REGIONS } from '@/lib/data/chapter';
import { characterById } from '@/lib/data/characters';
import { cn } from '@/lib/utils';

const THUMBS = ['01', '02', '03', '04', '05', '06'];

/**
 * A working miniature of the real editor, used as the hero visual. It is the
 * product itself rather than an illustration — a visitor should understand the
 * workflow before reading a single sentence of copy.
 */
export function WorkspacePreview({ className }: { className?: string }) {
  const [selectedId, setSelectedId] = React.useState('r-02');
  const [view, setView] = React.useState<PageView>('detected');
  const region = DEMO_REGIONS.find((r) => r.id === selectedId) ?? DEMO_REGIONS[1];
  const speaker = characterById(region.speakerId);
  const index = [...DEMO_REGIONS].sort((a, b) => a.readingOrder - b.readingOrder).findIndex((r) => r.id === region.id);

  return (
    <div className={cn('overflow-hidden rounded-xl2 border border-editor-line bg-editor-bg shadow-lift', className)}>
      {/* Chrome */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-editor-line px-4 py-3">
        <span className="text-[13px] font-semibold text-editor-text">Overset</span>
        <Meta label="Project" value="The Fallen Hero" />
        <Meta label="Chapter" value="Chapter 14" />
        <Meta label="Language" value="KO → EN" />
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-[#B9B4FF]">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          Translation Review
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[110px_minmax(0,1fr)_300px]">
        {/* Pages rail */}
        <div className="hidden border-r border-editor-line p-3 lg:block">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-editor-muted">Pages</p>
          <div className="space-y-2">
            {THUMBS.map((t) => (
              <div
                key={t}
                className={cn(
                  'flex aspect-[3/4] items-end justify-start rounded-md border p-1.5 text-[10px] font-semibold transition-colors',
                  t === '03'
                    ? 'border-accent bg-accent/15 text-[#C3BEFF]'
                    : 'border-editor-line bg-editor-panel text-editor-muted',
                )}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="relative border-b border-editor-line bg-editor-panel p-4 lg:border-b-0 lg:border-r">
          <div className="mx-auto max-w-[360px] overflow-hidden rounded-md bg-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]">
            <ComicPage
              view={view}
              regions={DEMO_REGIONS}
              selectedRegionId={selectedId}
              onSelectRegion={setSelectedId}
              interactive
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <CanvasBtn icon={<Minus size={12} />} label="Zoom out" />
            <CanvasBtn icon={<Plus size={12} />} label="Zoom in" />
            <CanvasBtn icon={<Maximize2 size={12} />} label="Fit" />
            <div className="mx-1 h-4 w-px bg-editor-line" aria-hidden />
            {(['original', 'detected', 'translated'] as PageView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
                  view === v ? 'bg-editor-raised text-editor-text' : 'text-editor-muted hover:text-editor-text',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Inspector */}
        <div className="space-y-3.5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-editor-text">Bubble {String(index + 1).padStart(2, '0')}</h3>
            <span className="rounded-md bg-editor-raised px-2 py-0.5 text-[10px] font-medium capitalize text-editor-muted">{region.type}</span>
          </div>

          {speaker && (
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full" style={{ background: speaker.color }} aria-hidden />
              <div className="leading-tight">
                <p className="text-[12px] font-medium text-editor-text">{speaker.name}</p>
                <p className="text-[10.5px] text-editor-muted">{speaker.role}</p>
              </div>
            </div>
          )}

          <InspectorField label="Original" value={region.sourceText} mono />
          <InspectorField label="Literal" value={region.literalTranslation} muted />
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">Translation</p>
            <div className="rounded-lg border border-accent/45 bg-accent/10 px-2.5 py-2 text-[12.5px] leading-relaxed text-editor-text">
              {region.finalTranslation}
            </div>
          </div>

          {region.alternatives.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">Alternatives</p>
              <ul className="space-y-1">
                {region.alternatives.slice(0, 2).map((a) => (
                  <li key={a} className="rounded-md border border-editor-line px-2.5 py-1.5 text-[11.5px] text-editor-muted">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-editor-panel px-2.5 py-2">
            <span className="text-[11px] text-editor-muted">Confidence</span>
            <span className="text-[12px] font-semibold text-editor-text">{Math.round(region.translationConfidence * 100)}%</span>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">Context used</p>
            <ul className="space-y-1">
              {region.contextUsed.map((c) => (
                <li key={c.label} className="flex items-start gap-1.5 text-[11.5px] text-editor-muted">
                  <Check size={11} className="mt-[3px] shrink-0 text-ok" aria-hidden />
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-1.5 pt-1">
            <button className="flex-1 rounded-md bg-accent px-2 py-1.5 text-[11.5px] font-medium text-white transition-colors hover:bg-accent-strong">
              Approve
            </button>
            <button className="rounded-md border border-editor-line px-2 py-1.5 text-[11.5px] text-editor-muted transition-colors hover:text-editor-text" aria-label="Edit">
              <SquarePen size={12} />
            </button>
            <button className="rounded-md border border-editor-line px-2 py-1.5 text-[11.5px] text-editor-muted transition-colors hover:text-editor-text" aria-label="Regenerate">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="hidden items-baseline gap-1.5 sm:inline-flex">
      <span className="text-[10.5px] uppercase tracking-[0.1em] text-editor-muted">{label}</span>
      <span className="text-[12px] text-editor-text">{value}</span>
    </span>
  );
}

function CanvasBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="rounded-md border border-editor-line p-1.5 text-editor-muted transition-colors hover:text-editor-text"
    >
      {icon}
    </button>
  );
}

function InspectorField({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">{label}</p>
      <p className={cn('text-[12.5px] leading-relaxed', muted ? 'text-editor-muted' : 'text-editor-text', mono && 'font-medium')}>{value}</p>
    </div>
  );
}
