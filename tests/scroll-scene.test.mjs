import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BEATS, damp, phase, staggered, timeline } from '../src/lib/marketing/scroll-scene.ts';

test('wheel smoothing is refresh-rate independent and never overshoots', () => {
  const settle = (hz) => {
    let p = 0;
    for (let frame = 0; frame < hz; frame++) p = damp(p, 1, 1000 / hz);
    return p;
  };
  assert.ok(Math.abs(settle(60) - settle(120)) < 1e-10);
  assert.ok(settle(60) > 0.999);
  assert.ok(damp(0.8, 0.2, 16) < 0.8);
  assert.ok(damp(0.8, 0.2, 16) > 0.2);
});

test('every animated value is bounded and continuous through all stage changes', () => {
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000;
    const current = timeline(p);
    const next = timeline(p + 0.00001);
    for (const key of Object.keys(current).filter(key => key !== 'step')) {
      assert.ok(current[key] >= 0 && current[key] <= 1, `${key} at ${p}`);
      assert.ok(Math.abs(current[key] - next[key]) < 0.001, `${key} jumps at ${p}`);
    }
    assert.ok(!(current.source > 0 && current.target > 0), 'source and target must not ghost over each other');
    if (current.controls > 0) assert.equal(current.desk, 0, 'inspector arrives after desk has cleared');
  }
});

test('initial and final frames are complete, and scrolling backwards returns the source page', () => {
  assert.deepEqual(timeline(-1), timeline(0));
  assert.deepEqual(timeline(2), timeline(1));
  assert.equal(timeline(0).intro, 1);
  assert.equal(timeline(0).desk, 1);
  assert.equal(timeline(0).source, 1);
  assert.equal(timeline(1).target, 1);
  assert.equal(timeline(1).finished, 1);
  assert.equal(timeline(1).detection, 0);
  assert.equal(timeline(0.685).source + timeline(0.685).target, 0, 'clean stage is visibly blank');
  assert.equal(phase(0, 0, 1), 0);
  assert.equal(phase(1, 0, 1), 1);
});

test('each region wipes inside its beat, in reading order', () => {
  for (const beat of Object.values(BEATS)) {
    for (let i = 0; i < 4; i++) {
      assert.equal(staggered(beat[0], beat, i, 4), 0);
      assert.equal(staggered(beat[1], beat, i, 4), 1);
    }
    const mid = (beat[0] + beat[1]) / 2;
    assert.ok(staggered(mid, beat, 0, 4) > staggered(mid, beat, 3, 4), 'earlier regions lead');
  }
});
