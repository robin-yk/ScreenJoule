// Common starting case: every workspace opens on the same porous SiC foam bar.
// A square bar is exact on the 3D Cartesian grid, so all three models see the same surface area.
// Workspaces stay independent afterwards; nothing is transferred on tab changes.
const DEFAULT_FOAM={
 length:30,width:8,height:8,porosity:.5,
 rhoSkeleton:.000555556,kEffective:60,densitySkeleton:3210,cp:750,
 power:60,vmax:150,imax:40,pmax:2000,
 outerAmbient:20,outerH:12,outerEmissivity:.9
};
(()=>{
 const c=DEFAULT_FOAM,is3d=typeof loadParameters==='function';
 if(is3d){
  loadParameters({...params(),shape:'block',meshType:'cartesian',bore:0,nx:12,ny:12,nz:45,
   length:c.length,width:c.width,height:c.height,
   porosity:c.porosity,resistivityBasis:'skeleton',rho:c.rhoSkeleton,alpha:0,k:c.kEffective,density:c.densitySkeleton,cp:c.cp,
   rhoCurve:[],kCurve:[],cpCurve:[],contact:100,offsetA:0,offsetB:0,electrodeLength:0,contactR:0,thermalR:0,
   mode:'P',command:c.power,vmax:c.vmax,imax:c.imax,pmax:c.pmax,
   flow:false,wall:false,study:'steady',parts:[],triangles:null,jlimit:0,
   commonBoundary:'exposed',outerAmbient:c.outerAmbient,outerH:c.outerH,outerEmissivity:c.outerEmissivity});
  status('Default case | Porous SiC foam bar, '+c.length+' × '+c.width+' × '+c.height+' mm, '+c.power+' W, exposed surroundings');
  return;
 }
 let saved=null;try{saved=localStorage.getItem(storageKey);}catch{}
 if(saved){try{restoreSettings(JSON.parse(saved));return;}catch{stateNote.textContent='Saved settings could not be restored.';}}
 const values={shape:'box',boxLength:c.length,boxWidth:c.width,boxHeight:c.height,voidFraction:c.porosity,porousMode:'effective',effectiveK:c.kEffective,
  rhoUnit:'ohm-cm',rhoValue:c.rhoSkeleton*100,thermalK:c.kEffective,density:c.densitySkeleton,cp:c.cp,
  imax:c.imax,vmax:c.vmax,pmax:c.pmax,sharedPower:c.power,
  commonBoundary:'exposed',outerAmbient:c.outerAmbient,outerH:c.outerH,outerEmissivity:c.outerEmissivity};
 restoring=true;
 try{
  for(const [id,v]of Object.entries(values))$(id).value=v;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode==='auto'));
  syncShape();
  $('porousMode').dispatchEvent(new Event('change'));
  for(const id of ['commonBoundary','sharedPower'])$(id).dispatchEvent(new Event('input'));
 }finally{restoring=false;}
 stateNote.textContent='Default case | Porous SiC foam bar, '+c.length+' × '+c.width+' × '+c.height+' mm, '+c.power+' W, exposed surroundings';
 Promise.resolve(updateAll()).then(()=>{if(dimension==='2d')return solveSelected2D(false);}).catch(e=>{stateNote.textContent=e.message;});
})();
