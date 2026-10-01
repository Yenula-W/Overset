'use client';

import * as React from 'react';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { pixelsChangedOutsideRegions, renderPage } from '@/lib/imaging/render';
import type { DialogueRegion } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

type Mode = 'side' | 'slider' | 'overlay';

/**
 * Compare answers the product's central question — did anything change that
 * didn't need to? The check below diffs the real renders pixel by pixel
 * outside every text region.
 */
export function CompareView({ image, regions }: { image: ImageBitmap | null; regions: DialogueRegion[] }) {
  const [mode, setMode] = React.useState<Mode>('slider');
  const [position, setPosition] = React.useState(50);
  const [urls, setUrls] = React.useState<{ original: string; translated: string } | null>(null);
  const [changed, setChanged] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!image) return;
    let cancelled = false;
    let made: string[] = [];
    (async () => {
      const a = await renderPage(image, regions, 'original');
      const b = await renderPage(image, regions, 'translated');
      if (cancelled) return;
      const ctxA = a.getContext('2d', { willReadFrequently: true })!;
      const ctxB = b.getContext('2d', { willReadFrequently: true })!;
      setChanged(pixelsChangedOutsideRegions(ctxA.getImageData(0, 0, a.width, a.height), ctxB.getImageData(0, 0, b.width, b.height), regions));
      const toUrl = (c: HTMLCanvasElement) => new Promise<string>((res) => c.toBlob((blob) => res(blob ? URL.createObjectURL(blob) : ''), 'image/png'));
      const [o, t] = await Promise.all([toUrl(a), toUrl(b)]);
      made = [o, t];
      if (!cancelled) setUrls({ original: o, translated: t });
    })();
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [image, regions]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-lg border border-editor-line bg-editor-panel p-1" role="group" aria-label="Compare mode">
          {(
            [
              ['side', 'Side by side'],
              ['slider', 'Slider'],
              ['overlay', 'Difference'],
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

      {!urls ? (
        <div className="aspect-[3/4] skeleton rounded-md" aria-label="Rendering comparison" />
      ) : mode === 'side' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Framed label="Original">
            <img src={urls.original} alt="Original page" className="block w-full" />
          </Framed>
          <Framed label="Translated">
            <img src={urls.translated} alt="Translated page" className="block w-full" />
          </Framed>
        </div>
      ) : mode === 'slider' ? (
        <>
          <Framed label={`Original left · Translated right`}>
            <div className="relative">
              <img src={urls.translated} alt="Translated page" className="block w-full" />
              <img
                src={urls.original}
                alt="Original page"
                className="absolute inset-0 block w-full"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
              />
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent" style={{ left: `${position}%` }} aria-hidden />
            </div>
          </Framed>
          <label className="block">
            <span className="sr-only">Comparison position</span>
            <input type="range" min={0} max={100} value={position} onChange={(e) => setPosition(Number(e.target.value))} className="w-full accent-accent" />
          </label>
        </>
      ) : (
        <Framed label="Difference — anything that lights up changed">
          <div className="relative bg-black">
            <img src={urls.original} alt="" className="block w-full" />
            <img src={urls.translated} alt="Difference between original and translated" className="absolute inset-0 block w-full mix-blend-difference" />
          </div>
        </Framed>
      )}

      {changed !== null && (
        <div
          role="status"
          className={cn(
            'flex items-start gap-2.5 rounded-lg border px-3 py-2.5',
            changed === 0 ? 'border-editor-line bg-editor-panel' : 'border-warn/40 bg-warn/10',
          )}
        >
          {changed === 0 ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" aria-hidden />
          ) : (
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warn" aria-hidden />
          )}
          <div>
            <p className="text-[12px] text-editor-text">
              {changed === 0
                ? 'No artwork changed outside the text regions.'
                : `Artwork difference detected outside translation regions: ${changed.toLocaleString()} pixels.`}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-editor-muted">
              Checked pixel by pixel against the original. Page dimensions are unchanged.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Framed({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="m-0 min-w-0">
      <div className="overflow-hidden rounded-md bg-white">{children}</div>
      <figcaption className="mt-1.5 text-center text-[11px] text-editor-muted">{label}</figcaption>
    </figure>
  );
}
