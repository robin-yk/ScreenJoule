import {test} from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/engine.js';
const {solveModel,makeGrid}=engine;
const rod={shape:'rod',meshType:'annular',length:40,width:10,bore:0,n:4,rho:1e-4,k:20,alpha:0,density:3210,cp:750,contact:100,offsetA:0,offsetB:0,mode:'P',command:1,vmax:50,imax:30,pmax:100,ambient:25,sink:25,h:0,hc:2000,emissivity:0,maxTemp:2000,study:'steady',initial:25,flow:false,wall:false,contactR:0,thermalR:0,porosity:0,reuse:false};

test('solid annular grid keeps exact cylinder volume, surface and resistance',()=>{
 const m=makeGrid({...rod,nr:6,nt:24,nz:30});
 const volume=m.volumes.reduce((s,v)=>s+v,0),R=5e-3,L=.04;
 assert(Math.abs(volume/(Math.PI*R*R*L)-1)<1e-12);
 const lateral=m.faces.filter(f=>f[1]===0).reduce((s,f)=>s+f[4],0);
 assert(Math.abs(lateral/(2*Math.PI*R*L)-1)<1e-12);
 const r=solveModel({...rod,nr:6,nt:24,nz:30});
 assert(Math.abs(r.stats.R/(1e-4*L/(Math.PI*R*R))-1)<1e-9);
});

test('solid annular grid converges at second order to the end-cooled analytic profile',()=>{
 const R=5e-3,L=.04,A=Math.PI*R*R,q=1/(A*L),T=z=>25+1/(2*A*2000)+q/(2*20)*(L*L/4-z*z);
 const rms=([nr,nt,nz])=>{const r=solveModel({...rod,nr,nt,nz});let s=0;r.mesh.xyz.forEach((x,i)=>{s+=(r.T[i]-T(x[2]))**2;});assert(r.stats.energyError<1e-6);return Math.sqrt(s/r.T.length);};
 const e1=rms([4,16,24]),e2=rms([8,32,48]);
 assert(Math.log2(e1/e2)>1.9,'observed order '+Math.log2(e1/e2));
});

test('solid annular cylinder matches the lumped balance at small Biot number',()=>{
 const p={...rod,length:15,rho:.000555556,k:120,command:10,vmax:150,imax:40,pmax:2000,ambient:20,sink:20,h:100,hc:100,nr:8,nt:48,nz:30};
 const r=solveModel(p),area=Math.PI*.01*.015+2*Math.PI*.005**2;
 assert(Math.abs(r.stats.avg-(20+10/(100*area)))<0.5);
});

test('solid annular grid resolves an offset partial electrode with energy closure',()=>{
 const r=solveModel({...rod,nr:6,nt:32,nz:30,contact:40,offsetA:-50,offsetB:-50,h:50,emissivity:.8,command:20});
 assert(r.stats.energyError<1e-6);
 assert(r.stats.max-r.stats.min>1);
});
