const normalBaseInputs=baseInputs,normal2DConfig=get2DConfig;
let sharedPower=null;
get2DConfig=function(){const cfg=normal2DConfig();return window.sharedConvection?{...cfg,boundaryMode:'shared-convection',purge:false,contactRho:0,porosityContrast:0}:cfg;};
baseInputs=function(){const x=normalBaseInputs();if(window.sharedConvection){x.material={...x.material,rhoTable:undefined,kTable:undefined,cpTable:undefined};x.emissivity=0;x.convection=true;x.gasK=x.ambientK;}if(sharedPower!==null)x.pmax=Math.min(x.pmax,sharedPower);return x;};
const powerLabel=document.createElement('label');powerLabel.className='field full';powerLabel.textContent='Power setpoint (W)';
const powerInput=document.createElement('input');powerInput.type='number';powerInput.min='0';powerInput.placeholder='Supply limit';powerInput.id='sharedPower';powerLabel.append(powerInput);$('pmax').closest('.field').after(powerLabel);
powerInput.addEventListener('input',()=>{sharedPower=powerInput.value===''?null:Math.max(0,Number(powerInput.value));updateAll();});
const boundaryLabel=document.createElement('label');boundaryLabel.textContent='Thermal boundary';const boundarySelect=document.createElement('select');boundarySelect.innerHTML='<option value="direct">Direct convection</option><option value="enclosure">Reactor enclosure</option>';boundaryLabel.append(boundarySelect);powerLabel.after(boundaryLabel);
boundarySelect.onchange=()=>{window.sharedConvection=boundarySelect.value==='direct';stateNote.textContent=window.sharedConvection?'Shared heater | Direct convection, no radiation':'Shared heater | Local enclosure boundaries';updateAll();};
