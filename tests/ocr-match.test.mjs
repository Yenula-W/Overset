import test from 'node:test';
import assert from 'node:assert/strict';
import { matchCandidate, overlapRatio } from '../src/lib/imaging/ocr-match.ts';

const page = { width: 1000, height: 1450 };
// The page from the bug report: an empty detected bubble at the top right,
// and the AI's box for its text drawn over the neighbouring face.
const bubble = { id: 'rgn_bubble', bounds: { x: 71.8, y: 10.9, width: 17.9, height: 16.6 } };

test('text the AI placed on a face goes to the empty bubble beside it', () => {
  assert.equal(matchCandidate({ bounds: { x: 44, y: 4, width: 26, height: 19 }, type: 'dialogue', snapped: false }, [bubble], page), 'rgn_bubble');
});

test('a detection confirmed on the page only joins a bubble it overlaps', () => {
  assert.equal(matchCandidate({ bounds: { x: 11.7, y: 4.8, width: 21.8, height: 22.6 }, type: 'dialogue', snapped: true }, [bubble], page), undefined);
  assert.equal(matchCandidate({ bounds: { x: 72, y: 11, width: 17, height: 16 }, type: 'dialogue', snapped: true }, [bubble], page), 'rgn_bubble');
});

test('sound effects and far-away text are never pulled into a bubble', () => {
  assert.equal(matchCandidate({ bounds: { x: 44, y: 4, width: 26, height: 19 }, type: 'sfx', snapped: false }, [bubble], page), undefined);
  assert.equal(matchCandidate({ bounds: { x: 5, y: 80, width: 10, height: 8 }, type: 'dialogue', snapped: false }, [bubble], page), undefined);
});

test('overlap is measured against the smaller box', () => {
  assert.equal(overlapRatio({ x: 0, y: 0, width: 10, height: 10 }, { x: 2, y: 2, width: 4, height: 4 }), 1);
  assert.equal(overlapRatio({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 4, height: 4 }), 0);
});
