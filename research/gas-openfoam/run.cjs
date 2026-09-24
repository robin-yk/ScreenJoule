const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const dir=__dirname;
const source=['flow.js','engine.js'].map(f=>fs.readFileSync(path.join(dir,'source',f),'utf8'));
const {solveModel}=new Function(source.join('\n')+';return {solveModel};')();
const report={sources:Object.fromEntries(['flow.js','engine.js'].map((f,i)=>[f,crypto.createHash('sha256').update(source[i]).digest('hex')])),rows:[]};
for(const level of [1,2])for(const flowRate of [1,10,100]){
 const p={shape:'block',length:40,width:10,height:2,n:3,nx:12*level,nz:24*level,rho:1e-4,k:20,alpha:0,density:3210,cp:750,contact:100,offsetA:0,offsetB:0,mode:'P',command:1,vmax:50,imax:30,pmax:100,ambient:25,sink:25,h:0,emissivity:0,hc:200,maxTemp:2000,study:'steady',initial:25,flow:true,wall:false,channelWidth:20,channelHeight:6,gasInlet:25,mu:1.8e-5,gasDensity:1.2,gasCp:1005,gasK:.026,flowRate,flowUnit:'actual',contactR:0,thermalR:0,porosity:0};
 const r=solveModel(p);
 assert(r.stats.energyError<1e-5);assert(r.gas.stats.massError<1e-8);
 assert(Math.abs(r.stats.volume-40*10*2*1e-9)<1e-12);
 const row={level,flowRate,input:p,mesh:[r.mesh.nx,r.mesh.ny,r.mesh.nz],stats:r.stats,gas:r.gas.stats,solidXYZ:r.mesh.xyz,T:Array.from(r.T),gasXYZ:r.gas.mesh.xyz,gasT:Array.from(r.gas.T),U:r.gas.U,pressure:Array.from(r.gas.pressure)};
 assert([...row.T,...row.gasT,...row.pressure].every(Number.isFinite));
 report.rows.push(row);fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report));
 console.log(JSON.stringify({level,flowRate,solid:r.stats.avg,gas:r.gas.stats.outlet,dp:r.gas.stats.dp,error:r.stats.energyError}));
}
