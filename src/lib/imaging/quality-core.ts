/**
 * Page quality gate. Text removal and lettering need crisp source pixels: on
 * a tiny or blurred page the lettering melts into the bubble outline and no
 * cleanup can separate them. Such pages are refused with a clear reason
 * instead of producing a smudged translation.
 *
 * Pure (no DOM), so the browser upload and the server use the same rule.
 */

/** Narrowest page Overset will process. Webtoon strips are commonly 690–800px. */
export const MIN_PAGE_WIDTH = 600;
/** Below this, edges are spread over several pixels: the page is blurred or upscaled. */
export const MIN_SHARPNESS = 0.33;

export interface PageQuality {
  ok: boolean;
  /** 0–0.5: steepest edge slope relative to its contrast. ~0.5 is a crisp step edge. */
  sharpness: number;
  reason?: string;
}

/**
 * How steep the page's strong edges are. For each high-contrast pixel the
 * central-difference gradient is divided by the local contrast, so the value
 * doesn't depend on how dark the ink is, only on how many pixels an edge is
 * smeared across. Line art is full of edges, so a high percentile is stable.
 */
export function measureSharpness(lum: Uint8Array, width: number, height: number): number {
  if (lum.length !== width * height) throw new Error('Image dimensions do not match the pixels.');
  const values: number[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 1_500_000)));
  for (let y = 4; y < height - 4; y += step) {
    for (let x = 4; x < width - 4; x += step) {
      const i = y * width + x;
      const gx = Math.abs(lum[i + 1] - lum[i - 1]) / 2;
      const gy = Math.abs(lum[i + width] - lum[i - width]) / 2;
      const g = Math.max(gx, gy);
      if (g < 12) continue;
      let lo = 255, hi = 0;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const v = lum[i + dy * width + dx];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      // Only strong edges: a blurred thin line loses contrast and would
      // otherwise look steeper than it is.
      if (hi - lo < 140) continue;
      values.push(g / (hi - lo));
    }
  }
  if (values.length < 200) return 0;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length * 0.9)];
}

export function assessPageQuality(lum: Uint8Array, width: number, height: number): PageQuality {
  if (width < MIN_PAGE_WIDTH) {
    return { ok: false, sharpness: 0, reason: `This page is only ${width}×${height} px. Upload the original scan, at least ${MIN_PAGE_WIDTH} px wide, so the text can be removed cleanly.` };
  }
  const sharpness = measureSharpness(lum, width, height);
  if (sharpness < MIN_SHARPNESS) {
    return { ok: false, sharpness, reason: 'This page is too blurry to remove the text cleanly. Upload a sharper, original-resolution scan.' };
  }
  return { ok: true, sharpness };
}
