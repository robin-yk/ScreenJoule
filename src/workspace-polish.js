// Presentation only: retain existing result nodes, solver inputs and listeners.
(() => {
  const dim=document.documentElement.dataset.dimension;
  const fold=(node,label)=>{if(!node)return;const d=document.createElement('details');d.className='workspace-detail';const s=document.createElement('summary');s.textContent=label;node.before(d);d.append(s,node);return d;};
  if(dim==='0d'){
    const visual=document.querySelector('.top-visual-grid');
    const strip=document.createElement('div');strip.className='sj-metrics';strip.setAttribute('aria-label','Operating point');
    for(const [id,label] of [['outI','Current'],['outV','Voltage'],['outP','Power'],['tssValue','Equilibrium temperature']]){
      const source=document.getElementById(id),item=document.createElement('div');item.innerHTML='<small>'+label+'</small><strong></strong>';strip.append(item);
      const sync=()=>item.querySelector('strong').textContent=source.textContent;sync();new MutationObserver(sync).observe(source,{childList:true,subtree:true,characterData:true});
    }
    visual.after(strip);
    const metrics=document.querySelector('#calculator .kpi-grid');
    const feasibility=document.getElementById('kpiFeasible');feasibility.classList.add('sj-feasibility');strip.after(feasibility);
    fold(metrics,'Heating estimates and diagnostics');
    fold(document.querySelector('#calculator .result-grid'),'Operating-point details');
  }
  if(dim==='2d'){
    const results=document.querySelector('#thermal2d .t2d-results'),rail=results.querySelector('.field-results-rail');
    const strip=document.createElement('div');strip.className='sj-metrics';strip.setAttribute('aria-label','Temperature-field results');
    for(const id of ['t2dAvg','t2dMax','t2dDelta','t2dPower'])strip.append(document.getElementById(id).closest('article'));
    results.querySelector('.t2d-map-grid').after(strip);
    fold(rail,'Heat balance, electrical results and model details');
  }
  if(!dim && document.getElementById('scene')){
    const metrics=document.querySelector('.metrics'),strip=document.createElement('div');strip.className='metrics sj-primary';
    for(const id of ['sR','sP','smax','savg']){const value=document.getElementById(id);if(value)strip.append(value.closest('.metric'));}
    metrics.before(strip);fold(metrics,'Time response and calculation time');
  }
})();
