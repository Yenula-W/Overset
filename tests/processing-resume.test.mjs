import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real pipeline with an in-memory repository and provider.
function pipeline(pages) {
 const calls=[];
 const chapter={projectId:'project',stages:{upload:{state:'complete'},ocr:{state:'failed'}}};
 const repo={getChapter:async()=>chapter,listPages:async()=>pages,updateChapter:async(_owner,_chapter,patch)=>Object.assign(chapter,patch),listGlossary:async()=>[],listCharacters:async()=>[],
  addPages:async()=>{throw Error('must not re-upload')},recordUsage:async()=>{throw Error('must not re-charge')},savePageRegions:async()=>{throw Error('must not reset saved regions')}};
 const modules={
  '@/lib/store/db':{cloudEnabled:true},
  '@/lib/client-services':{callService:async()=>({ai:true}),aiPage:async(_chapter,pageId,action,regionId)=>{calls.push({pageId,action,regionId});const p=pages.find(p=>p.id===pageId);if(action==='ocr')p.regions.forEach(r=>r.sourceText='read source');else p.regions.find(r=>r.id===regionId).finalTranslation='AI draft';return {page:p}}},
  '@/lib/imaging/ingest':{ingestFiles:async()=>{throw Error('must not ingest again')}},
  '@/lib/imaging/detect':{detectRegions:async()=>{throw Error('must not overwrite saved regions')}},
  '@/lib/store/repo':repo,'@/lib/qa':{runQa:()=>[]},
 };
 const compiled=ts.transpileModule(readFileSync(new URL('../src/lib/processing.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(compiled,{exports,require:name=>{assert.ok(modules[name],name);return modules[name]},Error,Set,console});
 return {calls,chapter,run:()=>exports.processChapter({ownerId:'owner',chapterId:'chapter',files:[],resume:true,sourceLanguage:'ja',detect:true,onStage:()=>{},onProgress:()=>{}})};
}
const region=(id,sourceText,finalTranslation='',status='untranslated')=>({id,translate:true,sourceText,finalTranslation,status,readingOrder:1});
test('resume reads only unfinished pages and translates only unfinished dialogue',async()=>{
 const pages=[{id:'p1',order:1,width:1125,height:1600,regions:[region('approved','source','Human version','approved'),region('draft','source','Saved draft','machine'),region('pending','source')]},{id:'p2',order:2,width:1125,height:1600,regions:[region('unread','')]}];
 const {calls,chapter,run}=pipeline(pages);const result=await run();
 assert.equal(result.pageCount,2);assert.equal(chapter.status,'review');
 assert.deepEqual(calls,[{pageId:'p2',action:'ocr',regionId:undefined},{pageId:'p1',action:'translate',regionId:'pending'},{pageId:'p2',action:'translate',regionId:'unread'}]);
 assert.equal(pages[0].regions[0].finalTranslation,'Human version');assert.equal(pages[0].regions[1].finalTranslation,'Saved draft');
 assert.deepEqual(pages.map(p=>[p.width,p.height]),[[1125,1600],[1125,1600]]);
});
test('resume without saved pages explains the issue rather than creating duplicates',async()=>{
 const {run,calls}=pipeline([]);await assert.rejects(run(),/No saved pages/);assert.equal(calls.length,0);
});
