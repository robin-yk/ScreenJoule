import {test} from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/engine.js';
const p={shape:'block',length:20,width:10,height:10,n:4,rho:.001,k:40,alpha:0,density:3050,cp:680,contact:100,offsetA:0,offsetB:0,mode:'P',command:10,vmax:150,imax:40,pmax:2000,ambient:20,sink:20,h:20,hc:20,emissivity:0,maxTemp:2000,study:'steady',initial:20};
test('steady process sink closes P = Q + external loss',()=>{
 const r=engine.solveModel({...p,processDuty:4}),net=engine.solveModel({...p,command:6});
 assert(Math.abs(r.stats.P-4-r.stats.ambient-r.stats.contacts)<1e-5);
 assert(Math.abs(r.stats.avg-net.stats.avg)<1e-5);
 assert(r.stats.energyError<1e-6);
});
test('prescribed duty rejects unsupported transient or gas coupling',()=>{
 for(const change of [{processDuty:-1},{processDuty:1,study:'transient'},{processDuty:1,flow:true}])assert.throws(()=>engine.solveModel({...p,...change}),/duty/);
});
