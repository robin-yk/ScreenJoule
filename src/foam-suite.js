// Foam texture for the 0D schematic and the 2D field (see foam-texture.js).
(()=>{
 const NS='http://www.w3.org/2000/svg',el=(tag,attrs)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 // One tiled SVG pattern; the tile is large enough that repetition is not obvious.
 function foamPattern(svg,porosity,id){
  const tile=84,defs=svg.querySelector('defs')||svg.insertBefore(el('defs',{}),svg.firstChild),pattern=el('pattern',{id,width:tile,height:tile,patternUnits:'userSpaceOnUse'});
  for(const p of foamPores(tile,tile,porosity,8,23))for(const dx of [-tile,0,tile])for(const dy of [-tile,0,tile])pattern.append(el('circle',{cx:p.x+dx,cy:p.y+dy,r:p.r,fill:FOAM_STYLE.fill,stroke:FOAM_STYLE.rim,'stroke-width':FOAM_STYLE.rimWidth}));
  defs.append(pattern);return `url(#${id})`;
 }
 const baseGeometry=renderGeometryVisual;
 renderGeometryVisual=function(r){
  baseGeometry(r);const svg=$('geometryVisual'),phi=r.g.porosity;if(!(phi>0))return;
  // Replace the regular pore grid on the box with the shared foam texture.
  svg.querySelector('g[clip-path="url(#boxPoreClip)"]')?.remove();
  const fill=foamPattern(svg,phi,'foamTexture0d'),faces=[...svg.querySelectorAll('polygon')].filter(p=>p.getAttribute('fill')?.startsWith('rgb'));
  for(const face of faces){const overlay=face.cloneNode();overlay.setAttribute('fill',fill);overlay.setAttribute('stroke','none');overlay.setAttribute('pointer-events','none');face.after(overlay);}
  const box=svg.viewBox.baseVal,note=el('text',{x:box&&box.width?box.width-12:660,y:box&&box.height?box.height-10:318,fill:'#8a949c','font-size':11,'font-family':'Arial','text-anchor':'end'});note.textContent=FOAM_STYLE.note;svg.append(note);
 };
 const base2D=draw2D;
 draw2D=function(result){
  base2D(result);const phi=result.g.porosity;if($('t2dFoamNote'))$('t2dFoamNote').hidden=!(phi>0);if(!(phi>0))return;
  const canvas=$('thermalMap'),map=canvas._physicalMap,ctx=canvas.getContext('2d');if(!map)return;
  const R=result.mesh.radius,L=result.g.L,x0=map.cx-R*map.scale,y0=map.oy+(result.mesh.domainHeight/2-L/2)*map.scale,w=2*R*map.scale,h=L*map.scale;
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.clip();
  for(const p of foamPores(w,h,phi,Math.max(5,Math.min(w,h)/14),11)){ctx.beginPath();ctx.arc(x0+p.x,y0+p.y,p.r,0,2*Math.PI);ctx.fillStyle=FOAM_STYLE.fill;ctx.fill();ctx.strokeStyle=FOAM_STYLE.rim;ctx.lineWidth=FOAM_STYLE.rimWidth;ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle='#102a43';ctx.lineWidth=3;ctx.strokeRect(x0,y0,w,h);
  let note=$('t2dFoamNote');if(!note){note=document.createElement('p');note.id='t2dFoamNote';note.style.cssText='margin:6px 0 0;font-size:11px;color:#8a949c;text-align:center';canvas.parentElement.after(note);}note.textContent=FOAM_STYLE.note;
 };
})();
