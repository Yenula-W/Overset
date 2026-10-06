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
    letterSpacing: 0, align: 'center',
  };
  return t;
}

/** Display inline emphasis without changing the saved translation. Paired
 * markers become bold lettering; unmatched asterisks remain literal. */
export function letteringText(source: string, textCase: 'original' | 'uppercase' = 'original') {
  source = source.replace(/[^\S\n]+/g, ' ');
  if (textCase === 'uppercase') source = source.toUpperCase();
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

/** Preserve old manually fitted boxes unless the translator chooses coverage. */
export function letteringCoverage(t: TypesettingProperties): number {
  if (!t.autoFit) return 1;
  if (t.coverage === 'roomy') return 0.66;
  if (t.coverage === 'balanced') return 0.8;
  if (t.coverage === 'fuller') return 0.92;
  return t.fontSource === 'manual' ? 1 : 0.8;
}

/** A page can contain dialogue, narration and SFX with deliberately different
 * styles. Apply only to this text kind, fitting each original box independently. */
export function applyLetteringStyle(regions: DialogueRegion[], selected: DialogueRegion): DialogueRegion[] {
  const style = effectiveTypesetting(selected);
  return regions.map(region => region.translate && region.type === selected.type ? {
    ...region,
    status: region.finalTranslation ? 'edited' : region.status,
    typesetting: {
      ...effectiveTypesetting(region),
      fontFamily: style.fontFamily, fontWeight: style.fontWeight,
      fontStyle: style.fontStyle ?? 'normal', textCase: style.textCase ?? 'original',
      fontSize: style.fontSize, lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing, outline: style.outline, align: style.align,
      coverage: style.coverage ?? 'balanced',
      fontSource: 'manual', autoFit: true,
    },
  } : region);
}

/** Presets change presentation only; source text, translations and boxes stay intact. */
export function comicLetteringStyle(t: TypesettingProperties): TypesettingProperties {
  return { ...t, fontSource: 'manual', fontFamily: 'Archivo Narrow', fontWeight: 600,
    fontStyle: 'italic', textCase: 'uppercase', align: 'center', lineHeight: 1.15,
    letterSpacing: 0, coverage: 'balanced', autoFit: true, fontSize: Math.max(t.fontSize, 28) };
}

export interface LineInk { left: number; right: number; ascent: number; descent: number }
/** Center visible ink, rather than font advance widths or the em square. */
export function letteringPlacement(lines: LineInk[], lineHeight: number, width: number, align: TypesettingProperties['align']) {
  if (!lines.length) return [];
  const top = Math.min(...lines.map((line,i) => i*lineHeight-line.ascent));
  const bottom = Math.max(...lines.map((line,i) => i*lineHeight+line.descent));
  return lines.map((line,i) => ({
    x: align === 'left' ? -width/2-line.left : align === 'right' ? width/2-line.right : -(line.left+line.right)/2,
    y: i*lineHeight-(top+bottom)/2,
  }));
}
