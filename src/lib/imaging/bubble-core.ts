import type { LetteringAnalysis, PixelBox } from './lettering-core';

/**
 * Bubble-aware text removal. Pure (no DOM), so it runs under `node --test`
 * and on the server.
 *
 * A speech bubble is a light, enclosed shape. Its lettering forms dark
 * "holes" inside that shape. Only those holes, with the antialiased ring
 * around each letter, are ever repainted. The bubble outline belongs to the
 * shape's boundary, not to a hole, so it is never touched, and neither is
 * anything outside the bubble. A bubble that isn't enclosed inside the
 * searched area (open, merged into the gutter, or a box that misses it) is
 * refused rather than guessed at.
 */

export interface BubbleAnalysis extends LetteringAnalysis {
  /** Separate rectangular lobes in a connected caption silhouette. */
  captionBoxes?: PixelBox[];
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
  // Strict, so a faint or antialiased outline still separates the bubble
  // from the page around it. Lettering edges simply join the holes.
  const tolerance = Math.max(25, Math.min(60, (bgLum - inkLum) * 0.25));
  const distance = (i: number) => Math.max(Math.abs(rgba[i * 4] - background[0]), Math.abs(rgba[i * 4 + 1] - background[1]), Math.abs(rgba[i * 4 + 2] - background[2]));
  const light = new Uint8Array(total);
  for (let i = 0; i < total; i++) light[i] = distance(i) <= tolerance ? 1 : 0;
  // The bubble is the light shape filling most of the region's middle. Small
  // gaps in its outline (where it meets a panel edge or its tail) are sealed
  // by ignoring light pixels within `seal` of ink, using the smallest seal
  // that encloses the bubble so lettering near the outline is still found.
  const maxSeal = Math.max(2, Math.round(Math.min(rx1 - rx0, ry1 - ry0) * 0.02));
  const label = new Int32Array(total);
  const stack = new Int32Array(total);
  let bubble = 0, core = light;
  for (let seal = 0; seal <= maxSeal && !bubble; seal++) {
    core = seal ? erodeLight(light, width, height, seal) : light;
    label.fill(0);
    const touches: boolean[] = [false];
    let next = 0;
    for (let start = 0; start < total; start++) {
      if (!core[start] || label[start]) continue;
      next++;
      let sp = 0, edge = false;
      stack[sp++] = start; label[start] = next;
      while (sp) {
        const i = stack[--sp], x = i % width, y = (i - x) / width;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edge = true;
        if (x > 0 && core[i - 1] && !label[i - 1]) { label[i - 1] = next; stack[sp++] = i - 1; }
        if (x < width - 1 && core[i + 1] && !label[i + 1]) { label[i + 1] = next; stack[sp++] = i + 1; }
        if (y > 0 && core[i - width] && !label[i - width]) { label[i - width] = next; stack[sp++] = i - width; }
        if (y < height - 1 && core[i + width] && !label[i + width]) { label[i + width] = next; stack[sp++] = i + width; }
      }
      touches[next] = edge;
    }
    const inCentre = new Map<number, number>();
    for (const i of centre) if (label[i]) inCentre.set(label[i], (inCentre.get(label[i]) ?? 0) + 1);
    let candidate = 0, best = 0;
    for (const [id, count] of inCentre) if (count > best) { best = count; candidate = id; }
    // Mostly-ink middles aren't a bubble; an edge-touching shape isn't enclosed.
    if (candidate && best >= centre.length * 0.3 && !touches[candidate]) bubble = candidate;
  }
  if (!bubble) return EMPTY(total);

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
  let bubbleBox = { x: fx0, y: fy0, width: fx1 - fx0 + 1, height: fy1 - fy0 + 1 };
  const captionBoxes = connectedCaptionBoxes(filled, width, height);
  let compound = false;
  let letteringFilled: Uint8Array | null = null;
  if (captionBoxes.length > 1) {
    const scored = captionBoxes.map((box,index) => {
      const overlap = Math.max(0,Math.min(box.x+box.width,rx1)-Math.max(box.x,rx0)) * Math.max(0,Math.min(box.y+box.height,ry1)-Math.max(box.y,ry0));
      return {index,score:overlap/Math.min(box.width*box.height,(rx1-rx0)*(ry1-ry0))};
    }).sort((a,b)=>b.score-a.score);
    compound = scored[1].score >= scored[0].score*.65;
    if (!compound) {
      const selected = scored[0].index;
      bubbleBox = captionBoxes[selected]; filledArea = 0;
      letteringFilled = new Uint8Array(total);
      for(let i=0;i<total;i++) {
        const x=i%width,y=Math.floor(i/width);
        // A straight bisector reserves separate lettering lanes. Cleanup still
        // uses nearest-box ownership so source glyphs are removed independently.
        if (filled[i] && x >= bubbleBox.x && x < bubbleBox.x + bubbleBox.width && y >= bubbleBox.y && y < bubbleBox.y + bubbleBox.height) {
          letteringFilled[i] = captionBoxes.every((other,index) => {
            if (index === selected || x < other.x || x >= other.x + other.width || y < other.y || y >= other.y + other.height) return true;
            const dx = bubbleBox.x + bubbleBox.width/2 - other.x - other.width/2;
            const dy = bubbleBox.y + bubbleBox.height/2 - other.y - other.height/2;
            const horizontal = Math.abs(dx)/(bubbleBox.width+other.width) >= Math.abs(dy)/(bubbleBox.height+other.height);
            const split = horizontal
              ? (Math.max(bubbleBox.x,other.x)+Math.min(bubbleBox.x+bubbleBox.width,other.x+other.width))/2
              : (Math.max(bubbleBox.y,other.y)+Math.min(bubbleBox.y+bubbleBox.height,other.y+other.height))/2;
            return horizontal ? (dx > 0 ? x >= Math.ceil(split) : x < Math.ceil(split)) : (dy > 0 ? y >= Math.ceil(split) : y < Math.ceil(split));
          }) ? 1 : 0;
        }
        if(filled[i] && captionOwner(captionBoxes,x,y)!==selected) filled[i]=0;
        outside[i]=filled[i]?0:1;
        if(filled[i]) filledArea++;
      }
    }
  }

