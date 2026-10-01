import { fitText, usableBox, type FitResult } from './typeset-core';
import type { DialogueRegion, RegionType } from '@/lib/types/domain';

/**
 * Page renderer shared by the editor preview and export, so what the
 * translator sees is exactly what gets exported.
 *
 * Every paint is clipped to its region's bounds. Pixels outside a text region
 * are never touched, which is the product's central promise, enforced here
 * rather than hoped for.
 */

export type RenderMode = 'original' | 'cleaned' | 'translated';

/** Typesetting sizes are authored against an 840px-wide page and scale with it. */
export const REFERENCE_WIDTH = 840;

export const LETTERING_FONTS = ['Comic Neue', 'Archivo Narrow', 'Bangers', 'Archivo', 'Inter'] as const;

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

/** Text embedded in artwork needs real inpainting, which this renderer doesn't attempt. */
export function canCleanLocally(region: DialogueRegion) {
  return region.translate && !region.embeddedInArtwork && region.type !== 'sfx' && region.type !== 'background';
}

export function fontString(region: DialogueRegion, sizePx: number) {
  const t = region.typesetting;
  // Comic Neue ships 400 and 700 only; snap so the browser doesn't fake a weight.
  const weight = t.fontFamily === 'Comic Neue' ? (t.fontWeight >= 550 ? 700 : 400) : t.fontWeight;
  return `${weight} ${sizePx}px "${t.fontFamily}", "Comic Neue", sans-serif`;
}

const measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

export function measureFit(region: DialogueRegion, pageW: number, pageH: number): FitResult {
  const px = regionPx(region, pageW, pageH);
  const box = usableBox(px.w, px.h, regionShape(region.type));
  const scale = pageW / REFERENCE_WIDTH;
  const t = region.typesetting;
  return fitText(
    {
      text: region.finalTranslation,
      boxWidth: box.width,
      boxHeight: box.height,
      fontSizePx: t.fontSize * scale, // auto-fit only ever shrinks from the chosen size
      minFontSizePx: Math.max(9, 11 * scale),
      lineHeight: t.lineHeight,
      autoFit: t.autoFit,
    },
    (text, size) => {
      if (!measureCanvas) return text.length * size * 0.5;
      measureCanvas.font = fontString(region, size);
      if ('letterSpacing' in measureCanvas) (measureCanvas as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${t.letterSpacing * size}px`;
      return measureCanvas.measureText(text).width;
    },
  );
}

/** Median colour of the light pixels inside the region — the bubble's paper. */
function sampleBackground(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const sx = Math.max(0, Math.floor(x)), sy = Math.max(0, Math.floor(y));
  const sw = Math.max(1, Math.min(ctx.canvas.width - sx, Math.ceil(w)));
  const sh = Math.max(1, Math.min(ctx.canvas.height - sy, Math.ceil(h)));
  const data = ctx.getImageData(sx, sy, sw, sh).data;
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const step = Math.max(1, Math.floor((sw * sh) / 4000)) * 4;
  for (let i = 0; i < data.length; i += step) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    if (lum > 180) {
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }
  }
  if (rs.length === 0) return 'rgb(255,255,255)';
  const med = (a: number[]) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
  return `rgb(${med(rs)},${med(gs)},${med(bs)})`;
}

function clipTo(ctx: CanvasRenderingContext2D, px: { x: number; y: number; w: number; h: number }) {
  ctx.beginPath();
  ctx.rect(px.x, px.y, px.w, px.h);
  ctx.clip();
}

function cleanRegion(ctx: CanvasRenderingContext2D, region: DialogueRegion, pageW: number, pageH: number) {
  const px = regionPx(region, pageW, pageH);
  const fill = sampleBackground(ctx, px.x, px.y, px.w, px.h);
  ctx.save();
  clipTo(ctx, px);
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (regionShape(region.type) === 'ellipse') {
    // Inset so the bubble's own outline survives.
    ctx.ellipse(px.x + px.w / 2, px.y + px.h / 2, (px.w / 2) * 0.94, (px.h / 2) * 0.92, 0, 0, Math.PI * 2);
  } else {
    const ix = px.w * 0.03, iy = px.h * 0.06;
    ctx.rect(px.x + ix, px.y + iy, px.w - ix * 2, px.h - iy * 2);
  }
  ctx.fill();
  ctx.restore();
}

function typesetRegion(ctx: CanvasRenderingContext2D, region: DialogueRegion, pageW: number, pageH: number) {
  if (!region.finalTranslation.trim()) return;
  const px = regionPx(region, pageW, pageH);
  const t = region.typesetting;
  const fit = measureFit(region, pageW, pageH);
  const size = fit.fontSizePx;
  const lineH = size * t.lineHeight;
  const box = usableBox(px.w, px.h, regionShape(region.type));
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
  fit.lines.forEach((line, i) => {
    const y = top + i * lineH;
    if (t.outline) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, size * 0.2);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = '#141418';
    ctx.fillText(line, x, y);
  });
  ctx.restore();
}

/** Waits for every lettering font the regions use, so canvas text never falls back. */
export async function ensureFonts(regions: DialogueRegion[]) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const wanted = new Set(regions.map((r) => fontString(r, 24)));
  await Promise.all([...wanted].map((f) => document.fonts.load(f).catch(() => [])));
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
): Promise<HTMLCanvasElement> {
  const w = 'naturalWidth' in image ? image.naturalWidth : image.width;
  const h = 'naturalHeight' in image ? image.naturalHeight : image.height;
  const canvas = target ?? document.createElement('canvas');
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser could not create a canvas.');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image, 0, 0, w, h);
  if (mode === 'original') return canvas;

  const active = regions.filter(canCleanLocally);
  for (const r of active) cleanRegion(ctx, r, w, h);
  if (mode === 'translated') {
    await ensureFonts(active);
    for (const r of active) typesetRegion(ctx, r, w, h);
  }
  return canvas;
}

/**
 * Counts pixels that differ between two renders outside every region. This is
 * the compare tool's artwork-preservation check.
 */
export function pixelsChangedOutsideRegions(a: ImageData, b: ImageData, regions: DialogueRegion[]) {
  const { width: w, height: h } = a;
  const mask = new Uint8Array(w * h);
  for (const r of regions) {
    const px = regionPx(r, w, h);
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
