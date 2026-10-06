/**
 * Fitting translated text into a bubble. Pure: the caller supplies a measure
 * function (canvas `measureText` in the browser, a stub in tests).
 *
 * Order of operations follows the product rule — line breaks first, size
 * last, and never below a readable floor. When text can't fit at the floor,
 * the result says so instead of shrinking it into illegibility.
 */

export type Measure = (text: string, fontSizePx: number) => number;

export interface FitInput {
  text: string;
  /** Usable text box inside the bubble, in page pixels. */
  boxWidth: number;
  boxHeight: number;
  /** Preferred size when auto-fit is off; upper bound when it's on. */
  fontSizePx: number;
  minFontSizePx: number;
  lineHeight: number;
  autoFit: boolean;
}

export interface FitResult {
  lines: string[];
  fontSizePx: number;
  fits: boolean;
  /** Height the lines occupy at the chosen size. */
  blockHeight: number;
}

export function wrapLines(text: string, maxWidth: number, size: number, measure: Measure): string[] {
  return text.split(/\n/).flatMap(paragraph => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const greedy: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate, size) > maxWidth) { greedy.push(line); line = word; }
      else line = candidate;
    }
    greedy.push(line);
    // Keep the minimum line count (and therefore fit height), but distribute
    // words evenly instead of leaving a lone "a" or "and" on its own line.
    if (words.length > 100 || greedy.length < 2 || greedy.some(l => measure(l, size) > maxWidth)) return greedy;
    const count = greedy.length, n = words.length;
    const widths = new Map<string, number>();
    const widthOf = (line: string) => {
      let width = widths.get(line);
      if (width === undefined) { width = measure(line, size); widths.set(line, width); }
      return width;
    };
    const memo = new Map<string, { cost: number; lines: string[] }>();
    function solve(start: number, remaining: number): { cost: number; lines: string[] } {
      if (!remaining) return { cost: start === n ? 0 : Infinity, lines: [] };
      const key = `${start}:${remaining}`, cached = memo.get(key);
      if (cached) return cached;
      let best = { cost: Infinity, lines: [] as string[] }, candidate = '';
      for (let end = start; end <= n - remaining; end++) {
        candidate += (candidate ? ' ' : '') + words[end];
        const width = widthOf(candidate);
        if (width > maxWidth) break;
        const rest = solve(end + 1, remaining - 1);
        const slack = (maxWidth - width) / Math.max(1, maxWidth);
        const orphan = end === start && n > count ? 1.5 : 0;
        const cost = rest.cost + slack * slack + orphan;
        if (cost < best.cost) best = { cost, lines: [candidate, ...rest.lines] };
      }
      memo.set(key, best);
      return best;
    }
    const balanced = solve(0, count);
    return Number.isFinite(balanced.cost) ? balanced.lines : greedy;
  });
}

function fitsAt(input: FitInput, size: number, measure: Measure) {
  const lines = wrapLines(input.text, input.boxWidth, size, measure);
  const blockHeight = lines.length * size * input.lineHeight;
  const widest = Math.max(0, ...lines.map((l) => measure(l, size)));
  return { lines, blockHeight, fits: blockHeight <= input.boxHeight && widest <= input.boxWidth };
}

export function fitText(input: FitInput, measure: Measure): FitResult {
  const min = Math.max(1, input.minFontSizePx);
  if (!input.text.trim()) return { lines: [], fontSizePx: input.fontSizePx, fits: true, blockHeight: 0 };

  if (!input.autoFit) {
    const size = Math.max(min, input.fontSizePx);
    const r = fitsAt(input, size, measure);
    return { ...r, fontSizePx: size };
  }

  // The chosen size wins whenever it fits; otherwise search down to the floor.
  const preferred = Math.max(min, input.fontSizePx);
  const atPreferred = fitsAt(input, preferred, measure);
  if (atPreferred.fits) return { ...atPreferred, fontSizePx: preferred };
  let lo = min;
  let hi = preferred;
  const atFloor = fitsAt(input, lo, measure);
  if (!atFloor.fits) return { ...atFloor, fontSizePx: lo, fits: false };
  for (let i = 0; i < 18 && hi - lo > 0.25; i++) {
    const mid = (lo + hi) / 2;
    if (fitsAt(input, mid, measure).fits) lo = mid;
    else hi = mid;
  }
  const size = Math.floor(lo * 4) / 4;
  return { ...fitsAt(input, size, measure), fontSizePx: size, fits: true };
}

/** The usable text box inside a region: an ellipse's inscribed rectangle, or a padded box. */
export function usableBox(width: number, height: number, shape: 'ellipse' | 'box') {
  return shape === 'ellipse' ? { width: width * 0.78, height: height * 0.74 } : { width: width * 0.9, height: height * 0.84 };
}