  // Holes = lettering.
  const hole = new Int32Array(total);
  const glyphs: Array<{ pixels: number[]; ink: number; box: PixelBox }> = [];
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
    // The ink itself, without the light ring the seal adds around it.
    let ix0 = width, iy0 = height, ix1 = -1, iy1 = -1, inkCount = 0;
    for (const i of pixels) if (!light[i]) {
      inkCount++;
      const x = i % width, y = (i - x) / width;
      if (x < ix0) ix0 = x; if (x > ix1) ix1 = x; if (y < iy0) iy0 = y; if (y > iy1) iy1 = y;
    }
    // A hole carrying a large share of the bubble's area in ink is a drawing.
    if (!inkCount || inkCount > filledArea * 0.3) continue;
    glyphs.push({ pixels, ink: inkCount, box: { x: ix0, y: iy0, width: ix1 - ix0 + 1, height: iy1 - iy0 + 1 } });
  }
  const ink = glyphs.reduce((sum, g) => sum + g.ink, 0);
  // Mostly dark "bubbles" are artwork (a toned panel, a busy drawing).
  if (ink > filledArea * 0.45) return EMPTY(total);
  // Lettering is made of thin strokes. Solid blobs (eyes, pupils, shading)
  // mean this light shape is a face or object, not a bubble.
  const marks = glyphs.filter((g) => g.ink >= 6);
  const solidity = percentile(marks.map((g) => g.ink / (g.box.width * g.box.height)), 0.5);
  if (marks.length && solidity > 0.7) return EMPTY(total);

  const mask = new Uint8Array(total);
  for (const g of glyphs) for (const i of g.pixels) mask[i] = 1;
  // The faint antialiased edge of each letter: bubble pixels beside it that
  // are visibly off the bubble colour. Never beside the outside, so the
  // outline stays intact.
  const fringe: number[] = [];
  for (const g of glyphs) for (const i of g.pixels) {
    const x = i % width, y = (i - x) / width;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= width - 1 || ny >= height - 1) continue;
      const j = ny * width + nx;
      if (mask[j] || !filled[j] || distance(j) <= 12) continue;
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
  const glyphHeight = percentile(glyphs.filter((g) => g.ink >= 4).map((g) => g.box.height), 0.8);
  // Scan noise and stray specks around the lettering, still well inside the
  // bubble, so the repainted area is as clean as the rest of the bubble.
  if (textBox) {
    const pad = Math.max(3, Math.round(glyphHeight * 0.5));
    for (let y = Math.max(1, textBox.y - pad); y < Math.min(height - 1, textBox.y + textBox.height + pad); y++) {
      for (let x = Math.max(1, textBox.x - pad); x < Math.min(width - 1, textBox.x + textBox.width + pad); x++) {
        const j = y * width + x;
        if (mask[j] || !filled[j] || distance(j) <= 5) continue;
        let clear = true;
        for (let dy = -3; dy <= 3 && clear; dy++) for (let dx = -3; dx <= 3; dx++) {
          const k = (y + dy) * width + x + dx;
          if (k < 0 || k >= total || outside[k]) { clear = false; break; }
        }
        if (clear) mask[j] = 1;
      }
    }
  }


  // Largest rectangle inside the bubble around its middle: where the
  // translation is lettered, so it never crosses the outline.
  // Cleanup ownership cuts an asymmetric notch out of connected captions.
  // Keep lettering centered on the original rectangle, not on that notch
  // or the source glyphs (which may be arranged in vertical columns).
  const centeredCaption = captionBoxes.length > 1 && !compound;
  const centerX = bubbleBox.x + bubbleBox.width / 2;
  const centerY = bubbleBox.y + bubbleBox.height / 2;
  const midX = Math.floor(centeredCaption ? centerX : textBox ? textBox.x + textBox.width / 2 : centerX);
  const midY = Math.floor(centeredCaption ? centerY : textBox ? textBox.y + textBox.height / 2 : centerY);
  const columns = new Int32Array(width), indices = new Int32Array(width + 1);
  let rect: PixelBox | null = null, area = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) columns[x] = (letteringFilled ?? filled)[y * width + x] ? columns[x] + 1 : 0;
    let size = 0;
    for (let x = 0; x <= width; x++) {
      const current = x === width ? 0 : columns[x];
      while (size && columns[indices[size - 1]] > current) {
        const column = indices[--size], h = columns[column], left = size ? indices[size - 1] + 1 : 0, w = x - left, top = y - h + 1;
        if (midX >= left && midX < x && midY >= top && midY <= y) {
          const halfW = Math.min(centerX - left, x - centerX);
          const halfH = Math.min(centerY - top, y + 1 - centerY);
          const candidate = centeredCaption
            ? { x: centerX - halfW, y: centerY - halfH, width: halfW * 2, height: halfH * 2 }
            : { x: left, y: top, width: w, height: h };
          if (candidate.width * candidate.height > area) { area = candidate.width * candidate.height; rect = candidate; }
        }
      }
      indices[size++] = x;
    }
  }
  let safeBox: PixelBox | null = null;
  if (rect && !compound) {
    const padX = Math.max(2, Math.round(rect.width * 0.06)), padY = Math.max(2, Math.round(rect.height * 0.06));
    if (rect.width - padX * 2 > 10 && rect.height - padY * 2 > 8) safeBox = { x: rect.x + padX, y: rect.y + padY, width: rect.width - padX * 2, height: rect.height - padY * 2 };
  }
  return { mask, textBox, safeBox, glyphHeight, glyphCount: glyphs.length, filled, bubbleBox, background, captionBoxes };
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

