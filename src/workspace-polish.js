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

// Progressive disclosure. Move existing nodes so input handlers and exports survive.
(() => {
  const $=id=>document.getElementById(id), dim=document.documentElement.dataset.dimension;
  function group(nodes,title,before=nodes.find(Boolean)) {
    nodes=nodes.filter(Boolean); if(!nodes.length||!before)return;
    const d=document.createElement('details'),s=document.createElement('summary');
    d.className='workspace-detail sj-disclosure';s.textContent=title;d.append(s);
    before.before(d);nodes.forEach(n=>d.append(n));
    const changed=new Set();
    d.addEventListener('input',e=>{if(e.target.matches('input,select,textarea')){changed.add(e.target.id);s.textContent=title+' | edited';}});
    d.addEventListener('change',e=>{if(e.target.matches('input,select,textarea'))s.textContent=title+' | edited';});
    return d;
  }
  function mirror(ids,parent){
    const p=document.createElement('p');p.className='sj-design-summary';parent.before(p);
    const sync=()=>p.textContent=ids.map(id=>$(id)?.textContent.trim()).filter(Boolean).join(' | ');
    ids.forEach(id=>{if($(id))new MutationObserver(sync).observe($(id),{childList:true,subtree:true,characterData:true});});sync();return p;
  }
  if(dim){
    const porous=$('porousMode');
    if(porous){
      const d=group([porous.closest('.field'),$('shapeNote').closest('.field')],'Porous-body model and geometry notes');
      const sync=()=>d.querySelector('summary').textContent='Porous-body model | '+(porous.value==='effective'?'on':'off');
      porous.addEventListener('change',sync);sync();
    }
  }
  if(dim==='0d'){
    const strip=document.querySelector('.sj-metrics');
    // Keep the design decision and heating rate visible; electrical details remain below.
    strip.replaceChildren();
    for(const [id,label]of [['tssValue','Equilibrium temperature'],['rampValue','Initial heating rate'],['constraintValue','Active constraint'],['outP','Power']]){
      const item=document.createElement('div'),small=document.createElement('small'),value=document.createElement('strong');small.textContent=label;item.append(small,value);strip.append(item);
      const sync=()=>value.textContent=$(id).textContent;sync();new MutationObserver(sync).observe($(id),{childList:true,subtree:true,characterData:true});
    }
    document.querySelectorAll('#calculator details.audit').forEach(d=>d.open=false);
  }
  if(dim==='2d'){
    const imported=$('t2dMaterial').closest('article');
    mirror(['t2dMaterial','t2dDimensions','t2dFraction'],imported);
    group([imported],'Imported design details');
    for(const [id,title]of [['t2dWallK','Enclosure settings'],['t2dEndMode','End boundaries and contacts']])group([$(id).closest('article')],title);
    const solver=[...document.querySelectorAll('#thermal2d details')].find(d=>d.querySelector('#t2dMaxIter'));
    if(solver)solver.append($('t2dMeshLabel'));
    // Convergence state stays visible even when the detailed result rail is closed.
    const results=document.querySelector('#thermal2d .t2d-results');
    results.prepend($('t2dConverged'));
  }
  if(!dim&&$('scene')){
    group([$('benchmarkPreset').closest('label'),$('benchmarkState')],'Examples');
    const mesh=group([$('meshType').closest('label'),$('annularInputs'),$('plateMesh'),$('meshDimensions'),$('n').closest('label')],'Mesh settings', $('cadpanel'));
    const mat=$('material').closest('details');
    const materialNodes=[...mat.children].filter(n=>n.tagName!=='SUMMARY'&&!n.contains($('material')));
    group(materialNodes,'Edit properties and sources');
    const note=document.createElement('p');note.className='note';mat.querySelector('label').after(note);
    const materialNote=()=>{note.textContent=$('material').value==='custom'?'Custom properties':$('material').selectedOptions[0]?.textContent.includes('example')?'Illustrative properties':'Preset properties | source in details';};
    materialNote();new MutationObserver(materialNote).observe($('materialInfo'),{childList:true});
    for(const id of ['flow','wall','study']){const d=$(id).closest('details');d.open=false;
      const s=d.querySelector('summary'),title=s.textContent;
      const sync=()=>s.textContent=title+' | '+($(id).type==='checkbox'?($(id).checked?'on':'off'):$(id).selectedOptions[0].textContent);
      $(id).addEventListener('change',sync);sync();
    }
    const toolbar=$('solveTop').parentElement;
    group([$('cut').closest('label'),$('mesh').closest('label'),$('fit')],'View');
    toolbar.querySelector('.note')?.remove();
    const edit=group([$('pick').parentElement,$('probe')],'Inspect / edit electrodes');
    edit.addEventListener('toggle',()=>{if(!edit.open){$('pick').value='none';$('pick').dispatchEvent(new Event('change'));}});
    $('probe').textContent='Choose A or B to position an electrode.';
    const top=$('topStatus');
    const syncStatus=()=>{
      const raw=$('status').textContent;
      top.textContent=$('status').classList.contains('error')||!/solid cells/.test(raw)?raw:raw.split(' | ').slice(0,3).join(' | ');
      top.classList.toggle('error',$('status').classList.contains('error'));
    };
    new MutationObserver(syncStatus).observe($('status'),{childList:true,characterData:true,subtree:true,attributes:true});syncStatus();
    group([$('status').parentElement,$('budget')],'Calculation details');
    for(const id of ['supplyPlot','caseList','wallResults'])group([$(id).closest('section')],{'supplyPlot':'Supply operating envelope','caseList':'Saved designs','wallResults':'Wall results'}[id]);
    $('smax').previousElementSibling.textContent='Maximum temperature | °C';
    $('savg').previousElementSibling.textContent='Mean temperature | °C';
    $('smax').parentElement.title=$('savg').parentElement.title='All solid cells, including finite electrodes when enabled';
  }
})();
