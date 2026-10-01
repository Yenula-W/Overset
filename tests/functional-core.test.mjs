import { test } from 'node:test';
import assert from 'node:assert/strict';
import { naturalCompare, isImportableEntry, extensionOf } from '../src/lib/imaging/sort.ts';
import { detectBubbles, readingOrder } from '../src/lib/imaging/detect-core.ts';
import { fitText, wrapLines } from '../src/lib/imaging/typeset-core.ts';

test('pages sort the way a person numbers them', () => {
  const names = ['page10.png', 'page2.png', 'Page1.png', 'page11.png'];
  assert.deepEqual([...names].sort(naturalCompare), ['Page1.png', 'page2.png', 'page10.png', 'page11.png']);
});

test('archives import images and skip OS metadata', () => {
  assert.equal(isImportableEntry('ch28/001.jpg'), true);
  assert.equal(isImportableEntry('__MACOSX/ch28/._001.jpg'), false);
  assert.equal(isImportableEntry('ch28/.DS_Store'), false);
  assert.equal(isImportableEntry('ch28/notes.txt'), false);
  assert.equal(extensionOf('A.JPEG'), 'jpeg');
});

/** Paints a light page with dark panel borders, two text bubbles, and a blank light panel. */
function syntheticPage() {
  const w = 400, h = 600;
  const lum = new Uint8Array(w * h).fill(150); // mid-grey artwork
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < w && y < h) lum[y * w + x] = v; };
  const ellipse = (cx, cy, rx, ry, text) => {
    for (let y = cy - ry - 3; y <= cy + ry + 3; y++)
      for (let x = cx - rx - 3; x <= cx + rx + 3; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 1) set(x, y, 250);
        else if (d <= 1.12) set(x, y, 20); // outline
      }
    if (text) for (let y = cy - 6; y <= cy + 6; y += 3) for (let x = cx - rx / 2; x <= cx + rx / 2; x++) if (x % 5 < 3) set(x, y, 15);
  };
  ellipse(300, 80, 70, 35, true); // bubble A (top right)
  ellipse(90, 90, 60, 30, true); // bubble B (top left, same row)
  ellipse(200, 400, 80, 40, false); // empty light shape — no text, not a bubble
  return { lum, w, h };
}

test('detects text bubbles and ignores empty light shapes', () => {
  const { lum, w, h } = syntheticPage();
  const found = detectBubbles(lum, w, h);
  assert.equal(found.length, 2);
  for (const b of found) assert.equal(b.shape, 'ellipse');
});

test('reading order runs across rows, mirrored for manga', () => {
  const { lum, w, h } = syntheticPage();
  const found = detectBubbles(lum, w, h);
  const ltr = readingOrder(found, 'ltr').map((b) => Math.round(b.x + b.width / 2));
  const rtl = readingOrder(found, 'rtl').map((b) => Math.round(b.x + b.width / 2));
  assert.ok(ltr[0] < ltr[1], 'Korean/Chinese read left to right within a row');
  assert.ok(rtl[0] > rtl[1], 'Japanese reads right to left within a row');
});

const mono = (text, size) => text.length * size * 0.5;

test('wrapping breaks on words and keeps every word', () => {
  const lines = wrapLines('You seriously thought that would work?', 100, 10, mono);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(' '), 'You seriously thought that would work?');
});

test('auto-fit shrinks to fit but never below the readable floor', () => {
  const base = { boxWidth: 120, boxHeight: 60, minFontSizePx: 9, lineHeight: 1.15, autoFit: true };
  const short = fitText({ ...base, text: 'Hey.', fontSizePx: 18 }, mono);
  assert.equal(short.fits, true);
  assert.equal(short.fontSizePx, 18, 'short text keeps the chosen size — auto-fit never inflates');

  const long = fitText({ ...base, text: 'You promised we would see this through together no matter what happened to us', fontSizePx: 18 }, mono);
  assert.ok(long.fontSizePx < 18 && long.fontSizePx >= 9);

  const impossible = fitText({ ...base, text: 'word '.repeat(200), fontSizePx: 18 }, mono);
  assert.equal(impossible.fits, false, 'reports overflow instead of shrinking past readable');
  assert.equal(impossible.fontSizePx, 9);
});
