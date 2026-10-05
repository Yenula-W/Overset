import type { LetteringAnalysis, PixelBox } from './lettering-core';

/**
 * Bubble-aware text removal. Pure (no DOM), so it runs under `node --test`
 * and on the server.
 *
 * A speech bubble is a light, enclosed shape. Its lettering forms dark
 * "holes" inside that shape. Only those holes, plus the faint antialiased
 * fringe around them, are ever repainted. The bubble outline belongs to the
 * shape's boundary, not to a hole, so it is never touched, and neither is
 * anything outside the bubble. A bubble that isn't enclosed inside the
 * searched area (open, merged into the gutter, or a box that misses it) is
 * refused rather than guessed at.
 */

export interface BubbleAnalysis extends LetteringAnalysis {
  /** The bubble interior including its lettering, in crop pixels. */
  filled: Uint8Array | null;
  /** Bubble interior bounding box in crop pixels. */
  bubbleBox: PixelBox | null;
  /** Median bubble colour. */
  background: [number, number, number];
}

const EMPTY = (total: number): BubbleAnalysis => ({ mask: new Uint8Array(total), textBox: null, safeBox: null, glyphHeight: 0, glyphCount: 0, filled: null, bubbleBox: null, background: [255, 255, 255] });

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

/**
 * @param region the text region inside the crop. The crop should extend past
 * it on every side so the bubble outline is visible.
 */
