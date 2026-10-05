import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { planById } from '@/lib/billing';
import { comicProvider, aiConfigured } from '@/lib/providers/comic';
import type { TranslationContext } from '@/lib/providers/types';
import { buildTranslationContext, proposeRevision } from '@/lib/providers/translation-context';
import { translationFrame } from '@/lib/providers/visual-context';
import { readingOrder } from '@/lib/imaging/detect-core';
import { analyzeLettering } from '@/lib/imaging/lettering-core';
import { assessPageQuality } from '@/lib/imaging/quality-core';
import { DEFAULT_TYPESETTING, type DialogueRegion } from '@/lib/types/domain';
import type { ChapterRecord, ProjectRecord, PageRecord, CharacterRecord, GlossaryRecord, MemoryRecord, UserRecord } from '@/lib/store/schema';
import { PAGES_BUCKET } from '@/lib/supabase/config';
import { adminClient, authenticated, editable, record, records } from './records';
import { ServiceError } from './http';
import { rateLimit } from './authz';

export const processSchema = z.object({pageId:z.string().min(1).max(160),action:z.enum(['ocr','translate','regenerate','proofread','suggest']),regionId:z.string().max(160).optional(),requestId:z.string().uuid().optional()});
const sha = (v: string | Buffer) => createHash('sha256').update(v).digest('hex');
export async function processPage(chapterId: string, input: z.infer<typeof processSchema>) {
  const {user,db} = await authenticated();
  const chapter = await record<ChapterRecord>(db,'chapters',chapterId);
  const project = await record<ProjectRecord>(db,'projects',chapter.projectId);
  const page = await record<PageRecord>(db,'pages',input.pageId);
  if (page.chapterId !== chapter.id || page.ownerId !== chapter.ownerId || project.ownerId !== chapter.ownerId) throw new ServiceError('not_found','That page does not belong to this chapter.',404);
  await editable(db,chapter.ownerId,user);
  if (!aiConfigured()) throw new ServiceError('ai_not_configured','AI processing is not connected yet. Your chapter is saved; you can edit it manually.');
  const rate = await rateLimit(`ai:${user.id}`,60,60_000);
  if (!rate.ok) throw new ServiceError('rate_limited','Too many AI requests. Retry this page in a minute.',429);
  const admin = adminClient();
  const meta = await record<{ownerId:string;kind:string}>(db,'blobs',page.originalBlobId);
  if (meta.ownerId !== page.ownerId || meta.kind !== 'original') throw new ServiceError('invalid_page','The original page reference is invalid.',422);
  const downloaded = await admin.storage.from(PAGES_BUCKET).download(`${page.ownerId}/${page.originalBlobId}`);
  if (downloaded.error || !downloaded.data) throw new ServiceError('page_unavailable','The original image could not be loaded. Retry this page.');
  if (downloaded.data.size > 32*1024*1024) throw new ServiceError('page_too_large','This page exceeds the 32 MB AI processing limit. Keep the original for export and upload a smaller working page.',422);
  const original = Buffer.from(await downloaded.data.arrayBuffer());
  const image = sharp(original,{limitInputPixels:100_000_000});
  const dimensions = await image.metadata();
  if (!['png','jpeg','webp'].includes(dimensions.format??'') || !dimensions.width || !dimensions.height || (dimensions.pages??1)>1) throw new ServiceError('invalid_image','AI processing accepts single PNG, JPG or WEBP pages.',422);
  if (page.width !== dimensions.width || page.height !== dimensions.height) throw new ServiceError('dimensions_mismatch','The saved page dimensions do not match the original. Re-upload this page before processing.',422);
  if (page.regions.length > 150) throw new ServiceError('region_limit','This page has more than 150 regions. Split it before using AI.',422);
  if (input.action==='ocr') {
    // Refuse tiny or blurred pages before any AI cost: their lettering can't be removed cleanly.
    const band=Math.min(dimensions.height,3000),top=Math.floor((dimensions.height-band)/2);
    const lum=await sharp(original,{limitInputPixels:100_000_000}).extract({left:0,top,width:dimensions.width,height:band}).flatten({background:"#ffffff"}).greyscale().raw().toBuffer();
    const quality=assessPageQuality(new Uint8Array(lum.buffer,lum.byteOffset,lum.length),dimensions.width,band);
    if(!quality.ok)throw new ServiceError('page_quality',(quality.reason??'This page is too low quality to process.').replace(`${dimensions.width}×${band}`,`${dimensions.width}×${dimensions.height}`),422);
  }
  const region = page.regions.find(r=>r.id === input.regionId);
  if ((input.action==='translate'||input.action==='regenerate'||input.action==='suggest') && !region) throw new ServiceError('select_region','Select a text region to translate.',400);
  if (region && input.action==='translate' && (region.status==='approved'||region.status==='edited'||region.finalTranslation.trim())) return {page,skipped:true};
  if (region && !region.sourceText.trim()) throw new ServiceError('missing_source','Read or enter the original text before translating this region.',422);
  const taskId = sha(JSON.stringify({page:page.id,action:input.action,region:input.regionId,regions:page.regions,original:sha(original),nonce:['regenerate','suggest'].includes(input.action)?input.requestId:undefined}));
  if (['regenerate','suggest'].includes(input.action)&&!input.requestId) throw new ServiceError('invalid_request','Regeneration requires a new request ID.',400);
  const token = randomUUID();
  const profile = await record<UserRecord>(db,'users',page.ownerId);
  const reserved = await admin.rpc('reserve_page',{task:taskId,workspace:page.ownerId,page:page.id,operation:input.action,fingerprint:sha(original),token,allowance:planById(profile.plan).pageAllowance});
  if (reserved.error) throw new ServiceError('processing_storage','Processing could not start. Check that the service database migration is installed.');
  if (reserved.data?.limit) throw new ServiceError('page_limit','Your workspace has used its page allowance. Upgrade or add page credits to continue.',402);
  if (reserved.data?.busy) throw new ServiceError('processing_busy','This page is already being processed. Wait a moment and refresh.',409);
  if (reserved.data?.cached) return reserved.data.result;
  const provider = comicProvider();
  let next = [...page.regions];
  let tokensIn = 0, tokensOut = 0, model = '';
  let qa: unknown[] = [];
  try {
    if (input.action==='ocr') {
      // Tile tall webtoon pages. Source pixels and exported dimensions are never changed.
      const tileHeight = 2400;
      const newRegions: DialogueRegion[] = [];
      for (let y=0;y<page.height;y+=tileHeight) {
        const height = Math.min(tileHeight,page.height-y);
        const selected = page.regions.filter(r=>{const center=(r.bounds.y+r.bounds.height/2)*page.height/100;return center>=y&&center<y+height;});
        const pending = selected.filter(r=>!r.sourceText.trim()&&r.status!=='approved'&&r.status!=='edited');

        const png = await sharp(original,{limitInputPixels:100_000_000}).extract({left:0,top:y,width:page.width,height}).resize({width:1600,height:2400,fit:'inside',withoutEnlargement:true}).png().toBuffer();
        const boxes = pending.map(r=>({id:r.id,bounds:{...r.bounds,y:Math.max(0,(r.bounds.y*page.height/100-y)/height*100),height:Math.min(100-Math.max(0,(r.bounds.y*page.height/100-y)/height*100),r.bounds.height*page.height/height)}}));
        const output = await provider.readPage(png,boxes,chapter.sourceLanguage);
        tokensIn+=output.inputTokens; tokensOut+=output.outputTokens; model=output.model;
        for (const detected of output.data.regions) {
          const existing = pending.find(r=>r.id===detected.id);
          const category=detected.fontCategory;
          const fontFamily=category==='serif'?'Noto Serif':category==='handwritten'?'Comic Neue':category==='display'?'Bangers':category==='sans'?'Archivo':chapter.sourceLanguage==='ja'?'Noto Serif':'Archivo';
          const fontWeight=detected.fontWeight==='bold'?700:400;
          const bounds={...detected.bounds,y:(y+detected.bounds.y*height/100)/page.height*100,height:detected.bounds.height*height/page.height};
          let fontSize=DEFAULT_TYPESETTING.fontSize;
          if(!detected.embeddedInArtwork){
            const left=Math.max(0,Math.floor(bounds.x*page.width/100)),top=Math.max(0,Math.floor(bounds.y*page.height/100));
            const width=Math.min(page.width-left,Math.ceil(bounds.width*page.width/100)),heightPx=Math.min(page.height-top,Math.ceil(bounds.height*page.height/100));
            if(width>0&&heightPx>0&&width*heightPx<=4_000_000){
              const pixels=await sharp(original,{limitInputPixels:100_000_000}).extract({left,top,width,height:heightPx}).toColourspace('srgb').ensureAlpha().raw().toBuffer();
              const measured=analyzeLettering(pixels,width,heightPx);
              if(measured.glyphHeight)fontSize=Math.round(Math.max(11,Math.min(40,measured.glyphHeight/0.72*840/page.width))*2)/2;
            }
          }
          // Never duplicate protected human regions, including OCR already reviewed.
          if(!existing&&[...next,...newRegions].some(r=>{
            const overlap=Math.max(0,Math.min(r.bounds.x+r.bounds.width,bounds.x+bounds.width)-Math.max(r.bounds.x,bounds.x))*Math.max(0,Math.min(r.bounds.y+r.bounds.height,bounds.y+bounds.height)-Math.max(r.bounds.y,bounds.y));
            return overlap/Math.min(r.bounds.width*r.bounds.height,bounds.width*bounds.height)>0.35;
          }))continue;
          if (existing) next=next.map(r=>r.id===existing.id?{...r,sourceText:detected.text,romanization:detected.romanization,ocrConfidence:detected.confidence,typesetting:r.typesetting.fontSource==='manual'?r.typesetting:{...r.typesetting,fontFamily,fontWeight,fontSize,fontSource:'matched'}}:r);
          else newRegions.push({id:`rgn_${randomUUID()}`,pageId:page.id,bounds,type:detected.type,readingOrder:Math.max(0,...next.map(r=>r.readingOrder))+newRegions.length+1,sourceLanguage:chapter.sourceLanguage,sourceText:detected.text,romanization:detected.romanization,literalTranslation:'',finalTranslation:'',alternatives:[],ocrConfidence:detected.confidence,translationConfidence:0,status:'untranslated',embeddedInArtwork:detected.embeddedInArtwork,translate:detected.type!=='sfx'||chapter.preferences.translateSfx,contextUsed:[],typesetting:{...DEFAULT_TYPESETTING,fontFamily,fontWeight,fontSize,fontSource:'matched'}});
        }
      }
      const combined=[...next,...newRegions];
      // New OCR discoveries belong in visual reading order, not at the end.
      // Keep a reviewed page's existing human ordering unchanged.
      next=page.regions.some(r=>r.status==='approved'||r.status==='edited')?combined:readingOrder(combined.map(r=>({...r,...r.bounds})),chapter.sourceLanguage==='ja'?'rtl':'ltr').map(({x,y,width,height,...r},i)=>({...r,readingOrder:i+1}));
      if(next.length>150)throw new ServiceError('region_limit','More than 150 text regions were found. Split the page before processing.',422);
    } else {
      const [glossary,characters,memory,pages] = await Promise.all([
        records<GlossaryRecord>(db,'glossary',page.ownerId,'projectId',project.id),records<CharacterRecord>(db,'characters',page.ownerId,'projectId',project.id),records<MemoryRecord>(db,'memory',page.ownerId,'projectId',project.id),records<PageRecord>(db,'pages',page.ownerId,'chapterId',chapter.id),
      ]);
      const current=region??page.regions[0];
      if (!current) throw new ServiceError('missing_text','Read the page text first.',422);
      const context=buildTranslationContext({chapter,project,page,current,pages,glossary,characters,memory,improve:input.action==='suggest'});
      if (input.action==='proofread') {
        const output=await provider.proofread(page.regions,{...context,sceneSummary:undefined});
        qa=output.data.filter(f=>page.regions.some(r=>r.id===f.regionId));
        const measured=output as typeof output & {inputTokens:number;outputTokens:number;model:string};
        tokensIn=measured.inputTokens;tokensOut=measured.outputTokens;model=measured.model;
      } else {
        const visual=await translationFrame(original,page.width,page.height,current.bounds);
        const output=await provider.translate({...context,visualRegion:visual.bounds},visual.image);
        const draft=output.data;
        const lockedIssues=context.glossary.filter(g=>g.locked&&current.sourceText.includes(g.original)&&!draft.recommended.toLowerCase().includes(g.translation.toLowerCase()));
        next=input.action==='suggest'?next.map(r=>r.id===current.id?proposeRevision(r,{...draft,ambiguityNote:[draft.ambiguityNote,...lockedIssues.map(g=>`Check locked term: ${g.translation}`)].filter(Boolean).join(' · ')||undefined}):r):next.map(r=>r.id===current.id?{...r,literalTranslation:draft.literal,finalTranslation:draft.recommended,alternatives:draft.alternatives,romanization:draft.romanization??r.romanization,translationConfidence:draft.confidence,status:'machine',ambiguityNote:[draft.ambiguityNote,draft.culturalNote,...lockedIssues.map(g=>`Check locked term: ${g.translation}`)].filter(Boolean).join(' · ')||undefined,contextUsed:[{kind:'chapter',label:chapter.name},{kind:'scene',label:'Original panel artwork'},{kind:'previous_dialogue',label:`${context.surroundingDialogue.length} surrounding bubbles`},...(context.speaker?[{kind:'character' as const,label:context.speaker.name}]:[]),{kind:'glossary',label:`${context.glossary.length} terms`},{kind:'memory',label:`${context.memory.length} approved examples`}]}:r);
        tokensIn=output.inputTokens;tokensOut=output.outputTokens;model=output.model;
      }
    }
    const result={page:{...page,regions:next},qa};
    const finished=await admin.rpc('finish_page',{task:taskId,token,page:page.id,expected:page.regions,regions:next,result_data:result,model_name:model,tokens_in:tokensIn,tokens_out:tokensOut});
    if (finished.error) throw new ServiceError('save_failed','The AI result could not be saved. Retry this page.');
    if (!finished.data) throw new ServiceError('edit_conflict','This page changed while AI was working. Your newer edits were preserved. Refresh and retry.',409);
    return result;
  } catch(error) {
    await admin.from('processing_tasks').update({state:'failed',updated_at:new Date().toISOString(),input_tokens:tokensIn,output_tokens:tokensOut,model}).eq('id',taskId).eq('lease',token);
    throw error;
  }
}
