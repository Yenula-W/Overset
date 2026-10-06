import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveTypesetting,letteringText} from '../src/lib/imaging/typography-core.ts';
import {wrapLines,fitText} from '../src/lib/imaging/typeset-core.ts';
const typesetting={fontSource:'matched',fontFamily:'Archivo',fontSize:40,fontWeight:400,align:'left',lineHeight:1.15,letterSpacing:0,rotation:0,outline:false,direction:'horizontal',autoFit:true};
test('existing automatic narration receives source-like serif lettering without editing text',()=>{
 const region={type:'narration',sourceLanguage:'ja',typesetting,finalTranslation:'It is not like I *want* to do it, either.'};
 const t=effectiveTypesetting(region);
 assert.equal(t.fontFamily,'Noto Serif');assert.equal(t.fontSize,28);assert.equal(t.lineHeight,1.2);assert.equal(t.align,'left');
 assert.equal(region.typesetting.fontSize,40);assert.equal(region.finalTranslation,'It is not like I *want* to do it, either.');
});
test('human font, size, alignment and spacing remain authoritative',()=>{
 for(const override of [{fontSource:'manual'},{autoFit:false}]){
  const region={type:'narration',typesetting:{...typesetting,...override}};
  assert.equal(effectiveTypesetting(region),region.typesetting);
 }
});
test('balanced narration avoids stranded conjunctions without adding lines or changing words',()=>{
 const text="So I'm always covered in fresh cuts and bruises, and brushing with death is a regular thing.";
 const measure=(s,size)=>s.length*size*.5;
 const lines=wrapLines(text,124,18,measure);
 assert.equal(lines.join(' '),text);
 assert.ok(!lines.some(l=>['a','and'].includes(l)));
 assert.ok(lines.every(l=>measure(l,18)<=124));
 const fit=fitText({text,boxWidth:124,boxHeight:300,fontSizePx:18,minFontSizePx:11,lineHeight:1.3,autoFit:true},measure);
 assert.ok(fit.fits);assert.equal(fit.fontSizePx,18);
});
test('explicit paragraph breaks and punctuation survive balanced wrapping',()=>{
 const lines=wrapLines('Wait!\nYou really thought that would work?',100,10,(s,size)=>s.length*size*.5);
 assert.equal(lines[0],'Wait!');assert.equal(lines.slice(1).join(' '),'You really thought that would work?');
});
test('inline emphasis has clean display text and exact spans while literal markers remain',()=>{
 const source="It's not like I *want* to do it, either. **Really.**";
 const result=letteringText(source);
 assert.equal(result.text,"It's not like I want to do it, either. Really.");
 assert.deepEqual(result.emphasis.map(e=>result.text.slice(e.start,e.end)),['want','Really.']);
 assert.equal(letteringText('Rating: 5*').text,'Rating: 5*');
 assert.equal(letteringText('2*3*4 and field_name_here').text,'2*3*4 and field_name_here');
});

test('source lettering traits select matching Latin family, weight and size',()=>{
 for(const [category,fontFamily] of [['serif','Noto Serif'],['sans','Archivo'],['handwritten','Comic Neue'],['display','Bangers']]){
  const t=effectiveTypesetting({type:'narration',typesetting:{...typesetting,sourceFont:{category,weight:700,size:25}}});
  assert.equal(t.fontFamily,fontFamily);assert.equal(t.fontWeight,700);assert.equal(t.fontSize,25);
 }
});

test('measurement receives correct source offsets for repeated words and paragraph breaks',()=>{
 const calls=[];
 const lines=wrapLines('Go now.\nGo with me.',35,10,(text,size,start)=>{calls.push({text,start});return text.length*size*.5;});
 assert.equal(lines.join(' '),'Go now. Go with me.');
 assert.ok(calls.some(c=>c.text.startsWith('Go')&&c.start===8));
 assert.ok(calls.every(c=>Number.isInteger(c.start)));
});
