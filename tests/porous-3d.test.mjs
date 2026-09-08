import {test} from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/engine.js';
const {solveModel}=engine;
const p={shape:'block',length:40,width:10,height:2,n:4,rho:1e-4,k:120,alpha:0,density:3210,cp:750,contact:100,offsetA:0,offsetB:0,mode:'P',command:2,vmax:150,imax:40,pmax:2000,ambient:25,sink:25,h:0,hc:0,emissivity:0,maxTemp:2000,study:'transient',duration:1,dt:.2,period:1,duty:1,initial:25};
test('porosity scales resistance and stored heat without changing envelope',()=>{
 const dense=solveModel(p), porous=solveModel({...p,porosity:.8});
 assert(Math.abs(porous.stats.R/dense.stats.R-5)<1e-8);
 assert.equal(porous.stats.volume,dense.stats.volume);
 assert(Math.abs((porous.stats.avg-25)/(dense.stats.avg-25)-5)<5e-5);
 assert(Math.abs(porous.stats.stored-2)<1e-5);
 assert.equal(p.density,3210);
});
test('effective resistivity is not corrected again, including tables',()=>{
 const a=solveModel({...p,porosity:.8});
 const b=solveModel({...p,porosity:.8,resistivityBasis:'effective',rho:5e-4});
 const c=solveModel({...p,porosity:.8,rhoCurve:[[0,1e-4],[2000,1e-4]]});
 assert(Math.abs(a.stats.R/b.stats.R-1)<1e-8);
 assert(Math.abs(a.stats.R/c.stats.R-1)<1e-8);
});
test('effective k retained and finite electrodes remain dense',()=>{
 const q={...p,study:'steady',h:100,hc:100,electrodeLength:5,electrodeRho:1.7e-8,electrodeK:400,electrodeCp:385,electrodeDensity:8960};
 const a=solveModel({...q,porosity:.6});
 const b=solveModel({...q,rho:p.rho/.4,density:p.density*.4});
 assert(Math.abs(a.stats.R/b.stats.R-1)<1e-8);
 assert(Math.abs(a.stats.avg-b.stats.avg)<1e-8);
});
test('invalid porosity rejected',()=>{
 for(const porosity of [-.1,1,NaN])assert.throws(()=>solveModel({...p,porosity}),/Porosity/);
});
