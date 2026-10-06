import type { Rect } from '@/lib/types/domain';

/**
 * Matching AI-read text to the bubbles found on the page. The AI is good at
 * reading text and poor at saying exactly where it is, so its own boxes are
 * only trusted after they are confirmed against the page pixels.
 *
 * Pure, so it runs under `node --test`.
 */

/** Shared area as a share of the smaller box: 1 when one box contains the other. */
export function overlapRatio(a: Rect, b: Rect) {
  const w = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const smaller = Math.min(a.width * a.height, b.width * b.height);
  return smaller > 0 ? (w * h) / smaller : 0;
}

const BUBBLE_TYPES = new Set(['dialogue', 'thought', 'narration']);

/**
 * Which still-empty candidate bubble a detection belongs to, if any.
 *
 * A detection confirmed on the page (`snapped`) must overlap the candidate.
 * An unconfirmed dialogue box usually means the AI put the right text in
 * the wrong place, so it goes to the nearest empty bubble when one is close.
 */
export function matchCandidate(
  detection: { bounds: Rect; type: string; snapped: boolean },
  candidates: Array<{ id: string; bounds: Rect }>,
  page: { width: number; height: number },
): string | undefined {
  let best: { id: string; score: number } | undefined;
  for (const c of candidates) {
    const score = overlapRatio(detection.bounds, c.bounds);
    if (score >= 0.5 && (!best || score > best.score)) best = { id: c.id, score };
  }
  if (best || detection.snapped || !BUBBLE_TYPES.has(detection.type)) return best?.id;
  const centre = (r: Rect) => ({ x: ((r.x + r.width / 2) / 100) * page.width, y: ((r.y + r.height / 2) / 100) * page.height });
  const d = centre(detection.bounds);
  let nearest: { id: string; distance: number } | undefined;
  for (const c of candidates) {
    const p = centre(c.bounds);
    const distance = Math.hypot(p.x - d.x, p.y - d.y);
    if (distance <= page.width * 0.3 && (!nearest || distance < nearest.distance)) nearest = { id: c.id, distance };
  }
  return nearest?.id;
}
