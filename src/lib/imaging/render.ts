import { effectiveTypesetting, letteringText } from './typography-core';
import type { PixelBox } from './lettering-core';
import { analyzeBubble, bubbleMargin, fillBubbleText, type BubbleAnalysis } from './bubble-core';
import { cloneMaskedPixels } from './clone-core';
import { fitText, usableBox, type FitResult } from './typeset-core';
import type { DialogueRegion, RegionType } from '@/lib/types/domain';

/**
 * Page renderer shared by the editor preview and export, so what the
 * translator sees is exactly what gets exported.
 *
 * Text removal repaints only the lettering inside an enclosed speech bubble.
 * Bubble outlines, their shape and every pixel outside the bubble are never
 * touched, which is the product's central promise, enforced here rather than
 * hoped for. A region without a recognisable bubble keeps its source text.
 */

export type RenderMode = 'original' | 'cleaned' | 'translated';

/** Typesetting sizes are authored against an 840px-wide page and scale with it. */
export const REFERENCE_WIDTH = 840;

export const LETTERING_FONTS = ['Noto Serif', 'Archivo', 'Archivo Narrow', 'Comic Neue', 'Bangers', 'Inter'] as const;

const ELLIPTICAL: RegionType[] = ['dialogue', 'thought'];

export function regionShape(type: RegionType): 'ellipse' | 'box' {
  return ELLIPTICAL.includes(type) ? 'ellipse' : 'box';
}

export function regionPx(region: DialogueRegion, pageW: number, pageH: number) {
  return {
    x: (region.bounds.x / 100) * pageW,
    y: (region.bounds.y / 100) * pageH,
    w: (region.bounds.width / 100) * pageW,
    h: (region.bounds.height / 100) * pageH,
  };
}

/** Embedded artwork requires an explicit cleanup mask; it is never erased automatically. */
export function canCleanLocally(region: DialogueRegion) {
  return region.translate && !region.embeddedInArtwork && region.type !== 'sfx' && region.type !== 'background';
}

export function fontString(region: DialogueRegion, sizePx: number) {
  const t = effectiveTypesetting(region);
  // Comic Neue ships 400 and 700 only; snap so the browser doesn't fake a weight.
  const weight = t.fontFamily === 'Comic Neue' ? (t.fontWeight >= 550 ? 700 : 400) : t.fontWeight;
  const fallback = t.fontFamily === 'Noto Serif' ? 'serif' : '"Comic Neue", sans-serif';
  return `${weight} ${sizePx}px "${t.fontFamily}", ${fallback}`;
}

const measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

