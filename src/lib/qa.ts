import type { Character, DialogueRegion, GlossaryEntry, QaCategory, QaSeverity } from '@/lib/types/domain';

/**
 * Local QA pass. Every check here runs on the translator's own data — no AI
 * service — and only flags. Nothing is rewritten automatically: literary
 * calls stay with the translator.
 */

export interface QaPage {
  id: string;
  order: number;
  regions: DialogueRegion[];
}

export interface QaFinding {
  id: string;
  pageId: string;
  pageOrder: number;
  regionId?: string;
  category: QaCategory | 'missing_source' | 'missing_speaker' | 'needs_inpainting';
  severity: QaSeverity;
  title: string;
  detail: string;
}

export interface QaContext {
  glossary: Pick<GlossaryEntry, 'original' | 'translation' | 'alternatives' | 'status'>[];
  characters: Pick<Character, 'id' | 'name' | 'formality'>[];
  /** Returns false when the translation can't fit its region at a readable size. */
  fits?: (region: DialogueRegion, pageId: string) => boolean;
}

const CONTRACTION = /\b\w+'(?:t|re|ll|ve|d|m)\b|\b(?:gonna|wanna|gotta)\b/i;

function contains(haystack: string, needle: string) {
  return needle.trim().length > 0 && haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

export function runQa(pages: QaPage[], ctx: QaContext): QaFinding[] {
  const out: QaFinding[] = [];
  const chars = new Map(ctx.characters.map((c) => [c.id, c]));
  const terms = ctx.glossary.filter((g) => g.status !== 'suggested' && g.original.trim() && g.translation.trim());
  const push = (f: Omit<QaFinding, 'id'>) => out.push({ ...f, id: `${f.category}:${f.regionId ?? f.pageId}:${out.length}` });

  for (const page of [...pages].sort((a, b) => a.order - b.order)) {
    const where = `page ${String(page.order).padStart(2, '0')}`;
    const ordered = [...page.regions].sort((a, b) => a.readingOrder - b.readingOrder);

    if (ordered.length === 0) {
      push({ pageId: page.id, pageOrder: page.order, category: 'missing_dialogue', severity: 'info', title: 'No text regions', detail: `Nothing has been marked on ${where}. If it has dialogue, draw its regions in the editor.` });
    }

    ordered.forEach((r, i) => {
      if (!r.translate) return;
      const label = `${where}, region ${String(i + 1).padStart(2, '0')}`;
      const base = { pageId: page.id, pageOrder: page.order, regionId: r.id };

      if (!r.sourceText.trim()) {
        push({ ...base, category: 'missing_source', severity: 'info', title: 'No source text', detail: `${label} has no source text recorded, so memory and terminology checks can’t run on it.` });
      }
      if (!r.finalTranslation.trim()) {
        push({ ...base, category: 'untranslated', severity: 'critical', title: 'Untranslated', detail: `${label} has no translation yet.` });
        return;
      }
      if ((r.type === 'dialogue' || r.type === 'thought') && !r.speakerId) {
        push({ ...base, category: 'missing_speaker', severity: 'info', title: 'Speaker not set', detail: `${label} has no speaker, so character voice can’t be checked.` });
      }
      if ((r.embeddedInArtwork || r.type === 'sfx') && !r.artworkCleanup?.strokes.length) {
        push({ ...base, category: 'needs_inpainting', severity: 'warning', title: 'Text over artwork', detail: `${label} sits on artwork. Use the cleanup brush to remove the source text before export. It is otherwise left untouched.` });
      }

      for (const term of terms) {
        if (!contains(r.sourceText, term.original)) continue;
        if (!contains(r.finalTranslation, term.translation)) {
          const usedAlt = term.alternatives.find((a) => contains(r.finalTranslation, a));
          push({
            ...base,
            category: 'terminology',
            severity: term.status === 'locked' ? 'critical' : 'warning',
            title: 'Terminology',
            detail: usedAlt
              ? `“${usedAlt}” differs from the approved “${term.translation}” for ${term.original} (${label}).`
              : `${label} contains ${term.original} but not its approved translation “${term.translation}”.`,
          });
        }
      }

      const speaker = r.speakerId ? chars.get(r.speakerId) : undefined;
      if (speaker?.formality === 'high' && CONTRACTION.test(r.finalTranslation)) {
        push({ ...base, category: 'character_voice', severity: 'warning', title: 'Character voice', detail: `${speaker.name} speaks formally, but ${label} uses contractions.` });
      }

      if (ctx.fits && !ctx.fits(r, page.id)) {
        push({ ...base, category: 'typesetting_overflow', severity: 'warning', title: 'Fit warning', detail: `The translation in ${label} doesn’t fit its bubble at a readable size. Shorten it, or adjust the typesetting by hand.` });
      }

      const prev = ordered[i - 1];
      if (prev && prev.finalTranslation.trim() && prev.finalTranslation.trim() === r.finalTranslation.trim() && prev.sourceText.trim() !== r.sourceText.trim()) {
        push({ ...base, category: 'duplicate_text', severity: 'warning', title: 'Duplicate text', detail: `${label} repeats the previous region’s translation word for word.` });
      }
    });
  }
  return out;
}

export function qaSummary(findings: QaFinding[]) {
  return {
    critical: findings.filter((f) => f.severity === 'critical').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    info: findings.filter((f) => f.severity === 'info').length,
  };
}
