import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { analyzeBubble, fillBubbleText, bubbleMargin, connectedCaptionBoxes } from '../src/lib/imaging/bubble-core.ts';
import { assessPageQuality, measureSharpness } from '../src/lib/imaging/quality-core.ts';

const W = 900, H = 1200;
// A manga-like page: a panel border, hatching that runs right up to a speech
// bubble, a face-like white shape with features, and lettering in the bubble.
const PAGE = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="100%" height="100%" fill="#fff"/>
${Array.from({ length: 60 }, (_, i) => `<line x1="${20 + i * 14}" y1="20" x2="${i * 14 - 200}" y2="600" stroke="#222" stroke-width="2"/>`).join('')}
<ellipse cx="320" cy="260" rx="170" ry="210" fill="#fff" stroke="#000" stroke-width="4"/>
<text x="320" y="200" font-size="34" font-family="Hiragino Sans, Arial" text-anchor="middle" fill="#111">そんなのは</text>
<text x="320" y="250" font-size="34" font-family="Hiragino Sans, Arial" text-anchor="middle" fill="#111">おれが決める</text>
<text x="320" y="300" font-size="34" font-family="Hiragino Sans, Arial" text-anchor="middle" fill="#111">事だ!!</text>
<circle cx="680" cy="300" r="150" fill="#fff" stroke="#000" stroke-width="5"/>
<circle cx="630" cy="270" r="22" fill="#000"/><circle cx="730" cy="270" r="22" fill="#000"/>
<path d="M600 360 Q680 420 760 360" stroke="#000" stroke-width="16" fill="none"/>
<rect x="60" y="700" width="780" height="420" fill="#fff" stroke="#000" stroke-width="5"/>
</svg>`;

async function page() {
  const { data, info } = await sharp(Buffer.from(PAGE)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data), width: info.width, height: info.height };
}
function crop(img, box) {
  const m = bubbleMargin(box.width, box.height);
  const x = Math.max(0, box.x - m), y = Math.max(0, box.y - m);
  const w = Math.min(img.width, box.x + box.width + m) - x, h = Math.min(img.height, box.y + box.height + m) - y;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let r = 0; r < h; r++) out.set(img.data.subarray(((y + r) * img.width + x) * 4, ((y + r) * img.width + x + w) * 4), r * w * 4);
  return { data: out, width: w, height: h, region: { x: box.x - x, y: box.y - y, width: box.width, height: box.height } };
}
const lumAt = (d, i) => (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000;

test('connected staggered captions retain independent lettering and cleanup masks', async () => {
  const width = 400, height = 600;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
    <rect width="400" height="600" fill="#285478"/>
    <path d="M180 30 H350 V350 H190 V550 H50 V260 H180 Z" fill="white" stroke="black" stroke-width="3"/>
    <text x="215" y="100" font-size="24">Hunters</text><text x="215" y="145" font-size="24">fight</text>
    <text x="215" y="190" font-size="24">monsters.</text>
    <text x="75" y="390" font-size="24">Their</text><text x="75" y="435" font-size="24">profession.</text>
  </svg>`;
  const data = new Uint8ClampedArray(await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer());
  const merged = analyzeBubble(data, width, height, {x:50,y:30,width:300,height:520});
  assert.equal(merged.captionBoxes.length, 2);
  assert.equal(merged.safeBox, null, 'a compound region must not erase both captions while lettering only one');
  const analyses = merged.captionBoxes.map(box => analyzeBubble(data, width, height, box));
  for (const a of analyses) {
    assert.ok(a.safeBox && a.glyphCount >= 5);
    const cleaned = fillBubbleText(data.slice(), width, height, a);
    let changed = 0;
    for (let i=0;i<width*height;i++) {
      if ([0,1,2,3].some(c => cleaned[i*4+c] !== data[i*4+c])) {
        changed++;
        assert.ok(a.mask[i] && a.filled[i], 'cleanup stays in this caption');
      }
    }
    assert.ok(changed > 100);
  }
  for (let i=0;i<width*height;i++) assert.ok(!(analyses[0].mask[i] && analyses[1].mask[i]), 'caption cleanup masks are disjoint');
  const [a,b] = analyses.map(a=>a.safeBox);
  const overlap = Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  assert.equal(overlap, 0, 'translated lettering areas cannot overlap');
});

