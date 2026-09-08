let shared3DInitialized=false;
window.screenJouleShared=async function(c){
  if(worker){worker.terminate();solverWorker=null;worker=null;setBusy(false);}
  const initial=shared3DInitialized?{}:{shape:'rod',meshType:'cartesian',bore:0,nx:32,ny:32,nz:48,alpha:0,rhoCurve:[],kCurve:[],cpCurve:[],contact:100,offsetA:0,offsetB:0,electrodeLength:0,contactR:0,thermalR:0,flow:false,wall:false,h:100,hc:100,emissivity:0,ambient:20,sink:20,study:'steady',parts:[],triangles:null,jlimit:0};
  loadParameters({...params(),...initial,length:c.length,width:c.diameter,height:c.diameter,rho:c.rho,k:c.k,density:c.density,cp:c.cp,mode:c.mode,command:c.command,imax:c.imax,vmax:c.vmax,pmax:c.pmax});
  shared3DInitialized=true;
};
window.screenJouleCapture=()=>{
 const p=params();if(p.shape!=='rod')return {unsupported:'This geometry is 3D-only. Select Solid cylinder to share with 0D / 2D.'};
 return {length:p.length,diameter:p.width,rho:p.rho,k:p.k,density:p.density,cp:p.cp,mode:p.mode,command:p.command,imax:p.imax,vmax:p.vmax,pmax:p.pmax};
};
