    const dimension=document.documentElement.dataset.dimension,storageKey='joule.workspace.'+dimension+'.v1';let restoring=false,saveTimer;
    const controls=()=>Array.from(document.querySelectorAll('input[id],select[id],textarea[id]')).filter(el=>!['file','button','submit'].includes(el.type)&&!el.id.startsWith('unified'));
    function captureSettings(){return {schema:'joule-workspace-1',dimension,fields:Object.fromEntries(controls().map(el=>[el.id,el.type==='checkbox'||el.type==='radio'?el.checked:el.value])),supplyMode:document.querySelector('.mode-btn.active')?.dataset.mode};}
    function restoreSettings(data){if(data?.schema!=='joule-workspace-1'||data.dimension!==dimension||!data.fields||typeof data.fields!=='object')throw Error('Choose a '+dimension.toUpperCase()+' settings file.');restoring=true;try{for(const el of controls()){if(!(el.id in data.fields))continue;const value=data.fields[el.id];if(el.type==='checkbox'||el.type==='radio')el.checked=!!value;else if(el.tagName==='SELECT'){if(Array.from(el.options).some(o=>o.value===String(value)))el.value=value;}else el.value=String(value);}document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===data.supplyMode));syncShape();updateAll();syncDynControls();}finally{restoring=false;}}
    const nav=document.createElement('nav');nav.className='unified-tabs';nav.setAttribute('aria-label','Workspace sections');nav.innerHTML='<button data-section="model" aria-selected="true">Model</button><button data-section="screening" aria-selected="false">Screening</button><button data-section="reference" aria-selected="false">Equations &amp; limits</button><div class="unified-actions"><button id="unifiedSave">Export settings</button><button id="unifiedLoad">Import settings</button><input id="unifiedFile" type="file" accept=".json" hidden></div>';document.body.prepend(nav);
    const stateNote=document.createElement('p');stateNote.className='workspace-note';stateNote.setAttribute('role','status');document.querySelector('main').prepend(stateNote);
    const showSection=name=>{for(const b of nav.querySelectorAll('[data-section]'))b.setAttribute('aria-selected',String(b.dataset.section===name));activateTab(name==='model'?(dimension==='2d'?'thermal2d':'calculator'):name);stateNote.textContent=dimension==='0d'?'Joule0D | One representative element temperature | Independent inputs and saved settings':'Joule2D | Axisymmetric r / z model | Rectangular elements use the stated equivalent cylinder';};
    nav.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>showSection(b.dataset.section));
    if(dimension==='2d'){
      const inputs=document.querySelector('#calculator .input-column'),target=document.querySelector('#thermal2d .t2d-inputs');const holder=document.createElement('div');holder.className='integrated-inputs';holder.append(inputs);target.prepend(holder);
      const study=document.createElement('div');study.className='study-switch';study.innerHTML='<button aria-pressed="true">Steady state</button><button aria-pressed="false">Transient / pulsed</button>';document.querySelector('main').insertBefore(study,$('thermal2d'));
      const buttons=study.querySelectorAll('button');buttons[0].onclick=()=>{activateTab('thermal2d');buttons[0].setAttribute('aria-pressed','true');buttons[1].setAttribute('aria-pressed','false');};buttons[1].onclick=()=>{activateTab('dynamic');buttons[0].setAttribute('aria-pressed','false');buttons[1].setAttribute('aria-pressed','true');};nav.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>{study.hidden=b.dataset.section!=='model';buttons[0].setAttribute('aria-pressed','true');buttons[1].setAttribute('aria-pressed','false');}));
      installFieldSweep();
    }else{
      const extra=document.querySelector('#thermal2d .t2d-inputs');document.querySelector('#calculator .input-column').append(extra);extra.style.border='0';extra.style.padding='0';for(const el of extra.querySelectorAll('.t2d-controls,#t2dProgress,.section-head-row'))el.hidden=true;
    }
    // Each document has its own memory and persistent settings namespace.
    for(const event of ['input','change','click'])document.addEventListener(event,e=>{if(restoring||!e.target.closest('input,select,textarea,.mode-btn'))return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(storageKey,JSON.stringify(captureSettings()));}catch{stateNote.textContent='Device storage unavailable | Export settings to retain this model.';}},250);});
    $('unifiedSave').onclick=()=>download('joule'+dimension+'-settings.json',JSON.stringify(captureSettings(),null,2));$('unifiedLoad').onclick=()=>$('unifiedFile').click();$('unifiedFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>2e6)throw Error('Settings file exceeds 2 MB.');restoreSettings(JSON.parse(await f.text()));localStorage.setItem(storageKey,JSON.stringify(captureSettings()));stateNote.textContent='Settings restored for Joule'+dimension.toUpperCase();}catch(err){stateNote.textContent=err.message;}finally{e.target.value='';}};
    try{const saved=localStorage.getItem(storageKey);if(saved)restoreSettings(JSON.parse(saved));}catch{stateNote.textContent='Saved settings could not be restored.';}
    const reference=$('reference'),original=document.createElement('details');original.className='audit';const summary=document.createElement('summary');summary.textContent='Derivations, material data and literature comparisons';original.append(summary);for(const node of Array.from(reference.children))original.append(node);reference.append(original);
    const scope=document.createElement('div');scope.className='card';scope.style.padding='24px';scope.innerHTML=dimension==='0d'?'<h2>Joule0D | Equations &amp; limits</h2><p>One element temperature determines resistance and heat loss. The operating current follows the selected supply mode and its voltage, current, power and current-density constraints.</p><p>R = ρ(T)L/A + 2R<sub>contact</sub><br>P<sub>bulk</sub> = I²R<sub>bulk</sub><br>P<sub>bulk</sub>(T<sub>ss</sub>) = Q<sub>loss</sub>(T<sub>ss</sub>)<br>mC<sub>p</sub>(T)dT/dt = P<sub>bulk</sub>(T) − Q<sub>loss</sub>(T)</p><p>Heat loss uses the selected enclosure, gap, wall, radiation and end conditions. This workspace reports a representative temperature and lumped heating estimates; it does not resolve an internal temperature field. Screening evaluates the same 0D model. Preset properties and maximum current densities retain the source engine assumptions.</p>':'<h2>Joule2D | Equations &amp; limits</h2><p>The source finite-volume operator resolves radial and axial heat conduction through the element, gap, wall, process gas and outside region. Electrical potential distributes the bulk heating budget.</p><p>∇ · (σ∇φ) = 0<br>ρC<sub>p</sub>∂T/∂t = ∇ · (k∇T) + q<sub>Joule</sub> − gas enthalpy transport</p><p>The supply resistance uses mean element temperature. Field dissipation is normalized to the operating-point bulk power. Helium transport is prescribed; momentum and pressure are not solved. Rectangular elements use an explicitly described surface-equivalent cylinder. Transient calculations retain the source backward-Euler operator and pulse integration. Screening solves an independent 2D field at every sampled point.</p>';
    reference.insertBefore(scope,original);showSection('model');

    // Move existing live nodes: their IDs and calculation bindings remain intact.
    function foldWorkspace(node,label){if(!node)return;const d=document.createElement('details');d.className='workspace-detail';const h=document.createElement('summary');h.textContent=label;node.before(d);d.append(h,node);return d;}
    if(dimension==='0d'){
      const visuals=document.querySelector('#calculator .top-visual-grid');
      const ramp=visuals?.children[1],metrics=document.querySelector('#calculator .kpi-grid');
      if(ramp&&metrics){metrics.after(ramp);foldWorkspace(ramp,'Heating curve | Illustrative response');}
      foldWorkspace(document.querySelector('#calculator .recommendation-card'),'Design assessment');
      foldWorkspace(document.querySelector('#calculator .diagnostic-card'),'Dimensionless diagnostics');
    }else{
      const checkpoints=document.querySelector('#thermal2d .t2d-map-grid > .card:nth-child(2)');
      const metrics=document.querySelector('#thermal2d .t2d-kpis');
      if(checkpoints&&metrics){metrics.after(checkpoints);foldWorkspace(checkpoints,'Calculated checkpoints');}
    }
    if(dimension==='2d'){
      const results=document.querySelector('#thermal2d .t2d-results');
      const rail=document.createElement('aside');rail.className='field-results-rail';rail.setAttribute('aria-label','Field results');
      for(const node of Array.from(results.children))if(!node.classList.contains('t2d-map-grid'))rail.append(node);
      results.append(rail);
      const table=document.createElement('table');table.className='metric-table';
      const body=document.createElement('tbody');table.append(body);
      for(const id of ['t2dIV','t2dResistance']){const row=$(id)?.closest('tr');if(row)body.append(row);}
      rail.querySelector('.t2d-kpis').after(table);
      // Analysis mode belongs to Model, below the shared section navigation.
      const map=$('thermalMap');
      function fitField(){
        const desktop=window.innerWidth>=1100;
        const shell=map.parentElement;
        const availableWidth=Math.max(1,shell.clientWidth-2);
        const availableHeight=desktop?Math.max(100,window.innerHeight-map.getBoundingClientRect().top-152):Math.min(620,window.innerHeight*.62);
        const scale=Math.min(availableWidth/map.width,availableHeight/map.height);
        map.style.setProperty('width',Math.floor(map.width*scale)+'px','important');
        map.style.setProperty('height',Math.floor(map.height*scale)+'px','important');
      }
      const resize=new ResizeObserver(()=>requestAnimationFrame(fitField));resize.observe(map.parentElement);
      new MutationObserver(()=>requestAnimationFrame(fitField)).observe(map,{attributes:true,attributeFilter:['width','height']});
      window.addEventListener('resize',fitField);nav.addEventListener('click',()=>requestAnimationFrame(fitField));requestAnimationFrame(fitField);
    }
