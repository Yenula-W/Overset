import { detectBubbles, readingOrder, rgbaToLuma } from './detect-core';
import { DEFAULT_TYPESETTING, type DialogueRegion, type LanguageCode } from '@/lib/types/domain';
import { newId } from '@/lib/store/db';

/** Longest side analysed; plenty to find bubbles, fast enough to run per page. */
const ANALYSIS_MAX_WIDTH = 720;
const ANALYSIS_MAX_PIXELS = 8_000_000;

/** Detects bubbles in a page image and returns editable, untranslated regions. */
export async function detectRegions(
  image: Blob,
  pageId: string,
  sourceLanguage: LanguageCode,
): Promise<DialogueRegion[]> {
  const bitmap = await createImageBitmap(image);
  try {
    let scale = Math.min(1, ANALYSIS_MAX_WIDTH / bitmap.width);
    if (bitmap.width * scale * bitmap.height * scale > ANALYSIS_MAX_PIXELS) {
      scale = Math.sqrt(ANALYSIS_MAX_PIXELS / (bitmap.width * bitmap.height));
    }
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('This browser could not create a canvas.');
    ctx.drawImage(bitmap, 0, 0, w, h);
    const lum = rgbaToLuma(ctx.getImageData(0, 0, w, h).data, w * h);
    const bubbles = readingOrder(detectBubbles(lum, w, h), sourceLanguage === 'ja' ? 'rtl' : 'ltr');

    return bubbles.map((b, i) => ({
      id: newId('rgn'),
      pageId,
      bounds: {
        x: (b.x / w) * 100,
        y: (b.y / h) * 100,
        width: (b.width / w) * 100,
        height: (b.height / h) * 100,
      },
      type: b.shape === 'box' ? 'narration' : 'dialogue',
      readingOrder: i + 1,
      sourceLanguage,
      sourceText: '',
      literalTranslation: '',
      finalTranslation: '',
      alternatives: [],
      ocrConfidence: 0,
      translationConfidence: 0,
      status: 'untranslated',
      embeddedInArtwork: false,
      translate: true,
      contextUsed: [],
      typesetting: { ...DEFAULT_TYPESETTING, align: b.shape === 'box' ? 'left' : 'center' },
      ambiguityNote: b.score < 0.6 ? 'Detected with low certainty — check this is really a text region.' : undefined,
    }));
  } finally {
    bitmap.close();
  }
}
