// Common thermal envelope UI. Local reactor/electrode settings are preserved.
(()=>{
 const is3d=!!document.getElementById('rho'),get=id=>document.getElementById(id);
 const panel=document.createElement('details');panel.open=true;
 panel.className='common-thermal-panel';
 panel.innerHTML='<summary>Thermal surroundings</summary><label>Boundary<select id="commonBoundary"><option value="exposed">Exposed to surroundings</option><option value="insulated">Finite insulation layer</option><option value="local" selected>Local reactor / electrode settings</option></select></label><div id="commonExternal"><label>Outside air temperature (°C)<input id="outerAmbient" type="number" value="20" step="any"></label><label>External convection h (W/m² K)<input id="outerH" type="number" value="100" min="0.01" step="any"></label><label>Outer-surface emissivity<input id="outerEmissivity" type="number" value="0" min="0" max="1" step="0.1"></label><div id="wrapInputs"><label>Insulation thickness (mm)<input id="wrapThickness" type="number" value="5" min="0.01" step="any"></label><label>Insulation k (W/m K)<input id="wrapK" type="number" value="0.1" min="0.0001" step="any"></label></div><p class="note">Uniform equivalent layer on all external faces, including ends. Outer radiation uses the outside temperature. Constant area; insulation heat storage and resolved wall geometry are omitted. Use local settings for separate electrodes, walls or gas flow.</p></div>';
 if(is3d)get('material').closest('details').before(panel);else{boundaryLabel.before(panel);boundaryLabel.hidden=true;}
 const names=['commonBoundary','outerAmbient','outerH','outerEmissivity','wrapThickness','wrapK'];
 const read=()=>Object.fromEntries(names.map(id=>[id,id==='commonBoundary'?get(id).value:Number(get(id).value)]));
 function display(){const mode=get('commonBoundary').value;get('commonExternal').hidden=mode==='local';get('wrapInputs').hidden=mode!=='insulated';if(!is3d){window.sharedConvection=mode!=='local';if(mode!=='local'&&get('t2dHover'))get('t2dHover').textContent='Move over a cell to inspect the calculated solid temperature.';}}
 function check(v){if(v.commonBoundary==='local')return;
   if(!Number.isFinite(v.outerAmbient)||v.outerAmbient<=-273.15||!Number.isFinite(v.outerH)||v.outerH<=0||!Number.isFinite(v.outerEmissivity)||v.outerEmissivity<0||v.outerEmissivity>1)throw Error('Enter valid outside temperature, positive h and emissivity from 0 to 1.');
   if(v.commonBoundary==='insulated'&&(!Number.isFinite(v.wrapThickness)||v.wrapThickness<=0||!Number.isFinite(v.wrapK)||v.wrapK<=0))throw Error('Insulation thickness and conductivity must be finite and positive.');
 }
 if(is3d){keys.push(...names);strings.add('commonBoundary');const oldControls=controls;controls=function(){oldControls();display();};}
 else{
   const base=baseInputs;
   baseInputs=function(){const x=base(),v=read();check(v);if(v.commonBoundary!=='local')Object.assign(x,{commonBoundary:v.commonBoundary,surfaceResistance:v.commonBoundary==='insulated'?v.wrapThickness/1000/v.wrapK:0,ambientK:v.outerAmbient+273.15,gasK:v.outerAmbient+273.15,h:v.outerH,convection:true,emissivity:v.outerEmissivity});return x;};
 }
 names.forEach(id=>get(id).addEventListener('input',()=>{display();if(is3d)invalidate();else{try{updateAll();}catch(e){stateNote.textContent=e.message;}}}));
 display();
})();
