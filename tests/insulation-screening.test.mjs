import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessInsulation} from '../src/suite-upstream/insulation.js';
import {directSurfaceHeatLoss} from '../src/suite-upstream/solver.js';
const base={area:.01,power:100,targetC:800,ambientC:20,h:12,emissivity:.8,k:.1,maxMm:20};
test('inverse thickness closes existing surface heat balance',()=>{
 const r=assessInsulation(base);
 const loss=directSurfaceHeatLoss(1073.15,{commonBoundary:'insulated',surfaceResistance:r.resistance,ambientK:293.15,h:12,emissivity:.8},{surface:.01});
 assert(Math.abs(loss.total-100)<1e-6);
 assert(r.samples.every((v,i,a)=>i===0||v.tempC>a[i-1].tempC));
});
test('convection-only analytic result and process duty',()=>{
 const r=assessInsulation({...base,emissivity:0,power:50,duty:10});
 assert(Math.abs(r.outerC-(20+40/.01/12))<1e-8);
 assert(Math.abs(r.requiredMm-(800-r.outerC)/(40/.01)*.1*1000)<1e-8);
});
test('already hot reports no additional insulation, invalid duty rejected',()=>{
 assert.equal(assessInsulation({...base,targetC:21}).status,'no-insulation-needed');
 for(const change of [{duty:100},{k:0},{h:0},{area:0},{power:NaN},{targetC:10},{emissivity:2}])assert.throws(()=>assessInsulation({...base,...change}));
});
