const fs=require('fs'),assert=require('assert'),root=__dirname+'/',F=require(root+'src/figures.js');
const solve=new Function(['flow','wall3d','engine'].map(n=>fs.readFileSync(root+'src/'+n+'.js','utf8')).join('\n')+';return solveModel;')();
const p={shape:'block',length:40,width:8,height:4,n:3,rho:1e-4,k:120,alpha:0,density:3210,cp:750,contact:100,offsetA:0,offsetB:0,mode:'P',command:2,vmax:50,imax:30,pmax:100,ambient:25,sink:25,h:15,emissivity:0,hc:2000,maxTemp:2000,study:'transient',initial:25,flow:false,duration:3,dt:.25,duty:1,period:1,slew:0};
const out=process.argv[2]||'/tmp/joule3d-figures';fs.mkdirSync(out,{recursive:true});const r=solve(p);for(const [key,f]of [['history',F.history(r)],['supply',F.supply(r)]]){console.log(key,F.checkDimensions(f));fs.writeFileSync(out+'/'+key+'.svg',f.svg());}
const {screeningMetrics,contourSegments}=require(root+'src/screening-core');
const state={base:p,x:{key:'command',scale:'linear'},y:{key:'length',scale:'log'},xs:[1,2,3,4,5],ys:[20,30,45,67.5,100],rows:[],created:new Date().toISOString()};for(const y of state.ys)for(const x of state.xs)state.rows.push({status:'ok',metrics:screeningMetrics(solve({...p,study:'steady',length:y,command:x}))});
const src=fs.readFileSync(root+'src/screening.js','utf8'),body=src.slice(src.indexOf('function screeningRender()'),src.indexOf('\nfunction screeningInspect()'));
const elements={sweepOutput:{value:'heaterMax'},sweepContours:{checked:true}};const $=id=>elements[id]||(elements[id]={});
new Function('Figure5','sweepState','$','contourSegments','mountFigure',`let sweepPlotBounds;const sweepSelected=-1,sweepWorker=null,fmt=String,screeningInspect=()=>{},figureLabel=s=>s,sweepOutputs=[['heaterMax','Heater maximum (°C)']],screeningAxisLabel=a=>a.key==='command'?'Supply setpoint (W)':'Total length (mm)';${body};screeningRender();`)(F,state,$,contourSegments,(id,f)=>{assert.equal(f.ya.lo,10);assert.equal(f.ya.hi,100);console.log('screening',F.checkDimensions(f));fs.writeFileSync(out+'/screening.svg',f.svg());});
assert.throws(()=>F.checkDimensions({...F.history(r),B:250}));
console.log('Actual solver figure fixtures and aspect-ratio rejection passed.');