export function measureFit(region: DialogueRegion, pageW: number, pageH: number, area?: PixelBox): FitResult {
  const px = regionPx(region, pageW, pageH);
  const box = area ? {width:area.width,height:area.height} : usableBox(px.w,px.h,regionShape(region.type));
  const scale = pageW / REFERENCE_WIDTH;
  const t = effectiveTypesetting(region);
  const content = letteringText(region.finalTranslation);
  return fitText(
    {
      text: content.text,
      boxWidth: box.width,
      // Leave breathing room while using most of the original text area.
      boxHeight: t.autoFit && t.fontSource !== 'manual' ? box.height * 0.8 : box.height,
      fontSizePx: t.fontSize * scale, // auto-fit only ever shrinks from the chosen size
      minFontSizePx: Math.max(9, 11 * scale),
      lineHeight: t.lineHeight,
      autoFit: t.autoFit,
    },
    (text, size, start = 0) => {
      if (!measureCanvas) return text.length * size * 0.5;
      if ('letterSpacing' in measureCanvas) (measureCanvas as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${t.letterSpacing * size}px`;
      return letteringRuns(measureCanvas, region, text, size, start, content).reduce((sum, run) => sum + run.width, 0);
    },
  );
}

/** One run model measures and draws emphasis, avoiding conservative bold widths
 * that would make otherwise ordinary words wrap too early. */
function letteringRuns(ctx: CanvasRenderingContext2D, region: DialogueRegion, line: string, size: number, start: number, content: ReturnType<typeof letteringText>) {
  const t = effectiveTypesetting(region);
  const spans = content.emphasis.filter(e => e.end > start && e.start < start + line.length);
  const cuts = new Set([0, line.length]);
  for (const span of spans) { cuts.add(Math.max(0, span.start - start)); cuts.add(Math.min(line.length, span.end - start)); }
  const positions = [...cuts].sort((a,b) => a-b);
  return positions.slice(0,-1).map((from,i) => {
    const bold = spans.some(e => from + start >= e.start && from + start < e.end);
    const font = fontString(bold ? { ...region, typesetting: { ...t, fontSource: 'manual', fontWeight: Math.max(700, t.fontWeight) } } : region, size);
    const text = line.slice(from, positions[i+1]);
    ctx.font = font;
    return { text, font, width: ctx.measureText(text).width };
  });
}

export interface SourceLayout { x:number; y:number; w:number; h:number; pixels:ImageData; cleaned?:ImageData; analysis:BubbleAnalysis }
const layouts = new WeakMap<object, Map<string,SourceLayout>>();
/**
 * The region's bubble, analysed on a crop that extends past the region so the
 * outline is visible. Coordinates in the result are relative to the crop.
 */
export function sourceLayout(image: ImageBitmap | HTMLImageElement, region:DialogueRegion):SourceLayout|null {
  const w='naturalWidth' in image?image.naturalWidth:image.width;
  const h='naturalHeight' in image?image.naturalHeight:image.height;
  const px=regionPx(region,w,h);
  const margin=bubbleMargin(px.w,px.h);
  const x=Math.max(0,Math.floor(px.x-margin)),y=Math.max(0,Math.floor(px.y-margin));
  const rw=Math.max(0,Math.min(w,Math.ceil(px.x+px.w+margin))-x),rh=Math.max(0,Math.min(h,Math.ceil(px.y+px.h+margin))-y);
  if(!rw||!rh||rw*rh>8_000_000)return null;
  let cache=layouts.get(image);if(!cache){cache=new Map();layouts.set(image,cache);}
  const key=`${px.x.toFixed(1)}:${px.y.toFixed(1)}:${px.w.toFixed(1)}:${px.h.toFixed(1)}`;
  if(cache.has(key))return cache.get(key)!;
  const canvas=document.createElement('canvas');canvas.width=rw;canvas.height=rh;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;
  ctx.drawImage(image,-x,-y);
  const pixels=ctx.getImageData(0,0,rw,rh);
  const analysis=analyzeBubble(pixels.data,rw,rh,{x:px.x-x,y:px.y-y,width:px.w,height:px.h});
  const layout={x,y,w:rw,h:rh,pixels,analysis};
  // Bound cached working areas during repeated manual resizing.
  if(cache.size>=160)cache.clear();cache.set(key,layout);
  return layout;
}
function clipTo(ctx:CanvasRenderingContext2D,px:{x:number;y:number;w:number;h:number}){
 ctx.beginPath();ctx.rect(px.x,px.y,px.w,px.h);ctx.clip();
}
function cleanRegion(ctx:CanvasRenderingContext2D,layout:SourceLayout){
 const pixels=layout.cleaned??new ImageData(layout.pixels.data.slice(),layout.w,layout.h);
 if(!layout.cleaned){fillBubbleText(pixels.data,layout.w,layout.h,layout.analysis);layout.cleaned=pixels;}
 const current=ctx.getImageData(layout.x,layout.y,layout.w,layout.h);
 for(let i=0;i<layout.analysis.mask.length;i++)if(layout.analysis.mask[i])for(let c=0;c<4;c++)current.data[i*4+c]=pixels.data[i*4+c];
 ctx.putImageData(current,layout.x,layout.y);
}

function typesetRegion(ctx: CanvasRenderingContext2D, region: DialogueRegion, pageW: number, pageH: number, area?: PixelBox) {
  if (!region.finalTranslation.trim()) return;
  const raw = regionPx(region,pageW,pageH);
  const px = area ? {x:area.x,y:area.y,w:area.width,h:area.height} : raw;
  const t = effectiveTypesetting(region);
  const fit = measureFit(region, pageW, pageH, area);
  const size = fit.fontSizePx;
  const lineH = size * t.lineHeight;
  const box = area ? {width:px.w,height:px.h} : usableBox(px.w,px.h,regionShape(region.type));
  const cx = px.x + px.w / 2;
  const cy = px.y + px.h / 2;

  ctx.save();
  clipTo(ctx, px);
  ctx.translate(cx, cy);
  if (t.rotation) ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.font = fontString(region, size);
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${t.letterSpacing * size}px`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = t.align;
  const x = t.align === 'left' ? -box.width / 2 : t.align === 'right' ? box.width / 2 : 0;
  const top = -((fit.lines.length - 1) * lineH) / 2;
  const content = letteringText(region.finalTranslation);
  let cursor = 0;
  fit.lines.forEach((line, i) => {
    const y = top + i * lineH;
    const start = content.text.indexOf(line, cursor);
    cursor = Math.max(cursor, start + line.length);
    const runs = letteringRuns(ctx, region, line, size, start, content);
    const width = runs.reduce((sum,r) => sum + r.width, 0);
    let left = t.align === 'left' ? x : t.align === 'right' ? x - width : x - width / 2;
    ctx.textAlign = 'left';
    for (const run of runs) {
      ctx.font = run.font;
      if (t.outline) {
        ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * 0.2);
        ctx.strokeStyle = '#ffffff'; ctx.strokeText(run.text, left, y);
      }
      ctx.fillStyle = '#141418'; ctx.fillText(run.text, left, y);
      left += run.width;
    }
  });
  ctx.restore();
}

/** Waits for every lettering font the regions use, so canvas text never falls back. */
export async function ensureFonts(regions: DialogueRegion[]) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const wanted = new Set(regions.flatMap(r => [fontString(r,24), ...(letteringText(r.finalTranslation).emphasis.length ? [fontString({ ...r, typesetting: { ...effectiveTypesetting(r), fontSource: 'manual', fontWeight: 700 } },24)] : [])]));
  await Promise.all([...wanted].map((f) => document.fonts.load(f).catch(() => [])));
}

function cloneRegion(ctx:CanvasRenderingContext2D, image:ImageBitmap|HTMLImageElement,region:DialogueRegion,pageW:number,pageH:number) {
  const cleanup=region.artworkCleanup;
  if(!cleanup?.strokes.length)return;
  const px=regionPx(region,pageW,pageH);
  const x=Math.max(0,Math.floor(px.x)),y=Math.max(0,Math.floor(px.y));
  const w=Math.min(pageW-x,Math.ceil(px.w)),h=Math.min(pageH-y,Math.ceil(px.h));
  if(w<=0||h<=0||w*h>20_000_000)return;
  const source=document.createElement('canvas');source.width=w;source.height=h;
  const sample=source.getContext('2d',{willReadFrequently:true});if(!sample)return;
  sample.drawImage(image,-x-cleanup.offsetX/100*pageW,-y-cleanup.offsetY/100*pageH);
  const target=ctx.getImageData(x,y,w,h),pixels=sample.getImageData(0,0,w,h);
  cloneMaskedPixels(target.data,pixels.data,w,h,cleanup.strokes.slice(0,3000).map(s=>({x:s.x/100*pageW-x,y:s.y/100*pageH-y,radius:s.radius/100*pageW})));
  ctx.putImageData(target,x,y);
}

/**
 * Draws the page at its original pixel dimensions. Returns the canvas so the
 * caller can display or encode it.
 */
export async function renderPage(
  image: ImageBitmap | HTMLImageElement,
  regions: DialogueRegion[],
  mode: RenderMode,
  target?: HTMLCanvasElement,
  omitTextFor?: string,
): Promise<HTMLCanvasElement> {
  const w = 'naturalWidth' in image ? image.naturalWidth : image.width;
  const h = 'naturalHeight' in image ? image.naturalHeight : image.height;
  if(mode==='translated')await ensureFonts(regions);
  const canvas = target ?? document.createElement('canvas');
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser could not create a canvas.');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image, 0, 0, w, h);
  if (mode === 'original') return canvas;

  const active:Array<{region:DialogueRegion;area:PixelBox}> = [];
  for(const region of regions){
    if(!region.translate||!region.finalTranslation.trim()&&mode==='translated'&&region.id!==omitTextFor)continue;
    if(region.artworkCleanup?.strokes.length){
      cloneRegion(ctx,image,region,w,h);
      const px=regionPx(region,w,h),box=usableBox(px.w,px.h,regionShape(region.type));
      active.push({region,area:{x:px.x+(px.w-box.width)/2,y:px.y+(px.h-box.height)/2,width:box.width,height:box.height}});
    }else if(canCleanLocally(region)){
      const layout=sourceLayout(image,region),box=layout?.analysis.safeBox;
      // No safe lettering mask: keep the source intact, never cover artwork.
      if(!layout||!box||!layout.analysis.glyphCount)continue;
      cleanRegion(ctx,layout);
      active.push({region,area:{...box,x:layout.x+box.x,y:layout.y+box.y}});
    }
  }
  if(mode==='translated'){
    for(const {region,area} of active)if(region.id!==omitTextFor)typesetRegion(ctx,region,w,h,area);
  }
  return canvas;
}

/**
 * Counts pixels that differ between two renders outside every region and the
 * bubble interiors cleaned for them. This is the compare tool's
 * artwork-preservation check.
 */
export function pixelsChangedOutsideRegions(a: ImageData, b: ImageData, regions: DialogueRegion[], bubbles: PixelBox[] = []) {
  const { width: w, height: h } = a;
  const mask = new Uint8Array(w * h);
  for (const px of [...regions.map((r) => regionPx(r, w, h)), ...bubbles.map((b) => ({ x: b.x, y: b.y, w: b.width, h: b.height }))]) {
    const x0 = Math.max(0, Math.floor(px.x) - 1), y0 = Math.max(0, Math.floor(px.y) - 1);
    const x1 = Math.min(w, Math.ceil(px.x + px.w) + 1), y1 = Math.min(h, Math.ceil(px.y + px.h) + 1);
    for (let y = y0; y < y1; y++) mask.fill(1, y * w + x0, y * w + x1);
  }
  let changed = 0;
  for (let i = 0, p = 0; p < w * h; p++, i += 4) {
    if (mask[p]) continue;
    if (Math.abs(a.data[i] - b.data[i]) > 2 || Math.abs(a.data[i + 1] - b.data[i + 1]) > 2 || Math.abs(a.data[i + 2] - b.data[i + 2]) > 2) changed++;
  }
  return changed;
}

export async function canvasToBlob(canvas: HTMLCanvasElement, type: 'image/png' | 'image/jpeg' | 'image/webp', quality = 0.95) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('This browser could not encode the image.'))), type, quality),
  );
}
