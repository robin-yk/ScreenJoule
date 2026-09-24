/* Geometry and constant-property incompressible Stokes flow, staggered MAC grid. */
function cadContains(parts,x,y,z){
  if(!Array.isArray(parts)||!parts.length)throw Error('Add CAD parts first.');let inside=false;
  for(const a of parts){const q=[x-(a.x||0),y-(a.y||0),z-(a.z||0)];const hit=a.type==='cylinder'?Math.hypot(q[0],q[1])<=a.diameter/2&&Math.abs(q[2])<=a.length/2:Math.abs(q[0])<=a.width/2&&Math.abs(q[1])<=a.height/2&&Math.abs(q[2])<=a.length/2;inside=a.op==='subtract'?inside&&!hit:inside||hit;}return inside;
}
const stlRayCache=new WeakMap();
function stlContains(triangles,x,y,z){
  if(!triangles?.length)throw Error('Import a closed STL first.');let cache=stlRayCache.get(triangles);if(!cache){cache=new Map();stlRayCache.set(triangles,cache);}const key=y+','+z;if(cache.has(key))return cache.get(key).filter(v=>v>x+1e-10).length%2===1;let crossings=[];
  for(const t of triangles){const [a,b,c]=t,den=(b[2]-c[2])*(a[1]-c[1])+(c[1]-b[1])*(a[2]-c[2]);if(Math.abs(den)<1e-14)continue;
    const u=((b[2]-c[2])*(y-c[1])+(c[1]-b[1])*(z-c[2]))/den,v=((c[2]-a[2])*(y-c[1])+(a[1]-c[1])*(z-c[2]))/den;
    if(u>=-1e-10&&v>=-1e-10&&u+v<=1+1e-10){const hit=u*a[0]+v*b[0]+(1-u-v)*c[0];crossings.push(hit);}}
  crossings.sort((a,b)=>a-b);const unique=crossings.filter((v,i)=>i===0||v-crossings[i-1]>1e-8);cache.set(key,unique);return unique.filter(v=>v>x+1e-10).length%2===1;
}
function parseSTL(buffer){
  const view=new DataView(buffer),tri=[];const count=buffer.byteLength>=84?view.getUint32(80,true):0;
  if(count>0&&84+count*50===buffer.byteLength){if(count>20000)throw Error('STL limit: 20,000 triangles.');for(let i=0;i<count;i++){const t=[];for(let j=0;j<3;j++)t.push([0,1,2].map(k=>view.getFloat32(84+i*50+12+j*12+k*4,true)));tri.push(t);}}
  else{const text=new TextDecoder().decode(buffer),matches=[...text.matchAll(/vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g)];if(matches.length%3||!matches.length||matches.length>60000)throw Error('Invalid ASCII STL or triangle limit exceeded.');for(let i=0;i<matches.length;i+=3)tri.push(matches.slice(i,i+3).map(m=>m.slice(1).map(Number)));}
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const t of tri)for(const v of t)for(let k=0;k<3;k++){if(!Number.isFinite(v[k]))throw Error('Nonfinite STL coordinate.');lo[k]=Math.min(lo[k],v[k]);hi[k]=Math.max(hi[k],v[k]);}
  if(hi.some((v,k)=>v-lo[k]<=0))throw Error('STL must enclose a 3D volume.');
  const normalized=tri.map(t=>t.map(v=>v.map((a,k)=>(a-(hi[k]+lo[k])/2)/(hi[k]-lo[k]))));const edges=new Map();
  for(const t of normalized)for(let j=0;j<3;j++){const key=[t[j],t[(j+1)%3]].map(v=>v.map(x=>x.toFixed(7)).join(',')).sort().join('|');edges.set(key,(edges.get(key)||0)+1);}
  if([...edges.values()].some(v=>v!==2))throw Error('STL is open or non-manifold. Export a closed solid mesh.');return {triangles:normalized,dimensions:hi.map((v,k)=>v-lo[k])};
}
function pcgOperator(mul,b,diagonal,tol=1e-8,max=700){
  const n=b.length,x=new Float64Array(n),r=Float64Array.from(b),z=new Float64Array(n),d=new Float64Array(n);let rz=0,norm=0;
  for(let i=0;i<n;i++){z[i]=d[i]=r[i]/diagonal[i];rz+=r[i]*z[i];norm+=b[i]*b[i];}if(norm===0)return x;
  for(let it=0;it<max;it++){const ad=mul(d);let dot=0;for(let i=0;i<n;i++)dot+=d[i]*ad[i];if(!(dot>0))throw Error('Stokes pressure operator is singular. Check for closed gas cavities.');const alpha=rz/dot;let next=0,err=0;
    for(let i=0;i<n;i++){x[i]+=alpha*d[i];r[i]-=alpha*ad[i];z[i]=r[i]/diagonal[i];next+=r[i]*z[i];err+=r[i]*r[i];}if(err<norm*tol*tol)return x;for(let i=0;i<n;i++)d[i]=z[i]+next/rz*d[i];rz=next;
  }throw Error('Stokes pressure solve did not converge.');
}
function solveFlow(p,m,progress=()=>{}){
  if(!Number.isFinite(p.gasInlet)||p.gasInlet<=-273.15)throw Error('Gas inlet temperature must exceed absolute zero.');
  if(![p.mu,p.gasDensity,p.gasCp,p.gasK,p.flowRate].every(x=>Number.isFinite(x)&&x>0))throw Error('Gas properties and flow rate must be positive.');
  const {nx,ny,nz,d,area,vol}=m,id=(i,j,k)=>(k*ny+j)*nx+i,fluidMap=new Int32Array(nx*ny*nz).fill(-1),xyz=[],ijk=[];
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if(m.map[id(i,j,k)]<0&&(!m.wall3d||(m.wall3d.map[id(i,j,k)]<0&&!m.wall3d.outside[id(i,j,k)]))){fluidMap[id(i,j,k)]=xyz.length;ijk.push([i,j,k]);xyz.push([(i+.5)*d[0]-m.W/2,(j+.5)*d[1]-m.H/2,(k+.5)*d[2]-m.L/2]);}
  if(!xyz.length)throw Error('No gas cells.');
  const n=xyz.length,cell=(i,j,k)=>i<0||j<0||k<0||i>=nx||j>=ny||k>=nz?-1:fluidMap[id(i,j,k)];
  const faces=[],look=[new Map(),new Map(),new Map()],key=q=>q.join(',');
  for(let a=0;a<n;a++){const q=ijk[a];for(let axis=0;axis<3;axis++){const plus=q.slice();plus[axis]++;const b=cell(...plus);if(b>=0||(axis===2&&q[2]===nz-1)){const loc=plus.slice(),f=faces.length;faces.push({a,b,axis,loc,open:b<0?2:0});look[axis].set(key(loc),f);}if(axis===2&&q[2]===0){const f=faces.length;faces.push({a:-1,b:a,axis,loc:q.slice(),open:1});look[axis].set(key(q),f);}}}
  // Reject sealed components: pressure is undetermined there.
  const adj=Array.from({length:n},()=>[]);for(const f of faces)if(f.a>=0&&f.b>=0){adj[f.a].push(f.b);adj[f.b].push(f.a);}const seen=new Uint8Array(n);
  for(let a=0;a<n;a++)if(!seen[a]){const stack=[a];seen[a]=1;let inlet=false,outlet=false;while(stack.length){const b=stack.pop();inlet||=ijk[b][2]===0;outlet||=ijk[b][2]===nz-1;for(const c of adj[b])if(!seen[c]){seen[c]=1;stack.push(c);}}if(!inlet||!outlet)throw Error('Every gas component must connect inlet to outlet; a sealed or dead-end component was found.');}
  if(m.thinFlowRefined){
    const plane=nx*ny;let prismatic=true;for(let k=1;k<nz&&prismatic;k++)for(let i=0;i<plane;i++)if((fluidMap[k*plane+i]>=0)!==(fluidMap[i]>=0)){prismatic=false;break;}
    if(prismatic){
      progress({message:'Solving fully developed Stokes flow in the resolved thin-plate cross-section…'});
      const cross=ijk.filter(q=>q[2]===0),nc=cross.length,diag=new Float64Array(nc),edges=[],weights=[],rhs=new Float64Array(nc).fill(d[0]*d[1]/m.L);
      cross.forEach((q,a)=>{for(let axis=0;axis<2;axis++)for(const sign of [-1,1]){const v=q.slice();v[axis]+=sign;const b=cell(...v),g=p.mu*d[1-axis]/d[axis];if(b>=0){diag[a]+=g;if(sign===1){edges.push([a,b]);weights.push(g);}}else diag[a]+=2*g;}});
      const uz=cg(diag,edges,weights,rhs),unitQ=uz.reduce((a,v)=>a+v*d[0]*d[1],0),Q=p.flowRate/6e7,scale=Q/unitQ;
      const velocity=Float64Array.from(faces,f=>f.axis===2?uz[fluidMap[id(f.loc[0],f.loc[1],0)]]*scale:0),pressure=Float64Array.from(ijk,q=>(1-(q[2]+.5)/nz)*scale),U=ijk.map(q=>[0,0,uz[fluidMap[id(q[0],q[1],0)]]*scale]);
      const inletArea=nc*d[0]*d[1],Dh=2*m.W*m.H/(m.W+m.H);let Qin=0,Qout=0;faces.forEach((f,i)=>{if(f.open===1)Qin+=velocity[i]*area[2];if(f.open===2)Qout+=velocity[i]*area[2];});
      return {N:n,xyz,ijk,map:fluidMap,faces,velocity,U,pressure,speed:Float64Array.from(U,u=>u[2]),dp:scale,Re:p.gasDensity*(Q/inletArea)*Dh/p.mu,Qin,Qout,massError:Math.abs(Qout-Qin)/Q,divergence:0,hydraulicDiameter:Dh,method:'Fully developed Stokes | invariant cross-section; 3D gas energy'};
    }
  }
  const diag=new Float64Array(faces.length),edges=[],weights=[],forcing=new Float64Array(faces.length);
  faces.forEach((f,a)=>{if(f.open===1)forcing[a]=area[2];for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const q=f.loc.slice();q[axis]+=sign;const b=look[f.axis].get(key(q));const half=f.axis===2&&f.open&&axis!==2?.5:1;const g=p.mu*vol/(d[axis]*d[axis])*half;
      if(b!==undefined){if(b>a){edges.push([a,b]);weights.push(g);diag[a]+=g;diag[b]+=g;}}else{const openZ=axis===2&&(q[2]<0||q[2]>=(f.axis===2?nz+1:nz));if(!openZ)diag[a]+=g*(axis===f.axis?1:2);}}});
  const inverse=b=>cg(diag,edges,weights,b,null,1e-10),div=u=>{const v=new Float64Array(n);faces.forEach((f,i)=>{const q=u[i]*area[f.axis];if(f.a>=0)v[f.a]+=q;if(f.b>=0)v[f.b]-=q;});return v;};
  const gradient=x=>Float64Array.from(faces,f=>area[f.axis]*((f.a>=0?x[f.a]:0)-(f.b>=0?x[f.b]:0)));
  const diagonal=new Float64Array(n);faces.forEach((f,i)=>{const v=area[f.axis]**2/diag[i];if(f.a>=0)diagonal[f.a]+=v;if(f.b>=0)diagonal[f.b]+=v;});
  progress({message:'Solving 3D Stokes momentum and continuity…'});
  const rhs=Float64Array.from(div(inverse(forcing)),x=>-x),pressure=pcgOperator(x=>div(inverse(gradient(x))),rhs,diagonal),force=gradient(pressure);for(let i=0;i<force.length;i++)force[i]+=forcing[i];const velocity=inverse(force);
  let Qin=0;faces.forEach((f,i)=>{if(f.open===1)Qin+=velocity[i]*area[2];});if(!(Qin>0))throw Error('No through-flow path.');const scale=p.flowRate/6e7/Qin;
  for(let i=0;i<velocity.length;i++)velocity[i]*=scale;for(let i=0;i<n;i++)pressure[i]*=scale;
  const U=Array.from({length:n},()=>[0,0,0]);let Qout=0,maxDiv=0;faces.forEach((f,i)=>{for(const a of [f.a,f.b])if(a>=0)U[a][f.axis]+=.5*velocity[i];if(f.open===2)Qout+=velocity[i]*area[2];});
  for(const q of div(velocity))maxDiv=Math.max(maxDiv,Math.abs(q));const areaIn=faces.filter(f=>f.open===1).length*area[2],perimeterIn=ijk.reduce((sum,q)=>{if(q[2]!==0)return sum;for(let axis=0;axis<2;axis++)for(const sign of [-1,1]){const v=q.slice();v[axis]+=sign;if(cell(...v)<0)sum+=d[1-axis];}return sum;},0),Dh=m.wall3d?4*areaIn/perimeterIn:2*m.W*m.H/(m.W+m.H),mean=p.flowRate/6e7/areaIn;
  return {N:n,xyz,ijk,map:fluidMap,faces,velocity,U,pressure,speed:Float64Array.from(U,u=>Math.hypot(...u)),dp:scale,Re:p.gasDensity*mean*Dh/p.mu,Qin:p.flowRate/6e7,Qout,massError:Math.abs(Qout-p.flowRate/6e7)/(p.flowRate/6e7),divergence:maxDiv/(p.flowRate/6e7),hydraulicDiameter:Dh};
}
function gasResult(p,m,f,T,budget){
  const faces=[],edges=[],{nx,ny,nz}=m,id=(i,j,k)=>(k*ny+j)*nx+i;
  f.ijk.forEach((q,a)=>{for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const r=q.slice();r[axis]+=sign;const b=r.some((v,k)=>v<0||v>=[nx,ny,nz][k])?-1:f.map[id(...r)];if(b>=0){if(sign===1)edges.push([a,b,axis]);}else faces.push([a,axis,sign,0]);}});
  let outlet=0,outflow=0;f.faces.forEach((face,i)=>{if(face.open===2&&f.velocity[i]>0){const q=f.velocity[i]*m.area[2];outlet+=q*T[face.a];outflow+=q;}});
  return {mesh:{...m,N:f.N,xyz:f.xyz,ijk:f.ijk,faces,edges,termA:[],termB:[]},T:Float64Array.from(T,t=>t-273.15),speed:f.speed,pressure:f.pressure,U:f.U,
    stats:{dp:f.dp,Re:f.Re,Qin:f.Qin,Qout:f.Qout,massError:f.massError,divergence:f.divergence,outlet:outflow?outlet/outflow-273.15:null,enthalpy:budget.enthalpy,wall:budget.wall,inletConduction:budget.inletConduction}};
}
function thermalFlowNetwork(p,m,f,kval){
  if(m.wall3d)return thermalWall3DNetwork(p,m,f,kval);
  const Ns=m.N,wallStart=Ns+f.N,N=wallStart+(p.wall?2*m.nz:0),edges=[],g=[],diag=new Float64Array(N),advection=[],openings=[],walls=[],inlets=[];
  const {nx,ny,nz}=m,id=(i,j,k)=>(k*ny+j)*nx+i,cell=(i,j,k)=>m.map[id(i,j,k)]>=0?m.map[id(i,j,k)]:Ns+f.map[id(i,j,k)];
  const conductivity=a=>a<Ns?(kval?kval[a]:(m.region[a]?p.electrodeK:p.k)):p.gasK;
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const a=cell(i,j,k);for(let axis=0;axis<3;axis++){const q=[i,j,k];q[axis]++;if(q[axis]<[nx,ny,nz][axis]){const b=cell(...q),v=2*m.area[axis]/(m.d[axis]*(1/conductivity(a)+1/conductivity(b))+2*(a<Ns&&b<Ns&&m.region[a]!==m.region[b]?(p.thermalR||0):0));edges.push([a,b]);g.push(v);diag[a]+=v;diag[b]+=v;}}
    if(a>=Ns){for(let axis=0;axis<2;axis++)if([i,j,k][axis]===0||[i,j,k][axis]===[nx,ny,nz][axis]-1)walls.push([a,2*p.gasK*m.area[axis]/m.d[axis],m.area[axis]]);if(k===0)inlets.push([a,2*p.gasK*m.area[2]/m.d[2]]);}
  }
  const wallArea=2*(m.W+m.H)*m.d[2], thickness=(p.wallThickness||1)/1000;
  if(p.wall&&![p.wallK,p.wallCp,p.wallDensity,thickness].every(v=>v>0&&Number.isFinite(v)))throw Error('Wall properties and thickness must be positive.');
  const capacities=Float64Array.from({length:N},(_,i)=>i<Ns?(m.region[i]?p.electrodeDensity*p.electrodeCp:p.density*p.cp)*m.vol:i<wallStart?p.gasDensity*p.gasCp*m.vol:p.wallDensity*p.wallCp*wallArea*thickness/2);
  function link(a,b,v){edges.push([a,b]);g.push(v);diag[a]+=v;diag[b]+=v;}
  if(p.wall){
    for(const[a,v,A]of walls){const k=f.ijk[a-Ns][2];link(a,wallStart+k,1/(1/v+thickness/(4*p.wallK*A)));}
    for(let k=0;k<m.nz;k++){link(wallStart+k,wallStart+m.nz+k,2*p.wallK*wallArea/thickness);if(k+1<m.nz)for(let layer=0;layer<2;layer++)link(wallStart+layer*m.nz+k,wallStart+layer*m.nz+k+1,p.wallK*2*(m.W+m.H)*thickness/2/m.d[2]);}
  }
  f.faces.forEach((face,i)=>{const flux=p.gasDensity*p.gasCp*f.velocity[i]*m.area[face.axis];if(face.a>=0&&face.b>=0){const a=Ns+(flux>=0?face.a:face.b),b=Ns+(flux>=0?face.b:face.a);advection.push([a,b,Math.abs(flux)]);diag[a]+=Math.abs(flux);}else openings.push([Ns+(face.a>=0?face.a:face.b),face.a>=0?flux:-flux]);});
  function boundary(temp){const add=new Float64Array(N),rhs=new Float64Array(N),Tin=p.gasInlet+273.15,Twall=p.ambient+273.15,Tc=p.sink+273.15;let contact=0,wall=0,enthalpy=0,inletConduction=0;
    for(const[a,axis,sign,terminal]of m.faces)if(terminal){const v=p.hc?m.area[axis]/(m.d[axis]/(2*conductivity(a))+1/p.hc):0;add[a]+=v;rhs[a]+=v*Tc;contact+=v*(temp[a]-Tc);}
    if(!p.wall)for(const[a,v]of walls){add[a]+=v;rhs[a]+=v*Twall;wall+=v*(temp[a]-Twall);}
    if(p.wall){
      for(let k=0;k<m.nz;k++){
        const a=wallStart+m.nz+k,t=temp[a],resistance=thickness/(4*p.wallK)+(p.insulationThickness||0)/1000/(p.insulationK||.04),cond=1/resistance,eps=p.wallEmissivity||0,SB=5.670374419e-8;let surface=t;
        for(let it=0;it<15;it++)surface+=(cond*(t-surface)-p.h*(surface-Twall)-eps*SB*(surface**4-Twall**4))/(cond+p.h+4*eps*SB*surface**3);
        const h=p.h+eps*SB*(surface+Twall)*(surface*surface+Twall*Twall),v=h?wallArea/(resistance+1/h):0;
        add[a]+=v;rhs[a]+=v*Twall;wall+=v*(t-Twall);
      }
      // Axial ring enclosure approximation: diffuse opaque wall, view factor one.
      // Lagged reciprocal exchange conserves watts exactly at convergence.
      for(const[a,axis,sign,terminal]of m.faces)if(!terminal){
        const b=wallStart+m.ijk[a][2],ta=temp[a],tb=temp[b],eps=p.emissivity&&p.wallEmissivity?1/(1/p.emissivity+1/p.wallEmissivity-1):0;
        const v=eps*5.670374419e-8*m.area[axis]*(ta+tb)*(ta*ta+tb*tb);
        add[a]+=v;rhs[a]+=v*tb;add[b]+=v;rhs[b]+=v*ta;
      }
    }
    for(const[a,v]of inlets){add[a]+=v;rhs[a]+=v*Tin;inletConduction+=v*(temp[a]-Tin);}
    for(const[a,flux]of openings){if(flux>=0){add[a]+=flux;enthalpy+=flux*(temp[a]-Tin);}else rhs[a]-=flux*Tin;}
    return {diag:add,rhs,ambient:wall+enthalpy+inletConduction,contacts:contact,wall,enthalpy,inletConduction};
  }
  return {N,edges,g,diag,advection,boundary,capacities,wallStart:p.wall?wallStart:undefined};
}
function bicg(diag,edges,g,advection,b,initial){
  const n=b.length,x=Float64Array.from(initial),mul=v=>{const out=Float64Array.from(v,(u,i)=>diag[i]*u);edges.forEach(([a,c],i)=>{out[a]-=g[i]*v[c];out[c]-=g[i]*v[a];});for(const[a,c,f]of advection)out[c]-=f*v[a];return out;};
  const ax=mul(x),r=Float64Array.from(b,(v,i)=>v-ax[i]),shadow=Float64Array.from(r);let rr=0,norm=0;for(let i=0;i<n;i++){rr+=r[i]*r[i];norm+=b[i]*b[i];}const target=Math.max(1e-24,norm*1e-20);if(rr<=target)return x;
  const precondition=makeIC0(diag,edges,g);
  let rhoOld=1,alpha=1,omega=1,v=new Float64Array(n),direction=new Float64Array(n);
  for(let it=0;it<2500;it++){let rho=0;for(let i=0;i<n;i++)rho+=shadow[i]*r[i];if(Math.abs(rho)<1e-40)break;const beta=rho/rhoOld*alpha/omega;for(let i=0;i<n;i++)direction[i]=r[i]+beta*(direction[i]-omega*v[i]);const ph=precondition(direction);v=mul(ph);let dot=0;for(let i=0;i<n;i++)dot+=shadow[i]*v[i];alpha=rho/dot;const s=Float64Array.from(r,(a,i)=>a-alpha*v[i]);let ss=0;for(const a of s)ss+=a*a;if(ss<=target){for(let i=0;i<n;i++)x[i]+=alpha*ph[i];return x;}const sh=precondition(s),t=mul(sh);let ts=0,tt=0;for(let i=0;i<n;i++){ts+=t[i]*s[i];tt+=t[i]*t[i];}omega=ts/tt;rr=0;for(let i=0;i<n;i++){x[i]+=alpha*ph[i]+omega*sh[i];r[i]=s[i]-omega*t[i];rr+=r[i]*r[i];}if(rr<=target)return x;if(!Number.isFinite(rr)||Math.abs(omega)<1e-40)break;rhoOld=rho;
  }throw Error('Conjugate heat-transfer solve did not converge.');
}
if(typeof module!=='undefined')Object.assign(module.exports,{cadContains,stlContains,parseSTL,solveFlow});
