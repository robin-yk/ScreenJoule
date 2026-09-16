import {test} from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/engine.js';
import {directSurfaceHeatLoss,commonSurfaceConductance} from '../src/suite-upstream/solver.js';
const p={shape:'block',length:20,width:10,height:10,n:4,rho:.001,k:40,alpha:0,density:3050,cp:680,contact:100,offsetA:0,offsetB:0,mode:'P',command:10,vmax:150,imax:40,pmax:2000,ambient:20,sink:20,h:100,hc:100,emissivity:0,maxTemp:3000,study:'steady',initial:20,commonBoundary:'exposed',outerAmbient:20,outerH:100,outerEmissivity:0,wrapThickness:5,wrapK:.1};
test('insulation increases steady temperature at fixed power; zero-wrap retains old boundary',()=>{
 const exposed=engine.solveModel(p),local=engine.solveModel({...p,commonBoundary:'local'}),wrapped=engine.solveModel({...p,commonBoundary:'insulated'});
 assert(Math.abs(exposed.stats.avg-local.stats.avg)<1e-6);
 assert(wrapped.stats.avg>exposed.stats.avg);
 assert(wrapped.stats.energyError<1e-6);
 const area=.001,expectedRise=10/area*(.005/.1+1/100);
 assert(Math.abs(wrapped.stats.avg-20-expectedRise)<2);
});
test('surface resistance conserves outer radiation and convection',()=>{
 const x={commonBoundary:'insulated',surfaceResistance:.05,ambientK:293.15,h:20,emissivity:.8};
 const T=1000,u=commonSurfaceConductance(T,x),q=u*(T-x.ambientK),s=T-q*.05;
 assert(Math.abs(q-(x.h*(s-x.ambientK)+x.emissivity*5.670374419e-8*(s**4-x.ambientK**4)))<.01);
 assert.equal(directSurfaceHeatLoss(T,x,{surface:2}).total,2*q);
});
test('insulation refuses infinite resistance or zero exterior h',()=>{
 for(const change of [{wrapK:0},{wrapThickness:Infinity},{outerH:0}])assert.throws(()=>engine.solveModel({...p,commonBoundary:'insulated',...change}));
});
