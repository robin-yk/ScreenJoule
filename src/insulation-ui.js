// Separate 0D design aid: never silently replaces the active reactor boundaries.
(()=>{
 if(document.documentElement.dataset.dimension!=='0d')return;
 const host=document.querySelector('.common-thermal-panel');if(!host)return;
 const box=document.createElement('details');box.className='common-thermal-panel';box.style.gridColumn='1 / -1';
 box.innerHTML=`<summary>Insulation screening</summary>
 <p class="note">Uses the current element envelope area. Fixed delivered heater power; finite equivalent layer on all faces. Supply limits are evaluated separately in the main model.</p>
 <label>Mode<select id="insMode"><option value="design">Target-temperature design</option><option value="estimate">Measured-temperature heat-loss estimate</option></select></label>
 <label>Delivered heater power (W)<input id="insPower" type="number" value="100" min="0" step="any"></label>
 <label>Process + gas heat duty (W)<input id="insDuty" type="number" value="0" min="0" step="any"></label>
 <label>Target / measured temperature (°C)<input id="insTarget" type="number" value="800" step="any"></label>
 <label>Outside temperature (°C)<input id="insAmbient" type="number" value="20" step="any"></label>
 <label>External h (W/m² K)<input id="insH" type="number" value="12" min="0" step="any"></label>
 <label>Outer-surface emissivity<input id="insEps" type="number" value="0.8" min="0" max="1" step="any"></label>
 <label>Assumed insulation k (W/m K)<input id="insK" type="number" value="0.1" min="0" step="any"></label>
 <label>Plot thickness range (mm)<input id="insRange" type="number" value="20" min="0" step="any"></label>
 <button type="button" id="insRun">Evaluate insulation</button>
 <div id="insResult" role="status" aria-live="polite"></div>
 <p class="note">Equivalent constant-area resistance, not a resolved thick shell. Separate from local walls and electrodes. Enter power delivered to the element after lead/contact losses. Estimated resistance can include unmodeled losses; inferred thickness depends on assumed k. Check material temperature limits independently.</p>`;
 host.after(box);
 const el=id=>box.querySelector('#'+id),val=id=>Number(el(id).value),fmt=x=>Number(x.toPrecision(4)).toString();
 el('insRun').addEventListener('click',async()=>{
  try{
   const {assessInsulation}=await import('./insulation.js');
   const x=baseInputs(),g=geometry(x);
   if(!Number.isFinite(g.surface)||g.surface<=0)throw Error('Enter valid element dimensions first.');
   const r=assessInsulation({area:g.surface,power:val('insPower'),duty:val('insDuty'),targetC:val('insTarget'),ambientC:val('insAmbient'),h:val('insH'),emissivity:val('insEps'),k:val('insK'),maxMm:val('insRange')});
   const inferred=el('insMode').value==='estimate';
   const maxT=Math.max(...r.samples.map(p=>p.tempC),val('insTarget')),minT=Math.min(r.outerC,val('insTarget'));
   const xx=v=>65+v/val('insRange')*440,yy=v=>430-(v-minT)/Math.max(1,maxT-minT)*370;
   const points=r.samples.map(p=>`${xx(p.mm)},${yy(p.tempC)}`).join(' ');
   const ticks=Array.from({length:5},(_,i)=>{const mm=val('insRange')*i/4,t=minT+(maxT-minT)*i/4;return `<text x="${xx(mm)}" y="455" text-anchor="middle">${fmt(mm)}</text><text x="58" y="${yy(t)+4}" text-anchor="end">${fmt(t)}</text>`;}).join('');
   el('insResult').innerHTML=`<p>Envelope area: ${fmt(g.surface*1e4)} cm². Net heating: ${fmt(r.netPower)} W</p><p>${r.status==='no-insulation-needed'?'Exposed surroundings already reach or exceed this temperature. Reduce power or increase cooling.':`${inferred?'Estimated equivalent':'Required equivalent'} thickness: <strong>${fmt(r.requiredMm)} mm</strong> | Resistance: ${fmt(r.resistance)} m² K/W`}</p><p>Exposed power needed at this temperature: ${fmt(r.exposedPower)} W. Predicted outside surface: ${fmt(r.outerC)} °C.</p>
   <svg viewBox="0 0 540 480" style="width:100%;min-height:480px" role="img" aria-label="Temperature versus equivalent insulation thickness at fixed delivered power"><path d="M65 50V430H505" fill="none" stroke="currentColor"/><polyline points="${points}" fill="none" stroke="#bc6428" stroke-width="2"/><path d="M65 ${yy(val('insTarget'))}H505" stroke="#555" stroke-dasharray="5 4"/><text x="280" y="477" text-anchor="middle">Equivalent thickness (mm)</text><text x="16" y="240" transform="rotate(-90 16 240)" text-anchor="middle">Temperature (°C)</text>${ticks}</svg><p class="note">Dashed: target / measured temperature. Solid: fixed-power estimate; not a material operating rating. ${r.requiredMm>val('insRange')?'Required thickness exceeds the displayed range.':''}</p>`;
  }catch(e){el('insResult').textContent=e.message;}
 });
})();
