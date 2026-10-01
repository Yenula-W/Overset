'use client';
import * as React from 'react';
import { Button, Modal } from '@/components/ui';
import type { DialogueRegion } from '@/lib/types/domain';
import { renderPage } from '@/lib/imaging/render';
export function CleanupModal({open,onClose,image,region,onSave}:{open:boolean;onClose:()=>void;image:ImageBitmap|null;region:DialogueRegion;onSave:(cleanup:DialogueRegion['artworkCleanup'])=>void}){
 const canvas=React.useRef<HTMLCanvasElement>(null);
 const viewport=React.useRef<HTMLDivElement>(null);
 const [source,setSource]=React.useState<{x:number;y:number}|null>(null);
 const [offset,setOffset]=React.useState<{x:number;y:number}|null>(null);
 const [strokes,setStrokes]=React.useState<Array<{x:number;y:number;radius:number}>>([]);
 const [size,setSize]=React.useState(0.7);
 const dragging=React.useRef(false);
 React.useEffect(()=>{if(open){setSource(null);setOffset(region.artworkCleanup?{x:region.artworkCleanup.offsetX,y:region.artworkCleanup.offsetY}:null);setStrokes(region.artworkCleanup?.strokes??[]);}},[open,region.id]);
 React.useEffect(()=>{
  if(!open||!image||!canvas.current)return;
  const working={...region,translate:true,artworkCleanup:offset?{offsetX:offset.x,offsetY:offset.y,strokes}:undefined};
  void renderPage(image,[working],strokes.length?'cleaned':'original',canvas.current);
 },[open,image,region,offset,strokes]);
 React.useEffect(()=>{
  if(!open||!image)return;
  const frame=requestAnimationFrame(()=>{
   if(viewport.current&&canvas.current)viewport.current.scrollTop=Math.max(0,(region.bounds.y+region.bounds.height/2)/100*canvas.current.clientHeight-viewport.current.clientHeight/2);
  });
  return ()=>cancelAnimationFrame(frame);
 },[open,image,region.id]);
 const point=(e:React.PointerEvent)=>{const rect=canvas.current!.getBoundingClientRect();return{x:(e.clientX-rect.left)/rect.width*100,y:(e.clientY-rect.top)/rect.height*100};};
 function paint(p:{x:number;y:number}){
  const b=region.bounds;if(p.x<b.x||p.x>b.x+b.width||p.y<b.y||p.y>b.y+b.height)return;
  if(!offset&&source)setOffset({x:source.x-p.x,y:source.y-p.y});
  setStrokes(prev=>prev.length<3000?[...prev,{...p,radius:size}]:prev);
 }
 return <Modal open={open} onClose={onClose} title="Clean text over artwork" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!offset||!strokes.length} onClick={()=>{if(offset)onSave({offsetX:offset.x,offsetY:offset.y,strokes});onClose();}}>Apply cleanup</Button></>}>
  <p className="mb-3 text-[13px] text-ink-muted">Pick nearby clean artwork, then paint over the source text. Only painted pixels inside this region change. Check the result in Compare.</p>
  <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px]"><label>Brush size <input aria-label="Cleanup brush size" type="range" min="0.1" max="3" step="0.1" value={size} onChange={e=>setSize(Number(e.target.value))} /></label><Button size="sm" variant="secondary" onClick={()=>{setSource(null);setOffset(null);setStrokes([]);}}>Reset</Button><Button size="sm" variant="ghost" onClick={()=>setStrokes(s=>s.slice(0,-1))} disabled={!strokes.length}>Undo</Button></div>
  <p role="status" className="mb-2 text-[12px] text-accent">{!source&&!offset?'Click to choose clean source pixels.':'Paint over the text to clone your source pixels.'}</p>
  <div ref={viewport} className="max-h-[50vh] overflow-auto rounded-lg border border-line"><canvas ref={canvas} className="w-full touch-none cursor-crosshair" aria-label="Artwork cleanup canvas" onPointerDown={e=>{const p=point(e);if(!source&&!offset){setSource(p);return;}dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);paint(p);}} onPointerMove={e=>{if(dragging.current)paint(point(e));}} onPointerUp={()=>{dragging.current=false;}} onPointerCancel={()=>{dragging.current=false;}} /></div>
 </Modal>;
}
