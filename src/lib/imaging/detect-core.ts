/**
 * On-device speech-bubble detection — no AI service required.
 *
 * Bubbles are light, enclosed shapes with dark glyphs inside. This finds light
 * connected components that don't touch the page edge, are bubble-sized, and
 * contain text-like dark pixels. It is a starting point the translator
 * reviews: regions can be deleted, redrawn, or added by hand.
 *
 * Pure (no DOM), so it runs under `node --test`.
 */

export interface PxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedBubble extends PxRect {
  /** 0–1: how bubble-like the component looked. Not an OCR confidence. */
  score: number;
  shape: 'ellipse' | 'box';
  /** Estimated source lettering size in analysis pixels, from the glyph rows. */
  fontSizePx: number;
}

export interface DetectOptions {
  lightThreshold?: number;
  darkThreshold?: number;
  minAreaRatio?: number;
  maxAreaRatio?: number;
  maxWidthRatio?: number;
}

const DEFAULTS: Required<DetectOptions> = {
  lightThreshold: 222,
  darkThreshold: 110,
  minAreaRatio: 0.0012,
  maxAreaRatio: 0.07,
  maxWidthRatio: 0.78,
};

/**
 * @param lum luminance, one byte per pixel, row-major, `width * height` long.
 */
export function detectBubbles(lum: Uint8Array, width: number, height: number, options: DetectOptions = {}): DetectedBubble[] {
  const o = { ...DEFAULTS, ...options };
  const total = width * height;
  const labels = new Int32Array(total); // 0 = unlabeled
  const stack = new Int32Array(total);
  const found: DetectedBubble[] = [];
  let next = 0;

  for (let start = 0; start < total; start++) {
    if (labels[start] !== 0 || lum[start] < o.lightThreshold) continue;
    next++;
    let sp = 0;
    stack[sp++] = start;
    labels[start] = next;
    let area = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let touchesEdge = false;

    while (sp > 0) {
      const i = stack[--sp];
      area++;
      const x = i % width;
      const y = (i - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true;
      if (x > 0) { const j = i - 1; if (labels[j] === 0 && lum[j] >= o.lightThreshold) { labels[j] = next; stack[sp++] = j; } }
      if (x < width - 1) { const j = i + 1; if (labels[j] === 0 && lum[j] >= o.lightThreshold) { labels[j] = next; stack[sp++] = j; } }
      if (y > 0) { const j = i - width; if (labels[j] === 0 && lum[j] >= o.lightThreshold) { labels[j] = next; stack[sp++] = j; } }
      if (y < height - 1) { const j = i + width; if (labels[j] === 0 && lum[j] >= o.lightThreshold) { labels[j] = next; stack[sp++] = j; } }
    }

    if (touchesEdge) continue;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const areaRatio = area / total;
    if (areaRatio < o.minAreaRatio || areaRatio > o.maxAreaRatio) continue;
    if (bw > width * o.maxWidthRatio || bw < 12 || bh < 8) continue;
    const aspect = bw / bh;
    if (aspect < 0.2 || aspect > 7) continue;

    const boxArea = bw * bh;
    const fill = area / boxArea;
    if (fill < 0.45) continue;

    // Text lives inside the bubble as dark holes in the light component. Only
    // count dark pixels with bubble on both sides of them in the same row, so
    // the bubble's own outline (bubble on one side only) isn't mistaken for text.
    let dark = 0, inner = 0;
    let textRows = 0, runs = 0, inRun = false;
    const iy0 = minY + Math.floor(bh * 0.1), iy1 = maxY - Math.floor(bh * 0.1);
    for (let y = iy0; y <= iy1; y++) {
      const row = y * width;
      let first = -1, last = -1;
      for (let x = minX; x <= maxX; x++) if (labels[row + x] === next) { if (first < 0) first = x; last = x; }
      let rowDark = 0;
      if (first >= 0) {
        for (let x = first + 1; x < last; x++) {
          inner++;
          if (labels[row + x] !== next && lum[row + x] < o.darkThreshold) rowDark++;
        }
      }
      dark += rowDark;
      // Rows holding glyph ink, grouped into runs ≈ lines of lettering.
      if (rowDark > 0) {
        textRows++;
        if (!inRun) runs++;
        inRun = true;
      } else inRun = false;
    }
    const darkRatio = inner ? dark / inner : 0;
    if (darkRatio < 0.008 || darkRatio > 0.4) continue;

    // Ellipses fill ~π/4 of their box; rectangles fill nearly all of it.
    const shape: DetectedBubble['shape'] = fill + darkRatio > 0.9 ? 'box' : 'ellipse';
    const score = Math.max(
      0,
      Math.min(1, 0.45 + Math.min(0.3, darkRatio * 3) + (fill > 0.6 && fill < 0.95 ? 0.2 : 0) - (areaRatio > 0.04 ? 0.15 : 0)),
    );
    // Glyph ink spans ~72% of the font's em height.
    const lineInk = runs ? textRows / runs : bh * 0.2;
    found.push({ x: minX, y: minY, width: bw, height: bh, score, shape, fontSizePx: lineInk / 0.72 });
  }

  return found;
}

/**
 * Reading order: rows top to bottom; within a row, left to right for Korean
 * and Chinese, right to left for Japanese manga. Regions whose vertical
 * extents overlap by half the shorter one share a row.
 */
export function readingOrder<T extends PxRect>(rects: T[], direction: 'ltr' | 'rtl' = 'ltr'): T[] {
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: T[][] = [];
  for (const r of sorted) {
    const row = rows.find((candidate) =>
      candidate.some((c) => {
        const overlap = Math.min(c.y + c.height, r.y + r.height) - Math.max(c.y, r.y);
        return overlap > Math.min(c.height, r.height) * 0.5;
      }),
    );
    if (row) row.push(r);
    else rows.push([r]);
  }
  return rows.flatMap((row) => row.sort((a, b) => (direction === 'rtl' ? b.x - a.x : a.x - b.x)));
}

/** Rec. 601 luma from RGBA bytes. */
export function rgbaToLuma(rgba: Uint8ClampedArray | Uint8Array, pixelCount: number): Uint8Array {
  const out = new Uint8Array(pixelCount);
  for (let i = 0, j = 0; i < pixelCount; i++, j += 4) {
    out[i] = (rgba[j] * 299 + rgba[j + 1] * 587 + rgba[j + 2] * 114) / 1000;
  }
  return out;
}
