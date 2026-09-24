// One-point calibrated thermal reconstruction. Measured P and Q are inputs.
const fs=require('node:fs');
const {solveModel}=require('../src/engine');
const previous=require('../validation-literature.json').results.find(r=>r.name==='Zheng | 13.04 V').params;
const rows=[
 [100000,12.67,30.75,386.4,749,181],[100000,12.30,29.40,361.6,698,173],
 [100000,11.90,27.52,327.5,650,165],[100000,11.37,26.15,297.2,600,149],
 [100000,10.25,23.33,239.1,552,120],[150000,14.10,34.70,489.3,752,274],
 [150000,13.60,32.47,441.6,700,261],[150000,13.04,30.26,394.6,650,240],
 [150000,12.25,28.07,343.8,600,202],[150000,11,24.58,270.4,550,164]
];
function run(row,h,n=16){
 const [ghsv,V,I,P,T,Q]=row;
 const params={...previous,n,porosity:.88,resistivityBasis:'effective',density:3050,mode:'P',command:P,processDuty:Q,h,hc:h,emissivity:0};
 const r=solveModel(params);
 // End-adjacent solid-cell mean: proxy, not a resolved thermocouple/contact plate.
 const endC=r.mesh.termB.reduce((s,i)=>s+r.T[i],0)/r.mesh.termB.length;
 return {ghsv,V,I,P,Q,measuredC:T,endProxyC:endC,errorC:endC-T,meanC:r.stats.avg,maxC:r.stats.max,closure:r.stats.energyError,params};
}
const calibration=rows[7];let h=20,result;
for(let i=0;i<8;i++){
 result=run(calibration,h);
 console.log('calibration',i,h,result.endProxyC);
 if(Math.abs(result.errorC)<.01)break;
 h*=(result.endProxyC-20)/(calibration[4]-20);
}
if(Math.abs(result.errorC)>=.01)throw Error('Calibration failed');
const results=rows.map((row,i)=>{const r={...run(row,h),calibration:i===7};console.log(JSON.stringify({...r,params:undefined}));return r;});
const held=results.filter(r=>!r.calibration);
const report={source:'Zheng et al., AIChE Journal (2022), DOI 10.1002/aic.17620, Table 2 supplied by user',method:'Measured P and Q; uniform heater sink; fitted h on every external surface; no explicit enclosure or contact plates. End-cell mean is a Tdown proxy.',calibrationIndex:7,h,heldOutMAE:held.reduce((s,r)=>s+Math.abs(r.errorC),0)/held.length,heldOutMax:Math.max(...held.map(r=>Math.abs(r.errorC))),results};
fs.writeFileSync(__dirname+'/zheng-duty-check.json',JSON.stringify(report,null,2));
console.log('SUMMARY',JSON.stringify({h,MAE:report.heldOutMAE,max:report.heldOutMax}));