/** Light pixels with no ink within `radius` (Chebyshev distance). */
function erodeLight(light: Uint8Array, width: number, height: number, radius: number) {
  const rowNear = new Uint8Array(light.length), core = new Uint8Array(light.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let dark = 0;
    for (let x = 0; x < Math.min(width, radius); x++) dark += light[row + x] ? 0 : 1;
    for (let x = 0; x < width; x++) {
      if (x + radius < width) dark += light[row + x + radius] ? 0 : 1;
      if (x - radius - 1 >= 0) dark -= light[row + x - radius - 1] ? 0 : 1;
      rowNear[row + x] = dark > 0 ? 1 : 0;
    }
  }
  for (let x = 0; x < width; x++) {
    let dark = 0;
    for (let y = 0; y < Math.min(height, radius); y++) dark += rowNear[y * width + x];
    for (let y = 0; y < height; y++) {
      if (y + radius < height) dark += rowNear[(y + radius) * width + x];
      if (y - radius - 1 >= 0) dark -= rowNear[(y - radius - 1) * width + x];
      core[y * width + x] = light[y * width + x] && !dark ? 1 : 0;
    }
  }
  return core;
}


/** Recognize two staggered rectangular captions from their enclosed silhouette.
 * Long, stable edge runs distinguish boxes from an oval or a balloon tail. */
