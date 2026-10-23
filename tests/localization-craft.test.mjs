import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCALIZATION_CRAFT } from '../src/lib/providers/localization-craft.ts';
import { readFileSync } from 'node:fs';

test('craft guide covers word choice, text kinds, placement and a self-check', () => {
  for (const heading of ['WORD CHOICE', 'BY TEXT KIND', 'PLACEMENT AND FIT', 'SELF-CHECK BEFORE SAVING']) assert.ok(LOCALIZATION_CRAFT.includes(heading), heading);
  for (const kind of ['dialogue:', 'thought:', 'narration:', 'sfx:', 'sign, label, title:']) assert.ok(LOCALIZATION_CRAFT.includes(kind), kind);
});
test('craft guide never tells the model to write in all caps (the typesetter applies case)', () => {
  assert.match(LOCALIZATION_CRAFT, /Do not write all-caps yourself/);
});
test('every provider call carries the craft guide', () => {
  assert.match(readFileSync(new URL('../src/lib/providers/comic.ts', import.meta.url), 'utf8'), /\$\{INSTRUCTIONS\}\\n\\n\$\{LOCALIZATION_CRAFT\}/);
});
