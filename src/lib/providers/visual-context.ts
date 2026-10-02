import sharp from 'sharp';
import type { Rect } from '../types/domain';

/** A working scene image only. The stored original and export are untouched. */
export async function translationFrame(original: Buffer, width: number, height: number, bounds: Rect) {
  const center=(bounds.y+bounds.height/2)*height/100;
  const cropHeight=Math.min(height,Math.max(1600,Math.ceil(bounds.height*height/100)+1000));
  const top=Math.max(0,Math.min(height-cropHeight,Math.floor(center-cropHeight/2)));
  const image=await sharp(original,{limitInputPixels:100_000_000}).extract({left:0,top,width,height:cropHeight}).resize({width:1600,height:2400,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  return {image,bounds:{...bounds,y:(bounds.y*height/100-top)/cropHeight*100,height:bounds.height*height/cropHeight}};
}
