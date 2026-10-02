'use client';

import * as React from 'react';
import { fontString, measureFit, renderPage, sourceLayout, type RenderMode } from '@/lib/imaging/render';
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
  readOnly = false,
  onTextChange,
  onTextCommit,
}: {
  readOnly?: boolean;
  onTextChange?: (id:string,text:string)=>void;
  onTextCommit?: (id:string,before:string,after:string)=>void;
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
  const [editingId,setEditingId]=React.useState<string|null>(null);
  const beforeText=React.useRef('');
  const [renderError,setRenderError]=React.useState('');
  const [rendering, setRendering] = React.useState(false);

  // Re-render the page whenever its content or the view changes.
  React.useEffect(() => {
    if (!image || !canvasRef.current) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setRendering(true);setRenderError('');
      try {
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const rendered=await renderPage(image,regions,view,undefined,editingId??undefined);
        if(cancelled)return;
        canvas.width=rendered.width;canvas.height=rendered.height;
        canvas.getContext('2d')?.drawImage(rendered,0,0);
      } catch(error){if(!cancelled)setRenderError(error instanceof Error?error.message:'Preview could not be rendered. Reopen this page.');} finally {
        if (!cancelled) setRendering(false);
      }
    }, view === 'original' ? 0 : 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [image, regions, view, editingId]);

  React.useEffect(()=>{setEditingId(null);},[image,view,selectedId]);

  function toPercent(e: React.PointerEvent) {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function onPointerDown(e: React.PointerEvent, target?: { id: string; resize?: boolean }) {
    if (e.button !== 0) return;
    if (readOnly) { if(target)e.stopPropagation();onSelect(target?.id ?? null); return; }
    const p = toPercent(e);
    if (target) {
      e.stopPropagation();
      const region = regions.find((r) => r.id === target.id);
      if (!region) return;
      onSelect(region.id);
      if(!target.resize&&!e.shiftKey)return;
      overlayRef.current?.setPointerCapture(e.pointerId);
      setDrag({ kind: target.resize ? 'resize' : 'move', id: region.id, startX: p.x, startY: p.y, origin: region.bounds });
      return;
    }
    if (tool === 'draw') {overlayRef.current?.setPointerCapture(e.pointerId);setDrag({ kind: 'draw', startX: p.x, startY: p.y, x: p.x, y: p.y });}
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
        <canvas ref={canvasRef} className={cn("absolute inset-0 h-full w-full",!image&&"opacity-0")} aria-label={`Page, ${view} view`} role="img" />
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
            const layout=image?sourceLayout(image,r):null;
            const overflow = view === 'translated' && r.finalTranslation.trim() && !measureFit(r, width, height,layout?.analysis.safeBox??undefined).fits;
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                aria-label={`${REGION_TYPE_LABELS[r.type]} region ${i + 1}${r.finalTranslation ? '' : ', untranslated'}`}
                aria-pressed={selected}
                onPointerDown={(e) => onPointerDown(e, { id: r.id })}
                onDoubleClick={()=>{if(!readOnly&&view==='translated'&&onTextChange&&layout?.analysis.safeBox){beforeText.current=r.finalTranslation;setEditingId(r.id);}}}
                onKeyDown={(e) => {
                  if(e.key==='F2'&&!readOnly&&view==='translated'&&onTextChange&&layout?.analysis.safeBox){e.preventDefault();beforeText.current=r.finalTranslation;onSelect(r.id);setEditingId(r.id);}
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(r.id);
                  }
                }}
                className={cn('absolute rounded-[3px] transition-opacity', tool === 'draw' ? 'pointer-events-none' : 'cursor-pointer')}
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
                  {overflow || (r.finalTranslation&&!r.artworkCleanup&&!layout?.analysis.safeBox) ? ' ⚠' : ''}
                </span>
                {selected && !readOnly && tool === 'select' && (
                  <span
                    onPointerDown={(e) => onPointerDown(e, { id: r.id, resize: true })}
                    className="absolute -bottom-[6px] -right-[6px] h-3 w-3 cursor-nwse-resize rounded-sm border-2 border-white bg-accent"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
          {editingId && (()=>{
            const r=regions.find(r=>r.id===editingId),layout=r&&image?sourceLayout(image,r):null,area=layout?.analysis.safeBox;
            if(!r||!layout||!area)return null;
            const finish=()=>{onTextCommit?.(r.id,beforeText.current,r.finalTranslation);setEditingId(null);};
            const fit=measureFit(r,width,height,area);
            return <div className="absolute" style={{left:`${(layout.x+area.x)/width*100}%`,top:`${(layout.y+area.y)/height*100}%`,width:`${area.width/width*100}%`,height:`${area.height/height*100}%`}} onPointerDown={e=>e.stopPropagation()}>
              <textarea autoFocus aria-label="Edit translation on page" value={r.finalTranslation} onChange={e=>onTextChange?.(r.id,e.target.value)} onBlur={finish} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'||((e.metaKey||e.ctrlKey)&&e.key==='Enter')){e.preventDefault();finish();}}} className="h-full w-full resize-none rounded-sm border-0 bg-transparent p-0 text-ink outline outline-2 outline-accent focus:outline-accent" style={{font:fontString(r,Math.max(12,fit.fontSizePx*(overlayRef.current?.clientWidth??width)/width)),lineHeight:r.typesetting.lineHeight,textAlign:r.typesetting.align,letterSpacing:`${r.typesetting.letterSpacing}em`,paddingTop:Math.max(0,(area.height-fit.blockHeight)/2*(overlayRef.current?.clientWidth??width)/width)}} />
            </div>;
          })()}
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
        {renderError&&<p role="alert" className="absolute inset-x-2 top-2 rounded bg-dangerSoft p-3 text-[12px] text-danger">{renderError}</p>}
        {rendering && view !== 'original' && (
          <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Rendering…</span>
        )}
      </div>
    </div>
  );
}
