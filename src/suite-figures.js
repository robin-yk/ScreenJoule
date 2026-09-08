// Presentation adapters: reuse the existing samples and physical definitions.
// All ordinary axes use the shared 5-inch panel; extra legend space is external.
window.screenJouleFigureChecks=()=>[...scientificFigures].map(([id,f])=>({id,...Figure5.checkDimensions(f),textLabels:figureTextGate(f.svg())}));
function suiteLegend(f,items){
  f.height=Math.max(360,365+items.length*23);
  for(let i=0;i<items.length;i++){
    const [label,color,dash]=items[i],y=375+i*23;
    f.line(78,y,100,y,color,2.5,dash||'');f.text(109,y+4,label,14,'start');
    f.width=Math.max(f.width,125+label.length*7.6);
  }
}
function showSuiteFigure(id,f){
  Figure5.checkDimensions(f);
  const host=$(id);scientificFigures.set(id,f);
  if(host.tagName.toLowerCase()==='canvas'){mountFigure(id,f);host.style.setProperty('max-width',f.width/72*96+'px','important');}
  else{
    const parsed=new DOMParser().parseFromString(f.svg(),'image/svg+xml').documentElement;
    for(const a of ['viewBox','width','height','font-family','fill'])host.setAttribute(a,parsed.getAttribute(a));
    host.replaceChildren(...[...parsed.childNodes].map(n=>document.importNode(n,true)));
    host.style.cssText='display:block;width:100%;height:auto;max-width:'+f.width/72*96+'px;aspect-ratio:'+f.width+'/'+f.height;
  }
  if(!host.dataset.figureExports){
    host.dataset.figureExports='true';const row=document.createElement('div');row.className='exports';const status=document.createElement('p');status.className='note';
    for(const type of ['svg','png']){const b=document.createElement('button');b.type='button';b.textContent=type==='svg'?'Save SVG':'Save PNG | 600 dpi';b.onclick=()=>exportFigure(id,type,status);row.append(b);}
    host.after(row);row.after(status);
  }
}
function renderSuiteSweep(state,key,fields){
  const n=state.count,dx=(state.xs.at(-1)-state.xs[0])/(n-1),dy=(state.ys.at(-1)-state.ys[0])/(n-1);
  const label=k=>fields.find(f=>f[0]===k)[1];
  const f=Figure5.figure(Figure5.axis(state.xs[0],state.xs.at(-1)),Figure5.axis(state.ys[0],state.ys.at(-1)),label(state.x),label(state.y));
  const values=state.rows.filter(r=>!r.error&&Number.isFinite(r[key])).map(r=>r[key]),lo=Math.min(...values),hi=Math.max(...values);
  for(const r of state.rows){const x=f.x(r.x-dx/2),y=f.y(r.y+dy/2),w=f.x(r.x+dx/2)-x,h=f.y(r.y-dy/2)-y;
    if(r.error){f.line(x+2,y+2,x+w-2,y+h-2,'#c0392b');f.line(x+w-2,y+2,x+2,y+h-2,'#c0392b');}
    else f.rect(x,y,w,h,Figure5.viridis(hi===lo?.5:1-(r[key]-lo)/(hi-lo)));
  }
  f.frame();f.height=440;
  if(values.length){for(let i=0;i<100;i++)f.rect(78+i*2.6,367,2.7,8,Figure5.viridis(1-i/99));f.text(78,393,Figure5.number(lo),15,'start');f.text(338,393,Figure5.number(hi),15,'end');}
  f.text(208,420,$('unifiedOutput').selectedOptions[0].textContent,14);
  showSuiteFigure('unifiedSweepPlot',f);
}
renderHeatChart=function(r){
  const start=Math.max(1,Math.min(r.input.ambientK,r.input.gasK));
  const end=Math.min(6000,Math.max(r.input.targetK*1.18,finite(r.tss)?r.tss*1.12:r.input.targetK*1.6,start+300));
  const points=Array.from({length:90},(_,i)=>{const T=start+(end-start)*i/89;return {T,loss:Math.max(0,heatLoss(T,r.input,r.g)),available:operatingAt(T,r.input,r.g).power};});
  const cap=Math.max(r.power,r.requiredPower,...points.flatMap(p=>[p.loss,p.available]),1)*1.08;
  const f=Figure5.figure(Figure5.axis(0,cap),Figure5.axis(celsius(start),celsius(end)),'Power (W)','Temperature (°C)');
  f.path(points.map(p=>[f.x(p.loss),f.y(celsius(p.T))]),'#c0392b');
  f.path(points.map(p=>[f.x(p.available),f.y(celsius(p.T))]),'#444',2.5,'6 4');
  f.line(f.L,f.y(celsius(r.input.targetK)),f.R,f.y(celsius(r.input.targetK)),'#888',1.8,'2 3');
  if(finite(r.tss)&&r.tss>=start&&r.tss<=end)f.dot(f.x(operatingAt(r.tss,r.input,r.g).power),f.y(celsius(r.tss)),'#222');
  f.frame();suiteLegend(f,[['Heat loss','#c0392b'],['Available power','#444','6 4'],['Target temperature','#888','2 3']]);showSuiteFigure('heatChart',f);
};
renderRampChart=function(r){
  if(!finite(r.tss)||!finite(r.rampRate)||r.rampRate<=0||r.tss<=r.input.ambientK){$('rampChart').replaceChildren();scientificFigures.delete('rampChart');return;}
  const tau=(r.tss-r.input.ambientK)/r.rampRate,end=tau*5;
  const f=Figure5.figure(Figure5.axis(0,end/60),Figure5.axis(celsius(r.input.ambientK),celsius(r.tss)),'Time (min)','Temperature (°C)');
  f.path(Array.from({length:121},(_,i)=>{const t=end*i/120;return[f.x(t/60),f.y(celsius(r.tss-(r.tss-r.input.ambientK)*Math.exp(-t/tau)))];}),'#c0392b');
  const t95=tau*Math.log(20);f.dot(f.x(t95/60),f.y(celsius(r.tss-(r.tss-r.input.ambientK)*.05)),'#444');f.frame();
  suiteLegend(f,[['Illustrative relaxation','#c0392b'],['95% rise | '+format(t95/60)+' min','#444']]);showSuiteFigure('rampChart',f);
};
renderLogChart=function(svg,series,yKey,yLabel,xKey='x',xLabel='Electrical resistivity (Ω·cm)',referenceX=null,selected=null){
  const all=series.flatMap(s=>s.points).filter(p=>p[xKey]>0&&p[yKey]>0);if(!all.length)return;
  const lo=k=>Math.min(...all.map(p=>p[k])),hi=k=>Math.max(...all.map(p=>p[k]));
  const f=Figure5.figure(Figure5.axis(lo(xKey),Math.max(hi(xKey),lo(xKey)*10),true),Figure5.axis(lo(yKey),Math.max(hi(yKey),lo(yKey)*10),true),xLabel,yLabel),legend=[];
  series.forEach((s,i)=>{const col=Figure5.viridis(i/Math.max(1,series.length-1)),points=s.points.filter(p=>p[xKey]>0&&p[yKey]>0);f.path(points.map(p=>[f.x(p[xKey]),f.y(p[yKey])]),col);legend.push([s.name,col]);});
  if(referenceX>0){f.line(f.x(referenceX),f.T,f.x(referenceX),f.B,'#000',1.8,'6 4');legend.push(['Matched resistance','#000','6 4']);}
  if(selected?.x>0){const pos=Math.max(f.L,Math.min(f.R,f.x(selected.x)));f.line(pos,f.T,pos,f.B,'#888',1.8,'2 3');legend.push(['Current design','#888','2 3']);if(selected.y>0)f.dot(pos,f.y(selected.y),'#888');}
  f.frame();suiteLegend(f,legend);showSuiteFigure(svg.id,f);
};
drawDynChart=function(history,plan){
  if(!history.length)return;
  const low=Math.min(...history.map(h=>h.tMin)),high=Math.max(...history.map(h=>h.tMax)),pad=Math.max(1,(high-low)*.08);
  const end=Math.max(plan.steady?history.at(-1).t:plan.duration,1e-9);
  const f=Figure5.figure(Figure5.axis(0,end),Figure5.axis(celsius(low-pad),celsius(high+pad)),'Time (s)','Temperature (°C)');
  if(plan.drive==='pulse')for(let t=0;t<end;t+=plan.period)f.rect(f.x(t),f.T,f.x(Math.min(end,t+plan.period*plan.duty))-f.x(t),f.B-f.T,'#f2f2f2');
  const rows=[['tMin','Minimum'],['avgK','Mean'],['tMax','Maximum']];rows.forEach(([key],i)=>f.path(history.map(h=>[f.x(h.t),f.y(celsius(h[key]))]),Figure5.viridis(i/2)));f.frame();suiteLegend(f,rows.map(([,label],i)=>[label,Figure5.viridis(i/2)]));showSuiteFigure('dynChart',f);
};
