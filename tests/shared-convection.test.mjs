import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculate,solveThermal2D} from '../src/suite-upstream/solver.js';
test('shared convection cylinder agrees with lumped balance at small Biot number',()=>{
 const cfg={boundaryMode:'shared-convection',wallK:1,wallThickness:.001,gapK:.03,gap:.001,wallEmissivity:0,endK:293.15,endH:100,contactRho:0,maxIter:300,tolerance:1e-5,purge:false};
 const x={material:{name:'SiC',rhoOhmCm:.0555556,k:120,density:3210,cp:750,jmax:5e6},shape:'cylinder',volumeCm3:Math.PI*100*15/4000,aspectRatio:1.5,solidFraction:1,imax:40,vmax:150,pmax:10,ambientK:293.15,targetK:1273.15,emissivity:0,convection:true,h:100,gasK:293.15,biLimit:.01,enclosure:cfg};
 const z=calculate(x),r=solveThermal2D(x,z,cfg,x.material);
 assert(r.converged);assert(r.closure<1e-6);
 assert(Math.abs(z.tss-(293.15+10/(100*(Math.PI*.01*.015+2*Math.PI*.005**2))))<1e-6);
 assert(Math.abs(r.avgK-z.tss)<.3);
 assert(r.representedVolumeError<1e-12);
});