export function analyzeBubble(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number, region: PixelBox): BubbleAnalysis {
  const total = width * height;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || total > 16_000_000 || rgba.length !== total * 4) throw new Error('Bubble dimensions do not match the image.');
  const lum = new Uint8Array(total);
  for (let i = 0, k = 0; i < total; i++, k += 4) lum[i] = (rgba[k] * 299 + rgba[k + 1] * 587 + rgba[k + 2] * 114) / 1000;

  // Sample the middle of the region for the bubble colour and the ink.
  const rx0 = Math.max(0, Math.floor(region.x)), ry0 = Math.max(0, Math.floor(region.y));
  const rx1 = Math.min(width, Math.ceil(region.x + region.width)), ry1 = Math.min(height, Math.ceil(region.y + region.height));
  if (rx1 - rx0 < 6 || ry1 - ry0 < 6) return EMPTY(total);
  const cx0 = Math.floor(rx0 + (rx1 - rx0) * 0.2), cx1 = Math.ceil(rx1 - (rx1 - rx0) * 0.2);
  const cy0 = Math.floor(ry0 + (ry1 - ry0) * 0.2), cy1 = Math.ceil(ry1 - (ry1 - ry0) * 0.2);
  const centre: number[] = [];
  for (let y = cy0; y < cy1; y++) for (let x = cx0; x < cx1; x++) centre.push(y * width + x);
  const centreLum = centre.map((i) => lum[i]);
  const bgLum = percentile(centreLum, 0.85), inkLum = percentile(centreLum, 0.03);
  // Light bubbles only. Dark or heavily toned balloons need a human.
  if (bgLum < 150) return EMPTY(total);
  const bright = centre.filter((i) => lum[i] >= bgLum - 10);
  const background = [0, 1, 2].map((c) => percentile(bright.map((i) => rgba[i * 4 + c]), 0.5)) as [number, number, number];
  const tolerance = Math.max(35, Math.min(110, (bgLum - inkLum) * 0.45));
  const distance = (i: number) => Math.max(Math.abs(rgba[i * 4] - background[0]), Math.abs(rgba[i * 4 + 1] - background[1]), Math.abs(rgba[i * 4 + 2] - background[2]));
  const light = new Uint8Array(total);
  for (let i = 0; i < total; i++) light[i] = distance(i) <= tolerance ? 1 : 0;

  // Light components (4-connected); the bubble is the one filling most of the region's middle.
  const label = new Int32Array(total);
  const stack = new Int32Array(total);
  const touches: boolean[] = [false];
  const inCentre = new Map<number, number>();
  let next = 0;
  for (let start = 0; start < total; start++) {
    if (!light[start] || label[start]) continue;
    next++;
    let sp = 0, edge = false;
    stack[sp++] = start; label[start] = next;
    while (sp) {
      const i = stack[--sp], x = i % width, y = (i - x) / width;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edge = true;
      if (x > 0 && light[i - 1] && !label[i - 1]) { label[i - 1] = next; stack[sp++] = i - 1; }
      if (x < width - 1 && light[i + 1] && !label[i + 1]) { label[i + 1] = next; stack[sp++] = i + 1; }
      if (y > 0 && light[i - width] && !label[i - width]) { label[i - width] = next; stack[sp++] = i - width; }
      if (y < height - 1 && light[i + width] && !label[i + width]) { label[i + width] = next; stack[sp++] = i + width; }
    }
    touches[next] = edge;
  }
  for (const i of centre) if (label[i]) inCentre.set(label[i], (inCentre.get(label[i]) ?? 0) + 1);
  let bubble = 0, best = 0;
  for (const [id, count] of inCentre) if (count > best) { best = count; bubble = id; }
  // Mostly-ink middles aren't a bubble; an edge-touching shape isn't enclosed.
  if (!bubble || best < centre.length * 0.3 || touches[bubble]) return EMPTY(total);

  // Everything not reachable from the crop border without crossing the bubble
  // is inside it: the bubble plus its lettering.
  const outside = new Uint8Array(total);
  let sp = 0;
  const seed = (i: number) => { if (label[i] !== bubble && !outside[i]) { outside[i] = 1; stack[sp++] = i; } };
  for (let x = 0; x < width; x++) { seed(x); seed((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { seed(y * width); seed(y * width + width - 1); }
  while (sp) {
    const i = stack[--sp], x = i % width, y = (i - x) / width;
    if (x > 0) seed(i - 1);
    if (x < width - 1) seed(i + 1);
    if (y > 0) seed(i - width);
    if (y < height - 1) seed(i + width);
  }
  const filled = new Uint8Array(total);
  let fx0 = width, fy0 = height, fx1 = -1, fy1 = -1, filledArea = 0;
  for (let i = 0; i < total; i++) if (!outside[i]) {
    filled[i] = 1; filledArea++;
    const x = i % width, y = (i - x) / width;
    if (x < fx0) fx0 = x; if (x > fx1) fx1 = x; if (y < fy0) fy0 = y; if (y > fy1) fy1 = y;
  }
  const bubbleBox = { x: fx0, y: fy0, width: fx1 - fx0 + 1, height: fy1 - fy0 + 1 };

  // Holes = lettering. A hole that is a large share of the bubble is a
  // drawing, not text, and is kept.
  const hole = new Int32Array(total);
  const glyphs: Array<{ pixels: number[]; box: PixelBox }> = [];
  let holes = 0;
  for (let start = 0; start < total; start++) {
    if (!filled[start] || label[start] === bubble || hole[start]) continue;
    holes++;
    const pixels: number[] = [];
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    sp = 0; stack[sp++] = start; hole[start] = holes;
    while (sp) {
      const i = stack[--sp], x = i % width, y = (i - x) / width;
      pixels.push(i);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const j = ny * width + nx;
        if (filled[j] && label[j] !== bubble && !hole[j]) { hole[j] = holes; stack[sp++] = j; }
      }
    }
    if (pixels.length > filledArea * 0.25) continue;
    glyphs.push({ pixels, box: { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } });
  }
  const ink = glyphs.reduce((sum, g) => sum + g.pixels.length, 0);
  // Mostly dark "bubbles" are artwork (a toned panel, a busy drawing).
  if (ink > filledArea * 0.45) return EMPTY(total);
  // Lettering is made of thin strokes. Solid blobs (eyes, pupils, shading)
  // mean this light shape is a face or object, not a bubble.
  const marks = glyphs.filter((g) => g.pixels.length >= 6);
  const solidity = percentile(marks.map((g) => g.pixels.length / (g.box.width * g.box.height)), 0.5);
  if (marks.length && solidity > 0.62) return EMPTY(total);

  const mask = new Uint8Array(total);
  for (const g of glyphs) for (const i of g.pixels) mask[i] = 1;
  // The antialiased fringe: bubble pixels next to lettering that are visibly
  // off the bubble colour. Never next to the outside, so outlines stay intact.
  const fringe: number[] = [];
  for (const g of glyphs) for (const i of g.pixels) {
    const x = i % width, y = (i - x) / width;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= width - 1 || ny >= height - 1) continue;
      const j = ny * width + nx;
      if (mask[j] || label[j] !== bubble || distance(j) <= 12) continue;
      if (outside[j - 1] || outside[j + 1] || outside[j - width] || outside[j + width]) continue;
      fringe.push(j);
    }
  }
  for (const j of fringe) mask[j] = 1;

  const textBox = glyphs.length ? {
    x: Math.min(...glyphs.map((g) => g.box.x)), y: Math.min(...glyphs.map((g) => g.box.y)),
    width: Math.max(...glyphs.map((g) => g.box.x + g.box.width)) - Math.min(...glyphs.map((g) => g.box.x)),
    height: Math.max(...glyphs.map((g) => g.box.y + g.box.height)) - Math.min(...glyphs.map((g) => g.box.y)),
  } : null;
  const glyphHeight = percentile(glyphs.filter((g) => g.pixels.length >= 4).map((g) => g.box.height), 0.8);

  // Largest rectangle inside the bubble around its middle: where the
  // translation is lettered, so it never crosses the outline.
  const midX = Math.floor(textBox ? textBox.x + textBox.width / 2 : bubbleBox.x + bubbleBox.width / 2);
  const midY = Math.floor(textBox ? textBox.y + textBox.height / 2 : bubbleBox.y + bubbleBox.height / 2);
  const columns = new Int32Array(width), indices = new Int32Array(width + 1);
  let rect: PixelBox | null = null, area = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) columns[x] = filled[y * width + x] ? columns[x] + 1 : 0;
    let size = 0;
    for (let x = 0; x <= width; x++) {
      const current = x === width ? 0 : columns[x];
      while (size && columns[indices[size - 1]] > current) {
        const column = indices[--size], h = columns[column], left = size ? indices[size - 1] + 1 : 0, w = x - left, top = y - h + 1;
        if (w * h > area && midX >= left && midX < x && midY >= top && midY <= y) { area = w * h; rect = { x: left, y: top, width: w, height: h }; }
      }
      indices[size++] = x;
    }
  }
  let safeBox: PixelBox | null = null;
  if (rect) {
    const padX = Math.max(2, Math.round(rect.width * 0.06)), padY = Math.max(2, Math.round(rect.height * 0.06));
    if (rect.width - padX * 2 > 10 && rect.height - padY * 2 > 8) safeBox = { x: rect.x + padX, y: rect.y + padY, width: rect.width - padX * 2, height: rect.height - padY * 2 };
  }
  return { mask, textBox, safeBox, glyphHeight, glyphCount: glyphs.length, filled, bubbleBox, background };
}

