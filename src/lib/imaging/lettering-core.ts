/** Conservative lettering removal. Never paints a synthetic bubble or a whole region. */
export interface PixelBox { x: number; y: number; width: number; height: number }
export interface LetteringAnalysis {
  mask: Uint8Array;
  textBox: PixelBox | null;
  safeBox: PixelBox | null;
  glyphHeight: number;
  glyphCount: number;
}

export function analyzeLettering(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): LetteringAnalysis {
  const total = width * height;
  if (!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||total>4_000_000||rgba.length !== total * 4) throw new Error('Lettering dimensions do not match the image.');
  const lightPixels=new Uint8Array(total);
  const lum = new Uint8Array(total), visited = new Uint8Array(total), mask = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const k=i*4;lum[i]=(rgba[k]*299+rgba[k+1]*587+rgba[k+2]*114)/1000;
    lightPixels[i]=lum[i]>=185&&Math.max(rgba[k],rgba[k+1],rgba[k+2])-Math.min(rgba[k],rgba[k+1],rgba[k+2])<18?1:0;
  }
  const candidates: Array<{pixels:number[]; box:PixelBox}> = [];
  const fragments: typeof candidates=[];
  const stack: number[] = [];
  const cap = Math.max(16, Math.min(96, Math.max(width, height) * 0.3));
  for (let start = 0; start < total; start++) {
    if (visited[start] || lum[start] >= 160) continue;
    stack.push(start); visited[start] = 1;
    const pixels: number[] = [];
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    while (stack.length) {
      const i = stack.pop()!, x = i % width, y = Math.floor(i / width);
      pixels.push(i); x0 = Math.min(x0,x); y0 = Math.min(y0,y); x1 = Math.max(x1,x); y1 = Math.max(y1,y);
      for (let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=width||ny>=height)continue;
        const j=ny*width+nx;
        if(!visited[j]&&lum[j]<160){visited[j]=1;stack.push(j);}
      }
    }
    const w=x1-x0+1,h=y1-y0+1;
    // Borders, tails and artwork tend to be large or connected to the boundary.
    if(x0<3||y0<3||x1>=width-3||y1>=height-3||w>cap*1.5||h>cap||pixels.length<1)continue;
    let light=0,count=0;
    const pad=3;
    for(let y=y0-pad;y<=y1+pad;y++)for(let x=x0-pad;x<=x1+pad;x++) {
      if(x>=x0&&x<=x1&&y>=y0&&y<=y1)continue;
      count++;if(lightPixels[y*width+x])light++;
    }
    const component={pixels,box:{x:x0,y:y0,width:w,height:h}};
    fragments.push(component);
    // Highly textured areas are not reliable automatic cleanup candidates.
    if(fragments.length>4096)return {mask,textBox:null,safeBox:null,glyphHeight:0,glyphCount:0};
    if(light/count<0.65)continue;
    candidates.push(component);
  }
  // Isolated specks are not enough evidence to erase artwork.
  const substantial=candidates.filter(c=>c.pixels.length>=3);
  const core=substantial.length?{x0:Math.min(...substantial.map(c=>c.box.x)),y0:Math.min(...substantial.map(c=>c.box.y)),x1:Math.max(...substantial.map(c=>c.box.x+c.box.width)),y1:Math.max(...substantial.map(c=>c.box.y+c.box.height))}:null;
  const glyphs = fragments.filter(c => (candidates.includes(c)||(core&&c.box.x>=core.x0&&c.box.y>=core.y0&&c.box.x+c.box.width<=core.x1&&c.box.y+c.box.height<=core.y1))&&fragments.some(other => other!==c &&
    Math.abs((c.box.x+c.box.width/2)-(other.box.x+other.box.width/2)) < cap*1.7 &&
    Math.abs((c.box.y+c.box.height/2)-(other.box.y+other.box.height/2)) < cap*1.7));
  if(!glyphs.length)return {mask,textBox:null,safeBox:null,glyphHeight:0,glyphCount:0};
  const ink=new Uint8Array(total);for(const c of glyphs)for(const i of c.pixels)ink[i]=1;
  for(const c of glyphs)for(const i of c.pixels) {
    const x=i%width,y=Math.floor(i/width);
    // Include antialiasing and thin source outlines around accepted lettering.
    for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++) {
      const nx=x+dx,ny=y+dy;
      if(nx>0&&ny>0&&nx<width-1&&ny<height-1&&(lum[ny*width+nx]>=160||ink[ny*width+nx]))mask[ny*width+nx]=1;
    }
  }
  const x0=Math.min(...glyphs.map(c=>c.box.x)),y0=Math.min(...glyphs.map(c=>c.box.y));
  const x1=Math.max(...glyphs.map(c=>c.box.x+c.box.width)),y1=Math.max(...glyphs.map(c=>c.box.y+c.box.height));
  const textBox={x:x0,y:y0,width:x1-x0,height:y1-y0};
  const heights=glyphs.map(c=>c.box.height).sort((a,b)=>a-b);
  const glyphHeight=heights[Math.floor((heights.length-1)*0.8)];
  // Largest bright rectangle containing the original lettering centre. This
  // follows irregular/connected bubbles without drawing over their contours.
  const cx=Math.floor((x0+x1)/2),cy=Math.floor((y0+y1)/2);
  const columns=new Int32Array(width), indices=new Int32Array(width+1);
  let best:PixelBox|null=null,area=0;
  for(let y=0;y<height;y++) {
    for(let x=0;x<width;x++)columns[x]=(lightPixels[y*width+x]||mask[y*width+x])?columns[x]+1:0;
    let size=0;
    for(let x=0;x<=width;x++) {
      const current=x===width?0:columns[x];
      while(size&&columns[indices[size-1]]>current) {
        const column=indices[--size],h=columns[column],left=size?indices[size-1]+1:0,w=x-left,top=y-h+1;
        if(w*h>area&&cx>=left&&cx<x&&cy>=top&&cy<=y){area=w*h;best={x:left,y:top,width:w,height:h};}
      }
      indices[size++]=x;
    }
  }
  const safeBox=best&&best.width>12&&best.height>12?{x:best.x+3,y:best.y+3,width:best.width-6,height:best.height-6}:null;
  return {mask,textBox,safeBox,glyphHeight,glyphCount:glyphs.length};
}

