// Explicit comparison mode; normal enclosure settings remain unchanged.
const normalBaseInputs=baseInputs,normal2DConfig=get2DConfig;
get2DConfig=function(){const cfg=normal2DConfig();return window.sharedConvection?{...cfg,boundaryMode:'shared-convection',purge:false,contactRho:0,porosityContrast:0}:cfg;};
baseInputs=function(){const x=normalBaseInputs();if(window.sharedConvection){x.material={...x.material,rhoTable:undefined,kTable:undefined,cpTable:undefined};x.emissivity=0;x.convection=true;x.gasK=x.ambientK;}return x;};
window.screenJouleShared=async function(c){
  window.sharedConvection=true;
  clearTimeout(saveTimer);
  const values={shape:'cylinder',voidFraction:0,nominalVolume:Math.PI*c.diameter**2*c.length/4000,aspectRatio:c.length/c.diameter,rhoUnit:'ohm-cm',rhoValue:0.0555556,thermalK:120,density:3210,cp:750,jmax:5e6,imax:40,vmax:150,pmax:c.power,ambientC:20,gasC:20,hConv:100,emissivity:0,t2dContactRho:0,t2dPorosityContrast:0};
  for(const [id,v]of Object.entries(values))$(id).value=v;
  $('convection').checked=true;document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode==='auto'));
  syncShape();showSection('model');
  stateNote.textContent='Shared cylinder | Constant SiC properties | h = 100 W/m²K on all surfaces | No radiation, wall or gas flow | Reload to leave comparison mode';
  await updateAll();if(dimension==='2d')await solveSelected2D(false);
};
// Comparison inputs must not overwrite the user's saved reactor setup.
$('unifiedSave').addEventListener('click',e=>{if(window.sharedConvection){e.stopImmediatePropagation();alert('Shared comparison mode is session-only. Use the Shared comparison case controls to reproduce it.');}},true);