test('ordinary rectangular and oval bubbles are not split into captions', () => {
  const width=240,height=360;
  for (const oval of [false,true]) {
    const filled=new Uint8Array(width*height);
    for(let y=20;y<340;y++) for(let x=20;x<220;x++) {
      if(!oval || ((x-120)/100)**2+((y-180)/160)**2<=1) filled[y*width+x]=1;
    }
    assert.deepEqual(connectedCaptionBoxes(filled,width,height),[]);
  }
});

test('only the lettering inside the bubble changes; outline and artwork are untouched', async () => {
  const img = await page();
  const c = crop(img, { x: 170, y: 70, width: 300, height: 380 });
  const a = analyzeBubble(c.data, c.width, c.height, c.region);
  assert.ok(a.glyphCount >= 8, `found ${a.glyphCount} glyphs`);
  assert.ok(a.safeBox && a.safeBox.width > 150 && a.safeBox.height > 150);
  const out = fillBubbleText(c.data.slice(), c.width, c.height, a);
  let changedOutsideBubble = 0, inkLeft = 0;
  for (let i = 0; i < c.width * c.height; i++) {
    const changed = [0, 1, 2, 3].some((k) => out[i * 4 + k] !== c.data[i * 4 + k]);
    if (changed && !a.mask[i]) assert.fail('an unmasked pixel changed');
    if (changed && !a.filled[i]) changedOutsideBubble++;
    if (a.filled[i] && lumAt(out, i) < 200) {
      // Allow the outline's own inner antialiasing ring.
      const x = i % c.width, y = Math.floor(i / c.width);
      const nearEdge = [[-4, 0], [4, 0], [0, -4], [0, 4]].some(([dx, dy]) => !a.filled[(y + dy) * c.width + x + dx]);
      if (!nearEdge) inkLeft++;
    }
  }
  assert.equal(changedOutsideBubble, 0, 'nothing outside the bubble interior is repainted');
  assert.equal(inkLeft, 0, 'no source lettering remains');
});

test('a box that misses the bubble does not erase a face', async () => {
  const img = await page();
  const c = crop(img, { x: 540, y: 160, width: 280, height: 280 });
  const a = analyzeBubble(c.data, c.width, c.height, c.region);
  assert.equal(a.mask.reduce((s, v) => s + v, 0), 0);
  assert.equal(a.safeBox, null);
});

test('an open area that is not enclosed is refused instead of guessed', async () => {
  const img = await page();
  // Inside the big panel: light, but the box is far smaller than the panel so
  // the light area runs off the searched crop.
  const c = crop(img, { x: 300, y: 850, width: 120, height: 80 });
  const a = analyzeBubble(c.data, c.width, c.height, c.region);
  assert.equal(a.safeBox, null);
  assert.equal(a.mask.reduce((s, v) => s + v, 0), 0);
});

test('blurred and tiny pages are refused before processing', async () => {
  const lum = async (img) => { const { data, info } = await img.greyscale().raw().toBuffer({ resolveWithObject: true }); return [new Uint8Array(data), info.width, info.height]; };
  const base = await sharp(Buffer.from(PAGE)).png().toBuffer();
  const [l1, w1, h1] = await lum(sharp(base));
  assert.equal(assessPageQuality(l1, w1, h1).ok, true, `sharp page scored ${measureSharpness(l1, w1, h1)}`);
  const [l2, w2, h2] = await lum(sharp(base).blur(1.6));
  const blurred = assessPageQuality(l2, w2, h2);
  assert.equal(blurred.ok, false);
  assert.match(blurred.reason, /blurry/);
  const [l3, w3, h3] = await lum(sharp(await sharp(base).resize(290).toBuffer()));
  const tiny = assessPageQuality(l3, w3, h3);
  assert.equal(tiny.ok, false);
  assert.match(tiny.reason, /290×/);
});
