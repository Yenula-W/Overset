import { canCleanLocally, canvasToBlob, ensureFonts, measureFit, renderPage, sourceLayout, type RenderMode } from './render';
import type { DialogueRegion } from '@/lib/types/domain';
import type { ChapterRecord, PageRecord, ProjectRecord } from '@/lib/store/schema';
import { REGION_TYPE_LABELS } from '@/lib/types/domain';

/**
 * Chapter export. Pages are rendered at their original pixel dimensions —
 * never resized — and bundled with the translation data.
 */

export type ImageFormat = 'png' | 'jpg' | 'webp';
export type DataFormat = 'csv' | 'json' | 'txt';

export interface ExportOptions {
  imageFormat: ImageFormat;
  dataFormats: DataFormat[];
  includeImages: boolean;
  includeTranslatedSfx: boolean;
  includeMetadata: boolean;
  mode: RenderMode;
}

const MIME: Record<ImageFormat, 'image/png' | 'image/jpeg' | 'image/webp'> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

const pad = (n: number) => String(n).padStart(3, '0');

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function ordered(regions: DialogueRegion[]) {
  return [...regions].sort((a, b) => a.readingOrder - b.readingOrder);
}

export function buildCsv(pages: PageRecord[], speakerName: (id?: string) => string) {
  const rows = [['page', 'region', 'type', 'speaker', 'source', 'translation', 'status']];
  for (const p of pages)
    ordered(p.regions).forEach((r, i) =>
      rows.push([String(p.order), String(i + 1), REGION_TYPE_LABELS[r.type], speakerName(r.speakerId), r.sourceText, r.finalTranslation, r.status]),
    );
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

export function buildScript(chapter: ChapterRecord, pages: PageRecord[], speakerName: (id?: string) => string) {
  const out = [`${chapter.name}`, ''];
  for (const p of pages) {
    out.push(`Page ${String(p.order).padStart(2, '0')}`);
    ordered(p.regions).forEach((r, i) => {
      const who = speakerName(r.speakerId);
      out.push(`  [${String(i + 1).padStart(2, '0')}] ${who ? `${who}: ` : r.type === 'dialogue' ? '' : `(${REGION_TYPE_LABELS[r.type]}) `}${r.finalTranslation || '—'}`);
    });
    out.push('');
  }
  return out.join('\n');
}

export function buildJson(project: ProjectRecord, chapter: ChapterRecord, pages: PageRecord[], speakerName: (id?: string) => string, includeMetadata: boolean) {
  return JSON.stringify(
    {
      project: project.name,
      chapter: chapter.name,
      sourceLanguage: chapter.sourceLanguage,
      targetLanguage: chapter.targetLanguage,
      exportedAt: new Date().toISOString(),
      pages: pages.map((p) => ({
        order: p.order,
        fileName: p.fileName,
        width: p.width,
        height: p.height,
        regions: ordered(p.regions).map((r) => ({
          readingOrder: r.readingOrder,
          type: r.type,
          speaker: speakerName(r.speakerId) || null,
          source: r.sourceText,
          translation: r.finalTranslation,
          status: r.status,
          ...(includeMetadata
            ? {
                boundsPercent: r.bounds,
                boundsPx: {
                  x: Math.round((r.bounds.x / 100) * p.width),
                  y: Math.round((r.bounds.y / 100) * p.height),
                  width: Math.round((r.bounds.width / 100) * p.width),
                  height: Math.round((r.bounds.height / 100) * p.height),
                },
                typesetting: r.typesetting,
              }
            : {}),
        })),
      })),
    },
    null,
    2,
  );
}

export async function exportChapter(input: {
  project: ProjectRecord;
  chapter: ChapterRecord;
  pages: PageRecord[];
  loadOriginal: (page: PageRecord) => Promise<Blob | undefined>;
  speakerName: (id?: string) => string;
  options: ExportOptions;
  onProgress?: (done: number, total: number, label: string) => void;
}): Promise<{ blob: Blob; fileName: string; imageCount: number }> {
  const { project, chapter, pages, options } = input;
  const slug = `${project.name}-${chapter.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chapter';
  const files: Record<string, Uint8Array> = {};
  const enc = new TextEncoder();
  let imageCount = 0;

  if (options.includeImages) {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      input.onProgress?.(i, pages.length, `Rendering page ${i + 1} of ${pages.length}`);
      const original = await input.loadOriginal(page);
      if (!original) throw new Error(`Page ${page.order} could not be loaded. No chapter was exported; retry after restoring the page.`);
      const bitmap = await createImageBitmap(original);
      try {
        const regions = options.includeTranslatedSfx ? page.regions : page.regions.filter((r) => r.type !== 'sfx');
        if(options.mode==='translated'){
          await ensureFonts(regions);
          for(const region of regions){
            if(!region.translate||!region.finalTranslation.trim())continue;
            const layout=canCleanLocally(region)&&!region.artworkCleanup?.strokes.length?sourceLayout(bitmap,region):null;
            if(canCleanLocally(region)&&!region.artworkCleanup?.strokes.length&&!layout?.analysis.safeBox)throw new Error(`Page ${page.order}, region ${region.readingOrder}: no safe bubble interior was found. Review its region or use the cleanup brush before exporting.`);
            if(!canCleanLocally(region)&&!region.artworkCleanup?.strokes.length)throw new Error(`Page ${page.order}, region ${region.readingOrder}: clean the artwork text with the brush, or turn off translation for this region.`);
            if(!measureFit(region,page.width,page.height,layout?.analysis.safeBox??undefined).fits)throw new Error(`Page ${page.order}, region ${region.readingOrder}: the translation does not fit. Edit the line or adjust its lettering in Style before exporting.`);
          }
        }
        const canvas = await renderPage(bitmap, regions, options.mode);
        const blob = await canvasToBlob(canvas, MIME[options.imageFormat], 0.95);
        files[`${slug}/pages/${pad(page.order)}.${options.imageFormat}`] = new Uint8Array(await blob.arrayBuffer());
        imageCount++;
      } finally {
        bitmap.close();
      }
    }
  }

  if (options.dataFormats.includes('csv')) files[`${slug}/translation.csv`] = enc.encode(buildCsv(pages, input.speakerName));
  if (options.dataFormats.includes('json'))
    files[`${slug}/translation.json`] = enc.encode(buildJson(project, chapter, pages, input.speakerName, options.includeMetadata));
  if (options.dataFormats.includes('txt')) files[`${slug}/script.txt`] = enc.encode(buildScript(chapter, pages, input.speakerName));

  input.onProgress?.(pages.length, pages.length, 'Packaging');
  const { zip } = await import('fflate');
  const archive = await new Promise<Uint8Array>((resolve, reject) =>
    // Images are already compressed; storing them avoids wasted work.
    zip(files, { level: 0 }, (err, data) => (err ? reject(err) : resolve(data))),
  );
  return { blob: new Blob([archive as BlobPart], { type: 'application/zip' }), fileName: `${slug}.zip`, imageCount };
}
