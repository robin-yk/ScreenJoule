window.screenJouleShared=async function(c){
  if(worker)throw Error('3D is calculating. Try again after it finishes.');
  loadParameters({...params(),shape:'rod',meshType:'cartesian',length:c.length,width:c.diameter,height:c.diameter,bore:0,nx:32,ny:32,nz:48,rho:0.000555556,k:120,density:3210,cp:750,alpha:0,rhoCurve:[],kCurve:[],cpCurve:[],contact:100,offsetA:0,offsetB:0,electrodeLength:0,contactR:0,thermalR:0,flow:false,wall:false,h:100,hc:100,emissivity:0,ambient:20,sink:20,mode:'P',command:c.power,imax:40,vmax:150,pmax:2000,study:'steady',parts:[],triangles:null,jlimit:0,materialSource:'Shared cylinder | Constant SiC proxy | h=100 W/m²K on every surface; no radiation, wall or gas flow'});
};
