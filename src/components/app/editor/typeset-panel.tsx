'use client';

import * as React from 'react';
import { comicLetteringStyle, effectiveTypesetting } from '@/lib/imaging/typography-core';
import { Maximize, TriangleAlert } from 'lucide-react';
import { REGION_TYPE_LABELS, type DialogueRegion, type TypesettingProperties } from '@/lib/types/domain';
import { ensureFonts, LETTERING_FONTS, measureFit, REFERENCE_WIDTH, sourceLayout } from '@/lib/imaging/render';

/**
 * Typesetting controls. "Fit to bubble" runs the same fitting the renderer
 * uses: line breaks first, size last, never below the readable floor.
 */
export function TypesetPanel({
  region,
  pageWidth,
  pageHeight,
  onChange,
  image,
  onApplyPage,
}: {
  image?:ImageBitmap|null;
  onApplyPage?:()=>void;
  region: DialogueRegion;
  pageWidth: number;
  pageHeight: number;
  onChange: (patch: Partial<TypesettingProperties>) => void;
}) {
  const t = effectiveTypesetting(region);
  const [fontsReady, setFontsReady] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    setFontsReady(false);
    void ensureFonts([region]).then(() => { if (active) setFontsReady(true); });
    return () => { active = false; };
  }, [t.fontFamily, t.fontStyle, t.fontWeight]);
  const layout=image?sourceLayout(image,region):null;
  const area=layout?.analysis.safeBox??undefined;
  const fit = fontsReady && region.finalTranslation.trim() ? measureFit(region, pageWidth, pageHeight,area) : null;
  const scale = pageWidth / REFERENCE_WIDTH;

  function fitToBubble() {
    // Measure with auto-fit on, then store the result as a fixed size.
    const fitted = measureFit({ ...region, typesetting: { ...t, autoFit: true } }, pageWidth, pageHeight,area);
    onChange({ ...t, fontSource: 'manual', fontSize: Math.round((fitted.fontSizePx / scale) * 4) / 4, autoFit: false });
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {!region.finalTranslation.trim() ? (
        <p className="rounded-lg bg-editor-panel px-3 py-2.5 text-[12px] leading-relaxed text-editor-muted">
          Add a translation to see how it fits.
        </p>
      ) : fit && !fit.fits ? (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2.5" role="status">
          <div className="flex items-center gap-1.5">
            <TriangleAlert size={12} className="text-warn" aria-hidden />
            <p className="text-[11.5px] font-semibold text-warn">Fit warning</p>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-editor-muted">
            This translation doesn’t fit the bubble at a readable size. Try a shorter translation, tighten the line
            spacing, or edit the line. The bubble stays unchanged.
          </p>
        </div>
      ) : (
        fit && (
          <p className="rounded-lg bg-editor-panel px-3 py-2 text-[12px] text-editor-muted">
            Fits on {fit.lines.length} {fit.lines.length === 1 ? 'line' : 'lines'} at {Math.round(fit.fontSizePx)} px.
          </p>
        )
      )}

      <button
        onClick={fitToBubble}
        disabled={!region.finalTranslation.trim()}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
      >
        <Maximize size={12} />
        Fit to bubble
      </button>

      <div role="group" aria-label="Lettering style" className="grid grid-cols-2 gap-2">
        <button onClick={() => onChange({ ...effectiveTypesetting({ ...region, typesetting: { ...region.typesetting, fontSource: 'matched', autoFit: true, fontStyle: 'normal', textCase: 'original', fontSize: region.typesetting.sourceFont?.size ?? 28 } }), fontSource: 'matched' })} className="min-h-11 rounded-md border border-editor-line text-[12px] text-editor-text hover:border-accent">Source style</button>
        <button onClick={() => onChange(comicLetteringStyle(t))} className="min-h-11 rounded-md border border-editor-line text-[12px] text-editor-text hover:border-accent">Comic style</button>
      </div>

      <Row label="Fill the bubble">
        <div role="group" aria-label="Text coverage" className="flex gap-1">
          {(['roomy', 'balanced', 'fuller'] as const).map(coverage => (
            <button key={coverage} aria-pressed={t.autoFit && (t.coverage ?? (t.fontSource === 'manual' ? undefined : 'balanced')) === coverage}
              onClick={() => onChange({ coverage, autoFit: true, fontSize: Math.max(t.fontSize, t.sourceFont?.size ?? 28) })}
              className={`min-h-11 flex-1 rounded-md border px-2 text-[12px] capitalize ${t.autoFit && (t.coverage ?? (t.fontSource === 'manual' ? undefined : 'balanced')) === coverage ? 'border-accent bg-accent/15 text-editor-text' : 'border-editor-line text-editor-muted hover:text-editor-text'}`}>
              {coverage}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Alignment">
        <div role="group" aria-label="Text alignment" className="flex gap-1">
          {(['left', 'center', 'right'] as const).map(a => <button key={a} onClick={() => onChange({align:a})} aria-pressed={t.align === a} className={`min-h-11 flex-1 rounded-md border px-2 text-[12px] capitalize ${t.align === a ? 'border-accent bg-accent/15 text-editor-text' : 'border-editor-line text-editor-muted'}`}>{a}</button>)}
        </div>
      </Row>

      <Row label="Font">
        <select
          value={t.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full rounded-md border border-editor-line bg-editor-panel px-2 py-1 text-[12px] text-editor-text"
          aria-label="Font family"
        >
          {!LETTERING_FONTS.includes(t.fontFamily as (typeof LETTERING_FONTS)[number]) && <option>{t.fontFamily}</option>}
          {LETTERING_FONTS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </Row>

      {onApplyPage&&<button onClick={onApplyPage} className="text-[12px] text-[#B9B4FF] hover:underline">Apply style to {REGION_TYPE_LABELS[region.type].toLowerCase()} on this page</button>}
      {image&&!area&&!region.artworkCleanup&&<p role="status" className="rounded-md border border-warn/40 p-3 text-[12px] text-warn">Source text kept intact: no safe bubble interior found. Adjust the text region or use the cleanup brush.</p>}
      <Slider label={t.autoFit ? "Size limit" : "Size"} value={t.fontSize} min={6} max={60} step={0.5} onChange={(v) => onChange({ fontSize: v, autoFit: false })} />
      <details className="rounded-lg border border-editor-line">
        <summary className="cursor-pointer px-3 py-3 text-[12px] text-editor-text">Spacing & advanced</summary>
        <div className="space-y-4 border-t border-editor-line px-3 py-3">
          <Slider label="Weight" value={t.fontWeight} min={300} max={900} step={100} onChange={(v) => onChange({ fontWeight: v })} />
          <Slider label="Line spacing" value={t.lineHeight} min={0.85} max={2} step={0.05} onChange={(v) => onChange({ lineHeight: v })} />
          <Slider label="Letter spacing" value={t.letterSpacing} min={-0.05} max={0.3} step={0.01} onChange={(v) => onChange({ letterSpacing: v })} suffix="em" />
          <Slider label="Rotation" value={t.rotation} min={-45} max={45} onChange={(v) => onChange({ rotation: v })} suffix="°" />
          <label className="flex min-h-11 items-center justify-between text-[12px] text-editor-muted">Italic<input type="checkbox" checked={t.fontStyle === 'italic'} onChange={e=>onChange({fontStyle:e.target.checked?'italic':'normal'})} className="accent-accent" /></label>
          <label className="flex min-h-11 items-center justify-between text-[12px] text-editor-muted">Uppercase<input type="checkbox" checked={t.textCase === 'uppercase'} onChange={e=>onChange({textCase:e.target.checked?'uppercase':'original'})} className="accent-accent" /></label>

          <div className="flex items-center justify-between rounded-lg bg-editor-panel px-3 py-2">
            <label htmlFor="outline" className="text-[12px] text-editor-muted">
              White outline
            </label>
            <input id="outline" type="checkbox" checked={t.outline} onChange={(e) => onChange({ outline: e.target.checked })} className="accent-accent" />
          </div>

        </div>
      </details>

      <div className="rounded-lg bg-editor-panel px-3 py-2">
        <div className="flex items-center justify-between">
          <label htmlFor="autofit" className="text-[12px] text-editor-muted">
            Auto fit
          </label>
          <input id="autofit" type="checkbox" checked={t.autoFit} onChange={(e) => onChange({ autoFit: e.target.checked })} className="accent-accent" />
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-editor-muted/80">Shrinks from the chosen size when needed, never below a readable floor.</p>
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
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </div>
  );
}