/** Reconstruct only glyph pixels; interpolate nearby background across each stroke. */
export function removeLettering(rgba:Uint8ClampedArray,width:number,height:number,analysis:LetteringAnalysis) {
  const original=rgba.slice();
  function sample(x:number,y:number,dx:number,dy:number):{rgb:number[];distance:number}|null {
    for(let distance=1;distance<=128;distance++) {
      const nx=x+dx*distance,ny=y+dy*distance;
      if(nx<0||ny<0||nx>=width||ny>=height)return null;
      const colors:number[][]=[];
      for(let support=0;support<3;support++){
        const sx=nx+dx*support,sy=ny+dy*support;
        if(sx<0||sy<0||sx>=width||sy>=height)break;
        const i=sy*width+sx,k=i*4;
        const rgb=[original[k],original[k+1],original[k+2]];
        if(analysis.mask[i]||Math.min(...rgb)<185||Math.max(...rgb)-Math.min(...rgb)>18)break;
        colors.push(rgb);
      }
      if(colors.length===3){
        const rgb=[0,1,2].map(c=>colors.map(p=>p[c]).sort((a,b)=>a-b)[1]);
        return {rgb,distance};
      }
    }
    return null;
  }
  for(let i=0;i<analysis.mask.length;i++) {
    if(!analysis.mask[i])continue;
    const x=i%width,y=Math.floor(i/width);
    const left=sample(x,y,-1,0),right=sample(x,y,1,0),top=sample(x,y,0,-1),bottom=sample(x,y,0,1);
    const pairs=[[left,right],[top,bottom]].filter(pair=>pair[0]&&pair[1]).sort((a,b)=>a[0]!.distance+a[1]!.distance-b[0]!.distance-b[1]!.distance);
    if(pairs.length){
      const [a,b]=pairs[0] as [NonNullable<typeof left>,NonNullable<typeof left>];
      for(let c=0;c<3;c++)rgba[i*4+c]=Math.round((a.rgb[c]*b.distance+b.rgb[c]*a.distance)/(a.distance+b.distance));
    }else{
      const nearest=[left,right,top,bottom].filter(v=>v!==null).sort((a,b)=>a.distance-b.distance)[0];
      if(nearest)for(let c=0;c<3;c++)rgba[i*4+c]=nearest.rgb[c];
    }
  }
  // Smooth only the masked reconstruction; original artwork remains fixed.
  // This retains gradients in gray/translucent bubbles instead of flat patches.
  const locations:number[]=[];for(let i=0;i<analysis.mask.length;i++)if(analysis.mask[i])locations.push(i);
  const working=new Float32Array(rgba.length);working.set(rgba);
  for(let pass=0;pass<64;pass++)for(const i of locations){
    if(i%width===0||i%width===width-1||i<width||i>=width*(height-1))continue;
    for(let c=0;c<3;c++)working[i*4+c]=(working[(i-1)*4+c]+working[(i+1)*4+c]+working[(i-width)*4+c]+working[(i+width)*4+c])/4;
  }
  for(const i of locations)for(let c=0;c<3;c++)rgba[i*4+c]=Math.round(working[i*4+c]);
  return rgba;
}

/** Separate widely spaced vertical dialogue blocks in joined Japanese bubbles. */
export function letteringColumns(analysis:LetteringAnalysis,width:number,height:number):Array<{left:number;right:number}> {
  const columns=new Uint8Array(width);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(analysis.mask[y*width+x])columns[x]=1;
  const groups:Array<{left:number;right:number}>=[];
  const gap=Math.max(12,analysis.glyphHeight*1.25);
  let start=-1,last=-1;
  for(let x=0;x<width;x++)if(columns[x]){
    if(start>=0&&x-last>gap){groups.push({left:start,right:last+1});start=-1;}
    if(start<0)start=x;last=x;
  }
  if(start>=0)groups.push({left:start,right:last+1});
  return groups;
}
