/** All scroll effects share one continuous, reversible timeline. */
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

/** Zero velocity at each end avoids a visible jolt between story beats. */
export function phase(progress: number, start: number, end: number) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

/** Time-based damping behaves the same on 60Hz and 120Hz displays. */
export function damp(current: number, target: number, elapsedMs: number) {
  return lerp(current, target, 1 - Math.exp(-Math.max(0, elapsedMs) / 90));
}

export function timeline(progress: number) {
  const p = clamp(progress);
  return {
    intro: 1 - phase(p, 0.015, 0.13),
    lift: phase(p, 0.07, 0.43),
    desk: 1 - phase(p, 0.23, 0.43),
    controls: phase(p, 0.43, 0.49),
    translation: phase(p, 0.54, 0.59),
    source: 1 - phase(p, 0.66, 0.74),
    target: phase(p, 0.79, 0.86),
    detection: phase(p, 0.43, 0.50) * (1 - phase(p, 0.89, 0.94)),
    finished: phase(p, 0.91, 0.96),
    step: p < 0.43 ? -1 : p < 0.54 ? 0 : p < 0.66 ? 1 : p < 0.79 ? 2 : p < 0.90 ? 3 : 4,
  };
}
