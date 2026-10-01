/** Copies only explicitly painted pixels. All other RGBA bytes stay unchanged. */
export interface CloneStroke { x: number; y: number; radius: number }
export function cloneMaskedPixels(target: Uint8ClampedArray, source: Uint8ClampedArray, width:number,height:number,strokes:CloneStroke[]) {
 if(target.length!==width*height*4||source.length!==target.length)throw new Error('Cleanup buffers have different dimensions.');
 for(const s of strokes){
  if(![s.x,s.y,s.radius].every(Number.isFinite)||s.radius<=0)continue;
  const radius=Math.min(s.radius,Math.max(width,height));
  const x0=Math.max(0,Math.floor(s.x-radius)),x1=Math.min(width-1,Math.ceil(s.x+radius));
  const y0=Math.max(0,Math.floor(s.y-radius)),y1=Math.min(height-1,Math.ceil(s.y+radius));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   if((x-s.x)**2+(y-s.y)**2>radius**2)continue;
   const i=(y*width+x)*4;if(source[i+3]!==255)continue;
   target[i]=source[i];target[i+1]=source[i+1];target[i+2]=source[i+2];target[i+3]=source[i+3];
  }
 }
 return target;
}