/**
 * Repaints only masked pixels, interpolating the surrounding bubble colour so
 * toned and gradient bubbles stay smooth. Every unmasked byte is unchanged.
 */
export function fillBubbleText(rgba: Uint8ClampedArray, width: number, height: number, analysis: BubbleAnalysis) {
  const { mask, background } = analysis;
  const locations: number[] = [];
  for (let i = 0; i < mask.length; i++) if (mask[i]) locations.push(i);
  if (!locations.length) return rgba;
  const working = new Float32Array(rgba.length);
  working.set(rgba);
  for (const i of locations) for (let c = 0; c < 3; c++) working[i * 4 + c] = background[c];
  for (let pass = 0; pass < 48; pass++) for (const i of locations) {
    const x = i % width;
    if (x === 0 || x === width - 1 || i < width || i >= width * (height - 1)) continue;
    for (let c = 0; c < 3; c++) working[i * 4 + c] = (working[(i - 1) * 4 + c] + working[(i + 1) * 4 + c] + working[(i - width) * 4 + c] + working[(i + width) * 4 + c]) / 4;
  }
  for (const i of locations) for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.round(working[i * 4 + c]);
  return rgba;
}

/** How far past a region's box to look for its bubble outline. */
export function bubbleMargin(width: number, height: number) {
  return Math.max(8, Math.round(Math.max(width, height) * 0.2));
}
