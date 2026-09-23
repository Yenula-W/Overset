'use client';

import * as React from 'react';
import { Sparkles, TriangleAlert } from 'lucide-react';
import type { DialogueRegion, TypesettingProperties } from '@/lib/types/domain';
import { wrapText } from '@/components/demo/comic-page';
import { PAGE_W } from '@/components/demo/artwork';

const FONTS = ['Comic Neue', 'Anime Ace', 'Wild Words', 'CC Wild Words', 'Manga Temple'];
const MIN_READABLE_PX = 11;

/**
 * Estimates whether the translation fits at its current size. This mirrors the
 * server-side typesetting provider, but it is advisory only — the editor warns
 * and offers options rather than silently shrinking text.
 */
export function measureFit(region: DialogueRegion): { fits: boolean; lines: number; capacity: number } {
  const t = region.typesetting;
  const widthPx = (region.bounds.width / 100) * PAGE_W;
  const charsPerLine = Math.max(6, Math.floor((widthPx * 0.82) / (t.fontSize * 1.25 * 0.5)));
  const lines = wrapText(region.finalTranslation, charsPerLine).length;
  const heightPx = (region.bounds.height / 100) * 1180;
  const capacity = Math.max(1, Math.floor(heightPx / (t.fontSize * 1.25 * t.lineHeight)));
  return { fits: lines <= capacity, lines, capacity };
}

export function TypesetPanel({
  region,
  onChange,
}: {
  region: DialogueRegion;
  onChange: (patch: Partial<TypesettingProperties>) => void;
}) {
  const t = region.typesetting;
  const fit = measureFit(region);

  /** AI Fit adjusts line breaks and spacing first, and only then nudges size —
   *  never below the readable floor. */
  function aiFit() {
    if (fit.fits) return;
    const tighter = Math.max(MIN_READABLE_PX, t.fontSize - 1);
    onChange({ fontSize: tighter, lineHeight: Math.max(1.02, t.lineHeight - 0.04), autoFit: true });
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {!fit.fits && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <TriangleAlert size={12} className="text-warn" aria-hidden />
            <p className="text-[11.5px] font-semibold text-warn">Fit warning</p>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-editor-muted">
            This translation needs {fit.lines} lines but the bubble comfortably holds {fit.capacity}. Try a shorter
            translation, reduce the font slightly, or adjust it by hand.
          </p>
          <button onClick={aiFit} className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[11.5px] font-medium text-white">
            <Sparkles size={11} />
            AI Fit
          </button>
        </div>
      )}

      <Row label="Font">
        <select
          value={t.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full rounded-md border border-editor-line bg-editor-panel px-2 py-1 text-[12px] text-editor-text"
          aria-label="Font family"
        >
          {FONTS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </Row>

      <Slider label="Size" value={t.fontSize} min={MIN_READABLE_PX} max={48} onChange={(v) => onChange({ fontSize: v })} suffix="px" />
      <Slider label="Weight" value={t.fontWeight} min={300} max={900} step={100} onChange={(v) => onChange({ fontWeight: v })} />
      <Slider label="Line spacing" value={t.lineHeight} min={0.9} max={2} step={0.05} onChange={(v) => onChange({ lineHeight: v })} />
      <Slider label="Letter spacing" value={t.letterSpacing} min={-0.05} max={0.3} step={0.01} onChange={(v) => onChange({ letterSpacing: v })} suffix="em" />
      <Slider label="Rotation" value={t.rotation} min={-45} max={45} onChange={(v) => onChange({ rotation: v })} suffix="°" />

      <Row label="Alignment">
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ align: a })}
              aria-pressed={t.align === a}
              className={`flex-1 rounded-md border px-2 py-1 text-[11.5px] capitalize ${t.align === a ? 'border-accent bg-accent/15 text-editor-text' : 'border-editor-line text-editor-muted'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Text direction">
        <div className="flex gap-1">
          {(['horizontal', 'vertical'] as const).map((d) => (
            <button
              key={d}
              onClick={() => onChange({ direction: d })}
              aria-pressed={t.direction === d}
              className={`flex-1 rounded-md border px-2 py-1 text-[11.5px] capitalize ${t.direction === d ? 'border-accent bg-accent/15 text-editor-text' : 'border-editor-line text-editor-muted'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </Row>

      <div className="flex items-center justify-between rounded-lg bg-editor-panel px-3 py-2">
        <label htmlFor="outline" className="text-[12px] text-editor-muted">
          Outline
        </label>
        <input id="outline" type="checkbox" checked={t.outline} onChange={(e) => onChange({ outline: e.target.checked })} className="accent-accent" />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-editor-panel px-3 py-2">
        <label htmlFor="autofit" className="text-[12px] text-editor-muted">
          Auto fit
        </label>
        <input id="autofit" type="checkbox" checked={t.autoFit} onChange={(e) => onChange({ autoFit: e.target.checked })} className="accent-accent" />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">{label}</p>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const id = React.useId();
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-editor-muted">
          {label}
        </label>
        <span className="text-[11.5px] tabular-nums text-editor-text">
          {step < 1 ? value.toFixed(2) : value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
