'use client';

import * as React from 'react';
import { measureFit, renderPage, type RenderMode } from '@/lib/imaging/render';
import { REGION_TYPE_LABELS, type DialogueRegion, type Rect } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

const TYPE_COLOR: Record<string, string> = {
  dialogue: '#6C63E8',
  thought: '#6C63E8',
  narration: '#4F8A5B',
  sfx: '#B4833A',
  sign: '#B4544A',
  label: '#686868',
  title: '#686868',
  background: '#686868',
};

const MIN_SIZE = 1; // percent

type Drag =
  | { kind: 'draw'; startX: number; startY: number; x: number; y: number }
  | { kind: 'move'; id: string; startX: number; startY: number; origin: Rect }
  | { kind: 'resize'; id: string; startX: number; startY: number; origin: Rect };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function PageCanvas({
  image,
  width,
  height,
  regions,
  view,
  zoom,
  tool,
  selectedId,
  onSelect,
  onCreate,
  onBoundsChange,
  onBoundsCommit,
}: {
  image: ImageBitmap | null;
  width: number;
  height: number;
  regions: DialogueRegion[];
  view: RenderMode;
  zoom: number;
  tool: 'select' | 'draw';
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (bounds: Rect) => void;
  onBoundsChange: (id: string, bounds: Rect) => void;
  onBoundsCommit: (id: string) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<Drag | null>(null);
  const [rendering, setRendering] = React.useState(false);

  // Re-render the page whenever its content or the view changes.
  React.useEffect(() => {
    if (!image || !canvasRef.current) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setRendering(true);
      try {
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        await renderPage(image, regions, view, canvas);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, view === 'original' ? 0 : 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [image, regions, view]);

  function toPercent(e: React.PointerEvent) {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function onPointerDown(e: React.PointerEvent, target?: { id: string; resize?: boolean }) {
    if (e.button !== 0) return;
    const p = toPercent(e);
    overlayRef.current?.setPointerCapture(e.pointerId);
    if (target) {
      e.stopPropagation();
      const region = regions.find((r) => r.id === target.id);
      if (!region) return;
      onSelect(region.id);
      setDrag({ kind: target.resize ? 'resize' : 'move', id: region.id, startX: p.x, startY: p.y, origin: region.bounds });
      return;
    }
    if (tool === 'draw') setDrag({ kind: 'draw', startX: p.x, startY: p.y, x: p.x, y: p.y });
    else onSelect(null);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = toPercent(e);
    if (drag.kind === 'draw') {
      setDrag({ ...drag, x: p.x, y: p.y });
    } else if (drag.kind === 'move') {
      const o = drag.origin;
      onBoundsChange(drag.id, {
        ...o,
        x: clamp(o.x + p.x - drag.startX, 0, 100 - o.width),
        y: clamp(o.y + p.y - drag.startY, 0, 100 - o.height),
      });
    } else {
      const o = drag.origin;
      onBoundsChange(drag.id, {
        ...o,
        width: clamp(o.width + p.x - drag.startX, MIN_SIZE, 100 - o.x),
        height: clamp(o.height + p.y - drag.startY, MIN_SIZE, 100 - o.y),
      });
    }
  }

  function onPointerUp() {
    if (!drag) return;
    if (drag.kind === 'draw') {
      const x = Math.min(drag.startX, drag.x);
      const y = Math.min(drag.startY, drag.y);
      const w = Math.abs(drag.x - drag.startX);
      const h = Math.abs(drag.y - drag.startY);
      if (w >= MIN_SIZE && h >= MIN_SIZE * 0.6) onCreate({ x, y, width: w, height: h });
    } else {
      onBoundsCommit(drag.id);
    }
    setDrag(null);
  }

  const ordered = [...regions].sort((a, b) => a.readingOrder - b.readingOrder);
  const subtle = view !== 'original';

  return (
    <div className="mx-auto" style={{ width: `${zoom}%`, maxWidth: zoom <= 100 ? Math.max(360, width) : undefined }}>
      <div
        className="relative overflow-hidden rounded-md bg-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)]"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {!image && <div className="absolute inset-0 skeleton" aria-hidden />}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label={`Page, ${view} view`} role="img" />
        <div
          ref={overlayRef}
          className={cn('absolute inset-0 touch-none select-none', tool === 'draw' ? 'cursor-crosshair' : 'cursor-default')}
          onPointerDown={(e) => onPointerDown(e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag(null)}
        >
          {ordered.map((r, i) => {
            const selected = r.id === selectedId;
            const color = selected ? '#6C63E8' : TYPE_COLOR[r.type] ?? '#6C63E8';
            const overflow = view === 'translated' && r.finalTranslation.trim() && !measureFit(r, width, height).fits;
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                aria-label={`${REGION_TYPE_LABELS[r.type]} region ${i + 1}${r.finalTranslation ? '' : ', untranslated'}`}
                aria-pressed={selected}
                onPointerDown={(e) => onPointerDown(e, { id: r.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(r.id);
                  }
                }}
                className={cn('absolute rounded-[3px] transition-opacity', tool === 'draw' ? 'pointer-events-none' : 'cursor-move')}
                style={{
                  left: `${r.bounds.x}%`,
                  top: `${r.bounds.y}%`,
                  width: `${r.bounds.width}%`,
                  height: `${r.bounds.height}%`,
                  border: `${selected ? 2 : 1.5}px ${selected ? 'solid' : 'dashed'} ${color}`,
                  background: selected ? 'rgba(108,99,232,0.12)' : subtle ? 'transparent' : 'rgba(108,99,232,0.05)',
                  opacity: subtle && !selected ? 0.45 : 1,
                }}
              >
                <span
                  className="pointer-events-none absolute -top-[18px] left-[-2px] rounded-sm px-1 text-[10px] font-bold leading-[16px] text-white"
                  style={{ background: color }}
                >
                  {String(i + 1).padStart(2, '0')}
                  {r.status === 'approved' ? ' ✓' : ''}
                  {overflow ? ' ⚠' : ''}
                </span>
                {selected && tool === 'select' && (
                  <span
                    onPointerDown={(e) => onPointerDown(e, { id: r.id, resize: true })}
                    className="absolute -bottom-[6px] -right-[6px] h-3 w-3 cursor-nwse-resize rounded-sm border-2 border-white bg-accent"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
          {drag?.kind === 'draw' && (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/10"
              style={{
                left: `${Math.min(drag.startX, drag.x)}%`,
                top: `${Math.min(drag.startY, drag.y)}%`,
                width: `${Math.abs(drag.x - drag.startX)}%`,
                height: `${Math.abs(drag.y - drag.startY)}%`,
              }}
            />
          )}
        </div>
        {rendering && view !== 'original' && (
          <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Rendering…</span>
        )}
      </div>
    </div>
  );
}
