import type { DialogueRegion, TypesettingProperties } from '../types/domain';

/** Automatic Latin lettering should match the region's purpose, not the height
 * of a Japanese/Korean glyph. Explicit human formatting always takes priority. */
export function effectiveTypesetting(region: Pick<DialogueRegion, 'type' | 'typesetting'> & Partial<Pick<DialogueRegion, 'sourceLanguage'>>): TypesettingProperties {
  const t = region.typesetting;
  if (t.fontSource === 'manual' || !t.autoFit) return t;
  const source = t.sourceFont;
  const families = { serif: 'Noto Serif', sans: 'Archivo', handwritten: 'Comic Neue', display: 'Bangers' };
  // Older Japanese narration did not store source traits. Mincho-style serif
  // lettering is the closest available Latin counterpart for those boxes.
  const family = source ? families[source.category] : region.type === 'narration' && region.sourceLanguage === 'ja' ? 'Noto Serif' : t.fontFamily;
  const weight = source?.weight ?? t.fontWeight;
  if (region.type === 'narration' || region.type === 'dialogue' || region.type === 'thought') return {
    ...t, fontFamily: family, fontWeight: weight,
    fontSize: Math.min(source?.size ?? t.fontSize, 28), lineHeight: 1.2,
    letterSpacing: 0, align: region.type === 'narration' ? 'left' : t.align,
  };
  return t;
}

/** Display inline emphasis without changing the saved translation. Paired
 * markers become bold lettering; unmatched asterisks remain literal. */
export function letteringText(source: string) {
  source = source.replace(/[^\S\n]+/g, ' ');
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
