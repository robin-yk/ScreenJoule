// Common starting case: every workspace opens on the same porous SiC foam cylinder.
// 3D uses the solid annular grid, which keeps the exact cylinder surface area.
// Workspaces stay independent afterwards; nothing is transferred on tab changes.
const DEFAULT_FOAM={
 length:30,diameter:10,porosity:.5,
 rhoSkeleton:.000555556,kEffective:60,densitySkeleton:3210,cp:750,
 power:60,vmax:150,imax:40,pmax:2000,
 outerAmbient:20,outerH:12,outerEmissivity:.9
};
(()=>{
 const c=DEFAULT_FOAM,is3d=typeof loadParameters==='function';
 if(is3d){
  loadParameters({...params(),shape:'rod',meshType:'annular',bore:0,nr:8,nt:48,nz:45,
   length:c.length,width:c.diameter,height:c.diameter,
   porosity:c.porosity,resistivityBasis:'skeleton',rho:c.rhoSkeleton,alpha:0,k:c.kEffective,density:c.densitySkeleton,cp:c.cp,
   rhoCurve:[],kCurve:[],cpCurve:[],contact:100,offsetA:0,offsetB:0,electrodeLength:0,contactR:0,thermalR:0,
   mode:'P',command:c.power,vmax:c.vmax,imax:c.imax,pmax:c.pmax,
   flow:false,wall:false,study:'steady',parts:[],triangles:null,jlimit:0,
   commonBoundary:'exposed',outerAmbient:c.outerAmbient,outerH:c.outerH,outerEmissivity:c.outerEmissivity});
  status('Default case: porous SiC foam cylinder, Ø'+c.diameter+' × '+c.length+' mm, '+c.power+' W, exposed surroundings');
  return;
 }
 let saved=null;try{saved=localStorage.getItem(storageKey);}catch{}
 if(saved){try{restoreSettings(JSON.parse(saved));return;}catch{stateNote.textContent='Saved settings could not be restored.';}}
 const values={shape:'cylinder',nominalVolume:Number((Math.PI*c.diameter**2*c.length/4000).toFixed(4)),aspectRatio:c.length/c.diameter,voidFraction:c.porosity,porousMode:'effective',effectiveK:c.kEffective,
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
 stateNote.textContent='Default case: porous SiC foam cylinder, Ø'+c.diameter+' × '+c.length+' mm, '+c.power+' W, exposed surroundings';
 Promise.resolve(updateAll()).then(()=>{if(dimension==='2d')return solveSelected2D(false);}).catch(e=>{stateNote.textContent=e.message;});
})();
