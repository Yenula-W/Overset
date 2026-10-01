import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cloneMaskedPixels} from '../src/lib/imaging/clone-core.ts';
test('cleanup changes only painted pixels, preserving every other RGBA byte',()=>{
 const width=20,height=20;
 const original=new Uint8ClampedArray(width*height*4).fill(35);
 const target=original.slice(),source=new Uint8ClampedArray(original.length).fill(255);
 cloneMaskedPixels(target,source,width,height,[{x:10,y:10,radius:2}]);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const inside=(x-10)**2+(y-10)**2<=4;
  assert.deepEqual([...target.slice((y*width+x)*4,(y*width+x)*4+4)],Array(4).fill(inside?255:35));
 }
});
test('cleanup at boundaries is clipped and cannot erase with transparent source pixels',()=>{
 const target=new Uint8ClampedArray(8*8*4).fill(45),before=target.slice(),transparent=new Uint8ClampedArray(target.length);
 cloneMaskedPixels(target,transparent,8,8,[{x:0,y:0,radius:100},{x:NaN,y:0,radius:1}]);
 assert.deepEqual(target,before);
});

import { runQa } from '../src/lib/qa.ts';
test('a cleanup stroke does not certify that all artwork text was removed', () => {
 const region={id:'sfx',pageId:'p1',readingOrder:1,type:'sfx',translate:true,sourceText:'쾅',finalTranslation:'BOOM',status:'edited',artworkCleanup:{offsetX:0,offsetY:1,strokes:[{x:50,y:50,radius:1}]}};
 const context={glossary:[],characters:[]};
 const findings=runQa([{id:'p1',order:1,regions:[region]}],context);
 assert.ok(findings.some(f=>f.title==='Review artwork cleanup'));
 const approved=runQa([{id:'p1',order:1,regions:[{...region,status:'approved'}]}],context);
 assert.ok(!approved.some(f=>f.title==='Review artwork cleanup'));
});