export function connectedCaptionBoxes(filled: Uint8Array, width: number, height: number): PixelBox[] {
  if (filled.length !== width * height) return [];
  function scan(transpose: boolean): PixelBox[] {
    const rows = transpose ? width : height, cols = transpose ? height : width;
    const spans: { left: number; right: number }[] = [];
    let first = rows, last = -1;
    for (let y = 0; y < rows; y++) {
      let left = cols, right = -1;
      for (let x = 0; x < cols; x++) if (filled[transpose ? x * width + y : y * width + x]) { left = Math.min(left,x); right = x; }
      spans.push({left,right});
      if (right >= left) { first = Math.min(first,y); last = y; }
    }
    if (last < first) return [];
    const length = last - first + 1;
    const bands: {start:number;end:number;left:number;right:number}[] = [];
    for (let start = first; start <= last;) {
      let end = start + 1, left = spans[start].left, right = spans[start].right;
      while (end <= last && Math.abs(spans[end].left - spans[start].left) <= 2 && Math.abs(spans[end].right - spans[start].right) <= 2) {
        left = Math.max(left,spans[end].left); right = Math.min(right,spans[end].right); end++;
      }
      if (end-start >= Math.max(8,length*.12) && right-left >= 12) bands.push({start,end,left,right});
      start = end;
    }
    if (bands.length < 2) return [];
    const a = bands[0], b = bands[bands.length-1];
    if (a.start > first+length*.15 || b.end < last-length*.15 || Math.abs(a.left-b.left) < 8 || Math.abs(a.right-b.right) < 8) return [];
    const boxes = [a,b].map(band => {
      let top = band.start, bottom = band.end;
      while (top > first && spans[top-1].left <= band.left && spans[top-1].right >= band.right) top--;
      while (bottom <= last && spans[bottom].left <= band.left && spans[bottom].right >= band.right) bottom++;
      return transpose ? {x:top,y:band.left,width:bottom-top,height:band.right-band.left+1} : {x:band.left,y:top,width:band.right-band.left+1,height:bottom-top};
    });
    const [one,two] = boxes;
    const intersection = Math.max(0,Math.min(one.x+one.width,two.x+two.width)-Math.max(one.x,two.x)) * Math.max(0,Math.min(one.y+one.height,two.y+two.height)-Math.max(one.y,two.y));
    if (intersection/Math.min(one.width*one.height,two.width*two.height) > .35) return [];
    let total = 0, covered = 0;
    for (let y=0;y<height;y++) for(let x=0;x<width;x++) if(filled[y*width+x]) {
      total++; if(boxes.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height)) covered++;
    }
    return total && covered/total >= .94 ? boxes : [];
  }
  const vertical = scan(false);
  return vertical.length ? vertical : scan(true);
}

/** Assign overlap pixels to the nearest box in normalized box coordinates. */
export function captionOwner(boxes: PixelBox[], x: number, y: number) {
  let owner = -1, best = Infinity;
  boxes.forEach((box,i) => {
    if (x<box.x || x>=box.x+box.width || y<box.y || y>=box.y+box.height) return;
    const score = ((x-box.x-box.width/2)/box.width)**2 + ((y-box.y-box.height/2)/box.height)**2;
    if (score < best) { owner = i; best = score; }
  });
  return owner;
}
