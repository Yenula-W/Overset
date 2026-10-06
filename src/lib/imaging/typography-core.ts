import type { DialogueRegion, TypesettingProperties } from '../types/domain';

/** Automatic Latin lettering should match the region's purpose, not the height
 * of a Japanese/Korean glyph. Explicit human formatting always takes priority. */
export function effectiveTypesetting(region: Pick<DialogueRegion, 'type' | 'typesetting'>): TypesettingProperties {
  const t = region.typesetting;
  if (t.fontSource === 'manual' || !t.autoFit) return t;
  if (region.type === 'narration') return {
    ...t, fontFamily: 'Noto Serif', fontWeight: 400,
    fontSize: Math.min(t.fontSize, 16), lineHeight: 1.3,
    letterSpacing: 0, align: 'left',
  };
  if (region.type === 'dialogue' || region.type === 'thought') return {
    ...t, fontSize: Math.min(t.fontSize, 22), lineHeight: 1.2,
  };
  return t;
}

/** Display inline emphasis without changing the saved translation. Paired
 * markers become bold lettering; unmatched asterisks remain literal. */
export function letteringText(source: string) {
  let text = '', cursor = 0;
  const emphasis: { start: number; end: number }[] = [];
  const pattern = /(?<!\w)(\*\*|__|\*|_)(?=\S)(.+?)\1(?!\w)/g;
  for (const match of source.matchAll(pattern)) {
    text += source.slice(cursor, match.index);
    const start = text.length;
    text += match[2];
    emphasis.push({ start, end: text.length });
    cursor = match.index! + match[0].length;
  }
  text += source.slice(cursor);
  return { text, emphasis };
}
