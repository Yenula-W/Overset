import test from 'node:test';
import assert from 'node:assert/strict';
import {runQa} from '../src/lib/qa.ts';
import {analyzeLettering,removeLettering,letteringColumns} from '../src/lib/imaging/lettering-core.ts';
function fixture(gray=255){
 const w=160,h=180,data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const inner=((x-80)/67)**2+((y-90)/78)**2<1;
  const k=(y*w+x)*4;data.set([inner?gray:25,inner?gray:30,inner?gray:45,255],k);
 }
 const glyphs=[];
 for(const x of [57,88])for(const y of [45,72,99])for(let dy=0;dy<15;dy++)for(let dx=0;dx<10;dx++)if(dx<3||dy<3||dy>11){const k=((y+dy)*w+x+dx)*4;data.set([10,10,10,255],k);glyphs.push(k/4);}
 return{w,h,data,glyphs};
}
for(const gray of [255,215])test(`text-only cleanup retains the ${gray===255?'white':'gray'} bubble and artwork`,()=>{
 const {w,h,data,glyphs}=fixture(gray);const analysis=analyzeLettering(data,w,h);assert.ok(analysis.safeBox);assert.ok(analysis.glyphCount>=6);const out=removeLettering(data.slice(),w,h,analysis);
 for(let i=0;i<w*h;i++)if(!analysis.mask[i])assert.deepEqual(out.slice(i*4,i*4+4),data.slice(i*4,i*4+4));
 for(const i of glyphs)assert.equal(out[i*4],gray);
 for(let x=0;x<w;x++)assert.deepEqual(out.slice(x*4,x*4+4),data.slice(x*4,x*4+4));
 const b=analysis.safeBox;for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++)assert.ok(out[(y*w+x)*4]>=185,'fitting area stays inside the bubble');
});
test('no reliable source lettering leaves an empty bubble unchanged',()=>{const{w,h,data}=fixture();for(let i=0;i<data.length;i+=4)if(data[i]===10)data.set([255,255,255,255],i);const a=analyzeLettering(data,w,h);assert.equal(a.safeBox,null);assert.deepEqual(removeLettering(data.slice(),w,h,a),data);});
test('large connected artwork strokes are never treated as lettering',()=>{const{w,h,data}=fixture();for(let y=0;y<h;y++)for(let x=35;x<40;x++)data.set([0,0,0,255],(y*w+x)*4);const a=analyzeLettering(data,w,h);for(let y=0;y<h;y++)for(let x=35;x<40;x++)assert.equal(a.mask[y*w+x],0);});
test('separate vertical dialogue blocks can be split without changing bubble contours',()=>{const mask=new Uint8Array(160*120);for(let y=20;y<100;y++)for(const x of [25,26,110,111])mask[y*160+x]=1;const groups=letteringColumns({mask,glyphHeight:15},160,120);assert.equal(groups.length,2);assert.deepEqual(groups,[{left:25,right:27},{left:110,right:112}]);});
test('invalid image dimensions are rejected',()=>assert.throws(()=>analyzeLettering(new Uint8Array(3),2,2),/dimensions/));
test('colored faces are not accepted as light speech bubbles',()=>{const {w,h,data}=fixture();for(let i=0;i<data.length;i+=4)if(data[i]>185)data.set([245,197,166,255],i);const a=analyzeLettering(data,w,h);assert.equal(a.safeBox,null);assert.equal(a.glyphCount,0);assert.deepEqual(removeLettering(data.slice(),w,h,a),data);});
test('cleanup interpolates a gray gradient while retaining every unmasked pixel',()=>{const {w,h,data,glyphs}=fixture(215);const expected=data.slice();for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,k=i*4;const gray=Math.round(200+x/160*40);if(data[k]===215)for(let c=0;c<3;c++)data[k+c]=expected[k+c]=gray;else if(glyphs.includes(i))for(let c=0;c<3;c++)expected[k+c]=gray;}const a=analyzeLettering(data,w,h),out=removeLettering(data.slice(),w,h,a);for(const i of glyphs)assert.ok(Math.abs(out[i*4]-expected[i*4])<=3);for(let i=0;i<w*h;i++)if(!a.mask[i])assert.deepEqual(out.slice(i*4,i*4+4),data.slice(i*4,i*4+4));});

test('unsafe cleanup is a critical review finding even for an approved translation',()=>{const r={id:'r1',readingOrder:1,type:'dialogue',sourceText:'source',finalTranslation:'approved line',status:'approved',translate:true,alternatives:[],ocrConfidence:99,translationConfidence:99,contextUsed:[],typesetting:{}};const findings=runQa([{id:'p1',order:1,regions:[r]}],{glossary:[],characters:[],canRender:()=>false});assert.ok(findings.some(f=>f.regionId==='r1'&&f.severity==='critical'&&f.title==='Bubble needs review'));assert.equal(r.finalTranslation,'approved line');});
