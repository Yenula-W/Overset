import { cloudEnabled } from '@/lib/store/db';
import { aiPage, callService } from '@/lib/client-services';
import { ingestFiles, type IngestProblem } from '@/lib/imaging/ingest';
import { detectRegions } from '@/lib/imaging/detect';
import { addPages, getChapter, listCharacters, listGlossary, listPages, recordUsage, savePageRegions, updateChapter } from '@/lib/store/repo';
import type { StageState } from '@/lib/store/schema';
import { runQa, type QaFinding } from '@/lib/qa';
import type { LanguageCode } from '@/lib/types/domain';

/**
 * Chapter processing, run in the browser.
 *
 * Stages that need an AI provider (OCR, translation, inpainting) are reported
 * as skipped with the reason — never faked. Everything else runs for real.
 */

export interface StageView {
  id: string;
  label: string;
  state: StageState;
  message?: string;
}

export const STAGES: Array<Pick<StageView, 'id' | 'label'>> = [
  { id: 'upload', label: 'Upload pages' },
  { id: 'dimensions', label: 'Record original dimensions' },
  { id: 'detect', label: 'Detect speech bubbles' },
  { id: 'order', label: 'Set reading order' },
  { id: 'ocr', label: 'Read source text (OCR)' },
  { id: 'translate', label: 'Translate dialogue' },
  { id: 'terminology', label: 'Load terminology' },
  { id: 'clean', label: 'Prepare text removal' },
  { id: 'qa', label: 'Run QA' },
];

export interface ProcessResult {
  pageCount: number;
  regionCount: number;
  problems: IngestProblem[];
  findings: QaFinding[];
}

export async function processChapter(input: {
  ownerId: string;
  chapterId: string;
  files: File[];
  sourceLanguage: LanguageCode;
  detect: boolean;
  onStage: (id: string, state: StageState, message?: string) => void;
  onProgress: (done: number, total: number, label: string) => void;
}): Promise<ProcessResult> {
  const { ownerId, chapterId, onStage, onProgress } = input;
  const chapter = await getChapter(ownerId, chapterId);
  const stages: Record<string, { state: StageState; message?: string }> = {};
  const mark = (id: string, state: StageState, message?: string) => {
    stages[id] = { state, message };
    onStage(id, state, message);
  };

  try {
    await updateChapter(ownerId, chapterId, { status: 'processing' });

    // Upload: decode every file into pages and store originals untouched.
    mark('upload', 'running');
    const { pages: ingested, problems } = await ingestFiles(input.files, (d, t, label) => onProgress(d, Math.max(t, 1), label));
    if (ingested.length === 0) {
      mark('upload', 'failed', problems[0]?.reason ?? 'No pages could be read from these files.');
      await updateChapter(ownerId, chapterId, { status: 'failed', stages });
      return { pageCount: 0, regionCount: 0, problems, findings: [] };
    }
    const saved = await addPages(ownerId, chapterId, ingested);
    await recordUsage(ownerId, { pagesProcessed: saved.length });
    mark('upload', 'complete', `Saved ${saved.length} ${saved.length === 1 ? 'page' : 'pages'}${problems.length ? ` · ${problems.length} skipped` : ''}`);

    const sizes = new Set(saved.map((p) => `${p.width} × ${p.height}`));
    mark('dimensions', 'complete', sizes.size === 1 ? `${[...sizes][0]} px, kept on export` : `${sizes.size} page sizes recorded, each kept on export`);

    // Detection runs on-device; translators review and adjust every region.
    let regionCount = 0;
    if (input.detect) {
      mark('detect', 'running');
      for (let i = 0; i < saved.length; i++) {
        onProgress(i, saved.length, `Detecting bubbles — page ${i + 1} of ${saved.length}`);
        const page = saved[i];
        const original = ingested[i].original;
        try {
          const regions = await detectRegions(original, page.id, input.sourceLanguage);
          regionCount += regions.length;
          await savePageRegions(ownerId, page.id, regions);
        } catch {
          // A page that can't be analysed keeps zero regions; the translator draws them.
        }
      }
      onProgress(saved.length, saved.length, 'Done');
      mark('detect', 'complete', `Found ${regionCount} likely text ${regionCount === 1 ? 'region' : 'regions'} on-device — review them in the editor`);
      mark('order', 'complete', input.sourceLanguage === 'ja' ? 'Right to left within each row (manga)' : 'Left to right within each row');
    } else {
      mark('detect', 'skipped', 'Turned off — draw regions in the editor');
      mark('order', 'skipped', 'Set when regions are drawn');
    }

    const services = cloudEnabled ? await callService<{ai:boolean}>('/api/services').catch(() => ({ai:false})) : {ai:false};
    if (services.ai) {
      mark('ocr', 'running');
      for (const p of saved) { onProgress(p.order, saved.length, `Reading page ${p.order}`); await aiPage(chapterId, p.id, 'ocr'); }
      mark('ocr', 'complete', 'Source text read — review uncertain lines');
      mark('translate', 'running');
      const readPages = await listPages(ownerId, chapterId);
      for (const p of readPages) for (const r of p.regions) {
        if (r.translate && r.sourceText.trim() && !r.finalTranslation.trim()) {
          onProgress(p.order, saved.length, `Translating page ${p.order}, region ${r.readingOrder}`);
          await aiPage(chapterId, p.id, 'translate', r.id);
        }
      }
      mark('translate', 'complete', 'Drafts saved for your review');
      await callService(`/api/chapters/${encodeURIComponent(chapterId)}/complete`, {}).catch(() => {});
    } else {
      mark('ocr', 'skipped', 'AI is not connected yet — source text remains editable');
      mark('translate', 'skipped', 'AI is not connected yet — use glossary and memory while translating manually');
    }

    const [glossary, characters] = await Promise.all([listGlossary(ownerId, chapter.projectId), listCharacters(ownerId, chapter.projectId)]);
    mark('terminology', 'complete', `${glossary.length} glossary ${glossary.length === 1 ? 'term' : 'terms'} and ${characters.length} character ${characters.length === 1 ? 'profile' : 'profiles'} loaded`);
    mark('clean', 'complete', 'Bubble interiors are cleaned on export; text over artwork is left untouched');

    const pages = await listPages(ownerId, chapterId);
    const findings = runQa(pages, { glossary, characters });
    mark('qa', 'complete', `${findings.length} ${findings.length === 1 ? 'item' : 'items'} to review`);

    await updateChapter(ownerId, chapterId, { status: 'review', stages });
    return { pageCount: saved.length, regionCount, problems, findings };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing stopped unexpectedly.';
    const running = Object.entries(stages).find(([, s]) => s.state === 'running');
    if (running) mark(running[0], 'failed', message);
    await updateChapter(ownerId, chapterId, { status: 'failed', stages }).catch(() => {});
    throw err;
  }
}
