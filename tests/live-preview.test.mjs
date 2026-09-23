import {test} from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/engine.js';
const p={shape:'tube',meshType:'annular',nr:3,nt:24,nz:18,length:30,width:12,bore:8,n:6,rho:1e-4,k:120,alpha:0,density:3210,cp:750,contact:100,offsetA:0,offsetB:0,mode:'P',command:10,vmax:150,imax:40,pmax:2000,ambient:25,sink:25,h:15,hc:2000,emissivity:.8,maxTemp:2000,study:'steady',initial:25};
test('live temperature snapshots preserve the converged solution',()=>{
 const plain=engine.solveModel(p),updates=[];
 const live=engine.solveModel({...p,livePreview:true},u=>{if(u.temperature)updates.push(u);});
 assert(updates.length>0);
 for(const u of updates){assert.equal(u.temperature.length,live.mesh.N);assert(u.temperature.every(Number.isFinite));assert(u.iteration>0);}
 assert.deepEqual(live.T,plain.T);
 assert.notDeepEqual(updates[0].temperature,live.T);
 assert(live.stats.energyError<1e-5);
});
test('ordinary solves omit field payloads',()=>{
 engine.solveModel(p,u=>assert.equal(u.temperature,undefined));
});
