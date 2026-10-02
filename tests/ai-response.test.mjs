import test from 'node:test';
import assert from 'node:assert/strict';
import { structuredRequest, OCR_OUTPUT } from '../src/lib/providers/structured.ts';
import { ocrSchema } from '../src/lib/providers/comic-schemas.ts';
import { processingSummary } from '../src/lib/processing-view.ts';

const region = { bounds:{x:75,y:5,width:20,height:15},type:'dialogue',text:'안녕하세요',confidence:94,embeddedInArtwork:false };
const complete = {stop_reason:'tool_use',content:[{type:'tool_use',name:'save_result',input:{regions:[region]}}],usage:{input_tokens:20,output_tokens:10}};
function run(responses) {
 const requests=[];
 const promise=structuredRequest({key:'test-only',model:'claude-sonnet-4-6',system:'test',content:[{type:'text',text:'read page'}],output:OCR_OUTPUT,schema:ocrSchema,
  fetcher:async(_url,options)=>{requests.push(JSON.parse(options.body));assert.ok(responses.length,'retry must be bounded');return new Response(JSON.stringify(responses.shift()),{status:200});}});
 return {requests,promise};
}
test('OCR uses a forced strict schema and preserves source text and bubble bounds',async()=>{
 const {requests,promise}=run([complete]);const result=await promise;
 assert.deepEqual(result.data.regions[0],region);
 assert.equal(requests[0].tools[0].strict,true);
 assert.equal(requests[0].tool_choice.name,'save_result');
 assert.equal(requests.length,1);
});
test('an incomplete OCR region retries automatically before returning a complete result',async()=>{
 const broken=structuredClone(complete);delete broken.content[0].input.regions[0].bounds;
 const {requests,promise}=run([broken,complete]);const result=await promise;
 assert.equal(requests.length,2);assert.deepEqual(result.data.regions[0].bounds,region.bounds);
 assert.equal(result.inputTokens,40);assert.equal(result.outputTokens,20);
 assert.ok(requests[1].messages[0].content.at(-1).text.includes('previous response'));
});
test('truncated results retry with more output space without parsing partial text',async()=>{
 const {requests,promise}=run([{...complete,stop_reason:'max_tokens'},complete]);await promise;
 assert.equal(requests[0].max_tokens,8192);assert.equal(requests[1].max_tokens,16384);
});
test('invalid geometry is never saved even when the JSON shape is correct',async()=>{
 const broken=structuredClone(complete);broken.content[0].input.regions[0].bounds.width=90;
 const {requests,promise}=run([broken,broken]);await assert.rejects(promise,e=>e.code==='invalid_ai_output'&&e.message.includes('saved'));
 assert.equal(requests.length,2);
});
test('plain text and missing tool calls cannot masquerade as valid OCR',async()=>{
 const {promise}=run([{content:[{type:'text',text:'not JSON'}]},complete]);assert.equal((await promise).data.regions.length,1);
});
test('refusals stop without an automatic second charge and offer manual editing',async()=>{
 const {requests,promise}=run([{stop_reason:'refusal',content:[]}]);await assert.rejects(promise,e=>e.code==='provider_refusal');assert.equal(requests.length,1);
});
test('processing groups have three clear steps with one visible failure',()=>{
 const stages=['upload','dimensions','detect','order','ocr','translate','terminology','clean','qa'].map((id,i)=>({id,label:id,state:i<4?'complete':i===4?'failed':'pending',message:'detail'}));
 const groups=processingSummary(stages);assert.equal(groups.length,3);assert.deepEqual(groups.map(s=>s.state),['complete','failed','pending']);
 assert.equal(groups[1].message,undefined,'failure description is shown once above the steps');
});
