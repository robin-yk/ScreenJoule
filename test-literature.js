const assert=require('assert/strict'),d=require('./validation-literature.json');
assert.equal(d.results.length,10);
for(const r of d.results){assert.ok(!r.error,r.name+': '+r.error);assert.ok(r.stats.energyError<1e-6,r.name);assert.ok(r.stats.chargeError<1e-6,r.name);assert.ok(Number.isFinite(r.stats.max));}
const w=d.results[1];assert.ok(Math.abs(w.stats.R/(1.45e-6*.5/(Math.PI/4*(.006**2-.0053**2)))-1)<.03);
console.log('10 executed cases: finite outputs, charge and energy balance passed; no experimental agreement asserted.');
