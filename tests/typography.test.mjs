import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveTypesetting,letteringText,letteringCoverage,applyLetteringStyle,comicLetteringStyle,letteringPlacement} from '../src/lib/imaging/typography-core.ts';
import {wrapLines,fitText} from '../src/lib/imaging/typeset-core.ts';
const typesetting={fontSource:'matched',fontFamily:'Archivo',fontSize:40,fontWeight:400,align:'left',lineHeight:1.15,letterSpacing:0,rotation:0,outline:false,direction:'horizontal',autoFit:true};
test('existing automatic narration receives source-like serif lettering without editing text',()=>{
 const region={type:'narration',sourceLanguage:'ja',typesetting,finalTranslation:'It is not like I *want* to do it, either.'};
 const t=effectiveTypesetting(region);
 assert.equal(t.fontFamily,'Noto Serif');assert.equal(t.fontSize,28);assert.equal(t.lineHeight,1.2);assert.equal(t.align,'center');
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

test('coverage changes the fitting budget without overriding fixed manual sizes',()=>{
 const base={...typesetting,fontSource:'manual'};
 assert.equal(letteringCoverage(base),1);
 assert.equal(letteringCoverage({...base,coverage:'roomy'}),.66);
 assert.equal(letteringCoverage({...base,coverage:'balanced'}),.8);
 assert.equal(letteringCoverage({...base,coverage:'fuller'}),.92);
 assert.equal(letteringCoverage({...base,autoFit:false,coverage:'roomy'}),1);
});
test('applying a style preserves other text kinds, original boxes and translations',()=>{
 const narration={id:'n',type:'narration',translate:true,status:'approved',bounds:{x:5,y:5,width:10,height:20},finalTranslation:'Approved text',typesetting:{...typesetting,fontSource:'manual',fontFamily:'Noto Serif',fontSize:24,coverage:'fuller',align:'right'}};
 const second={...narration,id:'n2',typesetting:{...typesetting,rotation:12,align:'center',sourceFont:{category:'sans',weight:400,size:26}}};
 const dialogue={...second,id:'d',type:'dialogue'};
 const sfx={...second,id:'s',type:'sfx'};
 const skipped={...second,id:'skip',translate:false};
 const result=applyLetteringStyle([narration,second,dialogue,sfx,skipped],narration);
 assert.equal(result[1].typesetting.fontFamily,'Noto Serif');assert.equal(result[1].typesetting.coverage,'fuller');assert.equal(result[1].typesetting.autoFit,true);
 assert.equal(result[1].typesetting.rotation,12);assert.equal(result[1].typesetting.align,'right');
 assert.deepEqual(result[1].typesetting.sourceFont,second.typesetting.sourceFont);
 assert.equal(result[1].bounds,second.bounds);assert.equal(result[1].finalTranslation,second.finalTranslation);
 assert.equal(result[1].status,'edited');
 assert.equal(result[2],dialogue);assert.equal(result[3],sfx);assert.equal(result[4],skipped);
 assert.equal(second.status,'approved');
});

test('visible lettering stays centered with italic bearings and unequal ascenders',()=>{
 const lines=[{left:-3,right:96,ascent:18,descent:0},{left:1,right:72,ascent:15,descent:5}];
 const placed=letteringPlacement(lines,26,120,'center');
 for(let i=0;i<lines.length;i++) assert.equal(placed[i].x+(lines[i].left+lines[i].right)/2,0);
 const top=Math.min(...lines.map((l,i)=>placed[i].y-l.ascent));
 const bottom=Math.max(...lines.map((l,i)=>placed[i].y+l.descent));
 assert.equal(top,-bottom);
 assert.equal(placed[1].y-placed[0].y,26);
 for(const align of ['left','right']) {
  const p=letteringPlacement(lines,26,120,align);
  for(let i=0;i<lines.length;i++) assert.equal(p[i].x+lines[i][align],align==='left'?-60:60);
 }
 assert.deepEqual(letteringPlacement([],26,120,'center'),[]);
});
test('comic preset is a reversible presentation choice and keeps source font metadata',()=>{
 const style=comicLetteringStyle({...typesetting,sourceFont:{category:'serif',weight:400,size:27}});
 assert.equal(style.align,'center');assert.equal(style.fontFamily,'Archivo Narrow');assert.equal(style.fontStyle,'italic');assert.equal(style.textCase,'uppercase');
 assert.deepEqual(style.sourceFont,{category:'serif',weight:400,size:27});
 const source='Wait, *Hunters*?';
 const display=letteringText(source,style.textCase);
 assert.equal(display.text,'WAIT, HUNTERS?');assert.equal(source,'Wait, *Hunters*?');
 assert.deepEqual(display.emphasis.map(e=>display.text.slice(e.start,e.end)),['HUNTERS']);
 const region={id:'n',type:'narration',translate:true,typesetting:style,finalTranslation:source};
 const applied=applyLetteringStyle([{...region,id:'n2',typesetting}],region)[0];
 assert.equal(applied.typesetting.fontStyle,'italic');assert.equal(applied.typesetting.textCase,'uppercase');assert.equal(applied.finalTranslation,source);
});
