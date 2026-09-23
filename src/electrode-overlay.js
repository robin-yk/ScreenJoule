// Display-only contact footprints and leads; solver geometry is unchanged.
function electrodeContactGeometry(m,terminal){
 const polygons=[],edges=new Map();let area=0;
 for(const [a,k,sign,t,faceArea] of m.faces){
  if(t!==terminal||k!==2)continue;
  const z=m.xyz[a][2]+sign*m.d[2]/2;
  const points=m.kind==='annular'?annularFacePolygon(m,a,k,sign).points:
   [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>[m.xyz[a][0]+x*m.d[0]/2,m.xyz[a][1]+y*m.d[1]/2,z]);
  polygons.push({a,points});area+=m.kind==='annular'?faceArea:m.d[0]*m.d[1];
  points.forEach((p,i)=>{const q=points[(i+1)%points.length],key=[p,q].map(v=>v.map(n=>n.toFixed(10)).join(',')).sort().join('|');
   if(edges.has(key))edges.delete(key);else edges.set(key,[p,q]);});
 }
 if(!polygons.length)return null;
 const centers=polygons.map(p=>m.xyz[p.a]);
 const mean=[0,1].map(k=>centers.reduce((s,p)=>s+p[k],0)/centers.length);
 const anchor=centers.reduce((best,p)=>Math.hypot(p[0]-mean[0],p[1]-mean[1])<Math.hypot(best[0]-mean[0],best[1]-mean[1])?p:best).slice();
 anchor[2]=polygons[0].points[0][2];
 return {polygons,boundary:[...edges.values()],anchor,area};
}
function drawElectrodeOverlay(c,m,proj,shown){
 const notes=[];
 for(const t of [1,2]){
  const g=electrodeContactGeometry(m,t);if(!g)continue;
  const rgb=t===1?'22,137,151':'197,112,40',label=t===1?'A':'B';
  notes.push(label+' '+fmt(g.area*1e6)+' mm²');
  const sign=t===1?-1:1,thickness=Math.min(m.W,m.H)*.055;
  const outer=p=>[p[0],p[1],p[2]+sign*thickness];
  const paint=(points,fill)=>{c.beginPath();points.map(proj).forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fillStyle=fill;c.fill();};
  c.save();
  // A thin collar follows the contact footprint, including the tube bore.
  // Its drawn thickness is illustrative; finite electrodes are solver inputs.
  if(g.polygons.every(p=>shown[p.a])){
   for(const [p,q]of g.boundary)paint([p,q,outer(q),outer(p)],'rgba('+rgb+',0.45)');
  }
  for(const p of g.polygons){if(!shown[p.a])continue;paint(p.points.map(outer),'rgba('+rgb+',0.32)');}
  // Cut views display the retained contact cells without a lead to a removed face.
  if(g.polygons.every(p=>shown[p.a])){
   c.strokeStyle='rgba('+rgb+',0.8)';c.lineWidth=1.1;c.beginPath();
   for(const [p,q]of g.boundary){const a=proj(outer(p)),b=proj(outer(q));c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);}c.stroke();
   const start=outer(g.anchor),end=start.slice();end[2]+=sign*Math.max(m.L*.14,Math.min(m.W,m.H)*.4);
   const a=proj(start),b=proj(end),width=5;
   c.lineCap='round';c.strokeStyle='rgba(40,50,56,.65)';c.lineWidth=width+2;c.beginPath();c.moveTo(...a.slice(0,2));c.lineTo(...b.slice(0,2));c.stroke();
   c.strokeStyle='rgba(175,190,196,.9)';c.lineWidth=width-2;c.stroke();
   c.fillStyle='rgb('+rgb+')';c.beginPath();c.arc(a[0],a[1],3,0,Math.PI*2);c.fill();
   c.fillStyle='#26343b';c.font='12px Helvetica, Arial, sans-serif';c.textAlign='center';c.textBaseline='bottom';c.fillText(label,b[0],b[1]-8);
  }
  c.restore();
 }
 return 'Contact area: '+notes.join(' | ')+' | schematic collars and leads';
}
