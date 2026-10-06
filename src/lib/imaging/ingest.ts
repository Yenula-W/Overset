import { extensionOf, IMAGE_EXTENSIONS, isImportableEntry, mimeForExtension, naturalCompare } from './sort';
import { rgbaToLuma } from './detect-core';
import { assessPageQuality } from './quality-core';

/**
 * Turns uploaded files into pages, entirely in the browser.
 *
 * Image files are kept byte-for-byte as uploaded — no re-encoding — so the
 * original artwork survives untouched. ZIP archives are unpacked and sorted by
 * filename; PDFs are rendered page by page.
 */

export const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_PAGES_PER_CHAPTER = 400;
const THUMB_WIDTH = 240;
/** PDFs have no pixel size; render wide enough to letter cleanly. */
const PDF_TARGET_WIDTH = 1600;

export interface IngestedPage {
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  original: Blob;
  thumbnail: Blob;
}

export interface IngestProblem {
  file: string;
  reason: string;
}

export interface IngestResult {
  pages: IngestedPage[];
  problems: IngestProblem[];
}

export type IngestProgress = (done: number, total: number, label: string) => void;

export function validateFiles(files: File[]): IngestProblem[] {
  const problems: IngestProblem[] = [];
  for (const f of files) {
    const ext = extensionOf(f.name);
    if (![...IMAGE_EXTENSIONS, 'pdf', 'zip'].includes(ext)) {
      problems.push({ file: f.name, reason: `“${f.name}” isn’t a supported file type. Overset accepts PNG, JPG, WEBP, PDF, and ZIP.` });
    } else if (f.size > MAX_FILE_BYTES) {
      problems.push({ file: f.name, reason: `“${f.name}” is over the 2 GB limit for a single upload.` });
    }
  }
  return problems;
}

async function measure(blob: Blob): Promise<{ width: number; height: number; bitmap: ImageBitmap }> {
  const bitmap = await createImageBitmap(blob);
  return { width: bitmap.width, height: bitmap.height, bitmap };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('This browser could not encode the image.'))), type, quality),
  );
}

async function thumbnailFrom(bitmap: ImageBitmap): Promise<Blob> {
  const scale = Math.min(1, THUMB_WIDTH / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not create a canvas.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, 'image/webp', 0.82);
}

/** A page that can't be cleaned well: too small or too blurry. */
class QualityError extends Error {}

/** Checks a band of the page at native resolution (tall strips are sampled). */
function checkQuality(name: string, bitmap: ImageBitmap) {
  const band = Math.min(bitmap.height, 3000);
  const top = Math.floor((bitmap.height - band) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = band;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser could not create a canvas.');
  ctx.drawImage(bitmap, 0, -top);
  const lum = rgbaToLuma(ctx.getImageData(0, 0, bitmap.width, band).data, bitmap.width * band);
  const quality = assessPageQuality(lum, bitmap.width, band);
  if (!quality.ok) throw new QualityError(`“${name}”: ${quality.reason?.replace(`${bitmap.width}×${band}`, `${bitmap.width}×${bitmap.height}`)}`);
}

async function pageFromImage(name: string, blob: Blob, mimeType: string): Promise<IngestedPage> {
  const { width, height, bitmap } = await measure(blob);
  try {
    checkQuality(name, bitmap);
    return { fileName: name, mimeType, width, height, original: blob, thumbnail: await thumbnailFrom(bitmap) };
  } finally {
    bitmap.close();
  }
}

async function unzipImages(file: File): Promise<Array<{ name: string; blob: Blob; mime: string }>> {
  const { unzip } = await import('fflate');
  const buf = new Uint8Array(await file.arrayBuffer());
  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
    unzip(buf, { filter: (f) => isImportableEntry(f.name) }, (err, data) => (err ? reject(err) : resolve(data))),
  );
  return Object.keys(entries)
    .sort(naturalCompare)
    .map((path) => {
      const mime = mimeForExtension(extensionOf(path));
      const bytes = entries[path];
      return { name: path.split('/').pop() ?? path, blob: new Blob([bytes as BlobPart], { type: mime }), mime };
    });
}

async function renderPdf(file: File, onPage: (n: number, total: number) => void): Promise<Array<{ name: string; blob: Blob }>> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const base = file.name.replace(/\.pdf$/i, '');
  const out: Array<{ name: string; blob: Blob }> = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      onPage(i, doc.numPages);
      const page = await doc.getPage(i);
      const unscaled = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.max(1, PDF_TARGET_WIDTH / unscaled.width) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser could not create a canvas.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      out.push({ name: `${base}-p${String(i).padStart(3, '0')}.png`, blob: await canvasToBlob(canvas, 'image/png') });
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return out;
}

/**
 * Ingests files in the order given (the upload screen lets people reorder
 * them); archive contents are sorted by filename within each archive.
 */
export async function ingestFiles(files: File[], onProgress?: IngestProgress): Promise<IngestResult> {
  const problems = validateFiles(files);
  const bad = new Set(problems.map((p) => p.file));
  const pages: IngestedPage[] = [];
  const queue = files.filter((f) => !bad.has(f.name));

  for (let i = 0; i < queue.length; i++) {
    const file = queue[i];
    const ext = extensionOf(file.name);
    onProgress?.(i, queue.length, `Reading ${file.name}…`);
    try {
      if (ext === 'zip') {
        const entries = await unzipImages(file);
        if (entries.length === 0) problems.push({ file: file.name, reason: `“${file.name}” doesn’t contain any PNG, JPG, or WEBP images.` });
        for (let j = 0; j < entries.length; j++) {
          onProgress?.(i, queue.length, `Unpacking ${file.name} — ${j + 1} of ${entries.length}`);
          try {
            pages.push(await pageFromImage(entries[j].name, entries[j].blob, entries[j].mime));
          } catch (err) {
            problems.push({ file: `${file.name} › ${entries[j].name}`, reason: err instanceof QualityError ? err.message : `“${entries[j].name}” inside ${file.name} couldn’t be read as an image.` });
          }
        }
      } else if (ext === 'pdf') {
        const rendered = await renderPdf(file, (n, total) => onProgress?.(i, queue.length, `Rendering ${file.name} — page ${n} of ${total}`));
        for (const r of rendered) pages.push(await pageFromImage(r.name, r.blob, 'image/png'));
      } else {
        pages.push(await pageFromImage(file.name, file, file.type || mimeForExtension(ext)));
      }
    } catch (err) {
      problems.push({
        file: file.name,
        reason: err instanceof QualityError ? err.message :
          ext === 'pdf'
            ? `“${file.name}” couldn’t be opened as a PDF. It may be encrypted or damaged.`
            : ext === 'zip'
              ? `“${file.name}” couldn’t be unpacked. It may be damaged or use an unsupported compression method.`
              : `“${file.name}” couldn’t be read as an image. ${err instanceof Error ? err.message : ''}`.trim(),
      });
    }
    if (pages.length > MAX_PAGES_PER_CHAPTER) {
      problems.push({ file: file.name, reason: `A chapter can hold up to ${MAX_PAGES_PER_CHAPTER} pages. Split this upload across chapters.` });
      pages.length = MAX_PAGES_PER_CHAPTER;
      break;
    }
  }
  onProgress?.(queue.length, queue.length, 'Done');
  return { pages, problems };
}
