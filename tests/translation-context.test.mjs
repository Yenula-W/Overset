import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {buildTranslationContext,proposeRevision} from '../src/lib/providers/translation-context.ts';
import {translationFrame} from '../src/lib/providers/visual-context.ts';
const region=(id,text,order,status='machine')=>({id,sourceText:text,finalTranslation:'unverified draft',readingOrder:order,status,type:'dialogue',bounds:{x:20,y:30,width:10,height:10},translatorNote:'He is interrupted, not explaining calmly.'});
const prefs={useCharacterProfiles:true,useTranslationMemory:true,style:'natural',preserveHonorifics:true};
function context(){const current=region('current','実は―',2,'approved');return {chapter:{preferences:prefs,sourceLanguage:'ja',targetLanguage:'en',name:'Chapter 1'},project:{name:'Fictional demo',description:'An interrupted conversation.',preferences:{customRules:['Keep invented names consistent']}},current,page:{id:'p1',order:1,width:1000,height:1600},pages:[{order:2,regions:[region('later','later dialogue',1)]},{order:1,regions:[region('current','実は―',2,'approved'),region('before','before dialogue',1),{...region('sound','sound effect',3),type:'sfx'}]}],glossary:[{original:'天空門',translation:'Sky Gate',status:'locked',type:'location'}],characters:[],memory:[]};}
test('scene context is ordered across pages and includes later dialogue without treating SFX as speech',()=>{
 const c=buildTranslationContext(context());assert.deepEqual(c.surroundingDialogue.map(r=>r.source),['before dialogue','later dialogue']);assert.equal(c.currentText,'実は―');assert.equal(c.currentRegionId,'current');assert.equal(c.translatorNote,'He is interrupted, not explaining calmly.');assert.equal(c.glossary[0].translation,'Sky Gate');assert.equal(c.preserveHonorifics,true);
});
test('unreviewed machine wording cannot anchor the surrounding translation',()=>{
 const input=context();input.pages[0].regions[0].status='approved';input.pages[0].regions[0].finalTranslation='Human approved wording';const c=buildTranslationContext(input);assert.equal(c.surroundingDialogue[0].translation,undefined);assert.equal(c.surroundingDialogue[1].translation,'Human approved wording');assert.equal(c.currentDraft,undefined);assert.equal(buildTranslationContext({...input,improve:true}).currentDraft,input.current.finalTranslation);
});
test('a proposed improvement preserves approved text, status and original region geometry',()=>{
 const r=context().current;const snapshot=structuredClone(r);const next=proposeRevision(r,{recommended:'The thing is—',literal:'Actually—',confidence:88,alternatives:[],terminologyUsed:[],ambiguityNote:'Interrupted mid-sentence.'});assert.deepEqual(r,snapshot);assert.equal(next.finalTranslation,r.finalTranslation);assert.equal(next.status,'approved');assert.deepEqual(next.bounds,r.bounds);assert.equal(next.revisionSuggestion.translation,'The thing is—');assert.equal(next.revisionSuggestion.note,'Interrupted mid-sentence.');
});
test('visual frame is centered on the selected scene on a tall page and leaves original bytes untouched',async()=>{
 const original=await sharp({create:{width:800,height:8000,channels:3,background:'white'}}).png().toBuffer();const snapshot=Buffer.from(original);const bounds={x:40,y:80,width:10,height:4};const visual=await translationFrame(original,800,8000,bounds);const meta=await sharp(visual.image).metadata();assert.equal(meta.width,800);assert.equal(meta.height,1600);assert.equal(visual.bounds.height,20);assert.ok(visual.bounds.y>=0&&visual.bounds.y+visual.bounds.height<=100);assert.deepEqual(original,snapshot);
});
