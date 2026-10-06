import { analyzeBubble } from './bubble-core';
import { analyzeLettering, letteringColumns } from './lettering-core';
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
    const pixels=ctx.getImageData(0,0,w,h).data;
    const lum = rgbaToLuma(pixels, w * h);
    const bubbles = readingOrder(detectBubbles(lum, w, h, {lightThreshold:195}), sourceLanguage === 'ja' ? 'rtl' : 'ltr');

    const measured=bubbles.flatMap(b=>{
      const left=Math.max(0,b.x-8),top=Math.max(0,b.y-8);
      const cw=Math.min(w,b.x+b.width+8)-left,ch=Math.min(h,b.y+b.height+8)-top;
      const crop=ctx.getImageData(left,top,cw,ch).data;
      const connected=analyzeBubble(crop,cw,ch,{x:b.x-left,y:b.y-top,width:b.width,height:b.height});
      if(connected.captionBoxes && connected.captionBoxes.length>1) return connected.captionBoxes.map(box=>({
        b:{...b,x:left+box.x,y:top+box.y,width:box.width,height:box.height,shape:'box' as const},
        analysis:analyzeBubble(crop,cw,ch,box),
      })).filter(m=>m.analysis.glyphCount>=3&&m.analysis.safeBox);
      const analysis=analyzeLettering(ctx.getImageData(b.x,b.y,b.width,b.height).data,b.width,b.height);
      const text=analysis.textBox;
      if(!text||!analysis.safeBox||analysis.glyphHeight<3||analysis.glyphCount<3||analysis.glyphCount<text.width*text.height/analysis.glyphHeight**2*0.3)return [];
      const columns=sourceLanguage==='ja'?letteringColumns(analysis,b.width,b.height):[];
      if(columns.length<=1)return [{b,analysis}];
      return columns.map((group,i)=>{
        const left=i?Math.floor((columns[i-1].right+group.left)/2):0;
        const right=i<columns.length-1?Math.floor((group.right+columns[i+1].left)/2):b.width;
        const split={...b,x:b.x+left,width:right-left};
        return {b:split,analysis:analyzeLettering(ctx.getImageData(split.x,split.y,split.width,split.height).data,split.width,split.height)};
      }).filter(({analysis})=>analysis.glyphCount>=3&&analysis.safeBox);
    });
    const sorted=readingOrder(measured.map(m=>({...m.b,measurement:m.analysis})),sourceLanguage==='ja'?'rtl':'ltr');
    return sorted.map((b, i) => ({
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
      // Start the English at the measured size of the original lettering
      // (expressed in 840px reference units); auto-fit shrinks it if needed.
      typesetting: {
        ...DEFAULT_TYPESETTING,
        fontFamily: sourceLanguage === 'ja' ? 'Noto Serif' : 'Archivo',
        fontWeight: 400,
        fontSize: Math.round(Math.max(11, Math.min(32, ((b.measurement.glyphHeight / 0.72) * 840) / w)) * 2) / 2,
        align: b.shape === 'box' ? 'left' : 'center',
      },
      ambiguityNote: b.score < 0.5 ? 'Detected with low certainty — check this is really a text region.' : undefined,
    }));
  } finally {
    bitmap.close();
  }
}
