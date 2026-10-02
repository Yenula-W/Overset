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

/** Story beats, as fractions of the pinned scroll. */
export const BEATS = {
  detect: [0.32, 0.41],
  scan: [0.42, 0.55],
  erase: [0.56, 0.67],
  write: [0.70, 0.85],
} as const;

/**
 * Region `index` of `count` runs its own slice of a beat, overlapping its
 * neighbours, so the page reads bubble by bubble instead of all at once.
 */
export function staggered(progress: number, [start, end]: readonly [number, number], index: number, count: number) {
  const span = (end - start) * 0.5;
  const offset = count > 1 ? ((end - start - span) * index) / (count - 1) : 0;
  return phase(progress, start + offset, start + offset + span);
}

export function timeline(progress: number) {
  const p = clamp(progress);
  return {
    intro: 1 - phase(p, 0.01, 0.09),
    lift: phase(p, 0.05, 0.3),
    desk: 1 - phase(p, 0.16, 0.3),
    controls: phase(p, 0.3, 0.34),
    /** The reading beam's position down the page, and its visibility. */
    scan: phase(p, BEATS.scan[0], BEATS.scan[1]),
    beam: phase(p, 0.41, 0.43) * (1 - phase(p, 0.54, 0.56)),
    source: 1 - phase(p, BEATS.erase[0], BEATS.erase[1]),
    target: phase(p, BEATS.write[0], BEATS.write[1]),
    detection: phase(p, BEATS.detect[0], 0.36) * (1 - phase(p, 0.86, 0.91)),
    finished: phase(p, 0.9, 0.95),
    step: p < 0.32 ? -1 : p < 0.42 ? 0 : p < 0.56 ? 1 : p < 0.69 ? 2 : p < 0.87 ? 3 : 4,
  };
}
