/* Geometry metrics shared by the Cartesian and annular finite-volume operators. */
function cellVolume(m,i){return m.volumes?m.volumes[i]:m.vol;}
function edgeMetric(m,e){return e.length>3?{area:e[3],a:e[4],b:e[5]}:{area:m.area[e[2]],a:m.d[e[2]]/2,b:m.d[e[2]]/2};}
function faceMetric(m,f){return f.length>4?{area:f[4],distance:f[5]}:{area:m.area[f[1]],distance:m.d[f[1]]/2};}
function terminalMetric(m,a){return m.volumes?{area:m.volumes[a]/m.d[2],distance:m.d[2]/2}:{area:m.area[2],distance:m.d[2]/2};}
function geometryKey(p){return JSON.stringify(['meshType','shape','length','width','height','bore','n','nx','ny','nz','nr','nt','contact','offsetA','offsetB','electrodeLength','flow','channelWidth','channelHeight','wall','wallGeometry','wallThickness','wallWidth','wallHeight','parts','triangles','wallParts','wallTriangles'].map(k=>[k,p[k]??null]));}
function makeAnnularGrid(p){
 if(p.shape!=='tube'||p.flow||p.wall)throw Error('Annular grid supports a hollow solid tube with gas and wall disabled. Select Cartesian for coupled gas/wall calculations.');
 const ri=p.bore/2000,ro=p.width/2000,L=p.length/1000,nr=p.nr||4,nt=p.nt||48,nz=p.nz||3*p.n;
 if(!(ri>0&&ro>ri&&L>0)||![nr,nt,nz].every(Number.isInteger)||nr<2||nt<8||nz<3||nr>64||nt>192||nz>192||nr*nt*nz>60000)throw Error('Annular mesh: 2–64 radial, 8–192 angular, 3–192 axial cells; maximum 60,000. Bore must be positive.');
 const dr=(ro-ri)/nr,dt=2*Math.PI/nt,dz=L/nz,N=nr*nt*nz,xyz=[],ijk=[],volumes=[],edges=[],faces=[],termA=[],termB=[],region=[];
 const id=(i,j,k)=>(k*nt+(j+nt)%nt)*nr+i;
 for(let k=0;k<nz;k++)for(let j=0;j<nt;j++)for(let i=0;i<nr;i++){
 const a=id(i,j,k),r=ri+(i+.5)*dr,t=(j+.5)*dt,z=-L/2+(k+.5)*dz,r0=ri+i*dr,r1=r0+dr,A=.5*(r1*r1-r0*r0)*dt;
 xyz.push([r*Math.cos(t),r*Math.sin(t),z]);ijk.push([i,j,k]);volumes.push(A*dz);region.push(p.electrodeLength>0?(z<-L/2+p.electrodeLength/1000?1:z>L/2-p.electrodeLength/1000?2:0):0);
 if(i<nr-1){const rf=r1;edges.push([a,id(i+1,j,k),0,rf*dt*dz,rf*Math.log(rf/r),rf*Math.log((r+dr)/rf)]);}
 const angularArea=dr*dz,half=dr*dt/(2*Math.log(r1/r0));edges.push([a,id(i,j+1,k),1,angularArea,half,half]);
 if(k<nz-1)edges.push([a,id(i,j,k+1),2,A,dz/2,dz/2]);
 if(i===0)faces.push([a,0,-1,0,ri*dt*dz,ri*Math.log(r/ri)]);
 if(i===nr-1)faces.push([a,0,1,0,ro*dt*dz,ro*Math.log(ro/r)]);
 for(const sign of [-1,1])if(k===(sign<0?0:nz-1)){const off=(sign<0?p.offsetA:p.offsetB)/100*ro;const terminal=Math.abs(xyz[a][0]-off)<=p.contact/100*ro+1e-12?(sign<0?1:2):0;faces.push([a,2,sign,terminal,A,dz/2]);if(terminal===1)termA.push(a);if(terminal===2)termB.push(a);}
 }
 if(!termA.length||!termB.length)throw Error('An electrode covers no annular cells. Increase its width or angular resolution.');
 if(p.electrodeLength>0&&(!region.includes(0)||!region.includes(1)||!region.includes(2)))throw Error('Resolve both electrodes and a heater region along Z.');
 return {kind:'annular',N,nx:nr,ny:nt,nz,nr,nt,ri,ro,dr,dt,W:2*ro,H:2*ro,L,d:[dr,dt,dz],xyz,ijk,volumes:Float64Array.from(volumes),region:Int8Array.from(region),edges,faces,termA,termB};
}
function annularFacePolygon(m,a,axis,sign){const [i,j,k]=m.ijk[a],r0=m.ri+i*m.dr,r1=r0+m.dr,t0=j*m.dt,t1=t0+m.dt,z0=-m.L/2+k*m.d[2],z1=z0+m.d[2];const point=(r,t,z)=>[r*Math.cos(t),r*Math.sin(t),z];let points,normal;
 if(axis===0){const r=sign<0?r0:r1,t=(t0+t1)/2;points=[point(r,t0,z0),point(r,t1,z0),point(r,t1,z1),point(r,t0,z1)];normal=[sign*Math.cos(t),sign*Math.sin(t),0];}
 else if(axis===1){const t=sign<0?t0:t1;points=[point(r0,t,z0),point(r1,t,z0),point(r1,t,z1),point(r0,t,z1)];normal=[-sign*Math.sin(t),sign*Math.cos(t),0];}
 else{const z=sign<0?z0:z1;points=[point(r0,t0,z),point(r1,t0,z),point(r1,t1,z),point(r0,t1,z)];normal=[0,0,sign];}
 return {points,normal,center:points[0].map((_,i)=>points.reduce((s,p)=>s+p[i],0)/4)};
}
const reusableSolve={gridKey:null,mesh:null,flowKey:null,flow:null};

/* Joule3D: conservative Cartesian / annular finite volumes. SI internally. */
'use strict';
function makeGrid(p) {
  if(p.electrodeLength!==undefined&&!(Number.isFinite(p.electrodeLength)&&p.electrodeLength>=0&&p.electrodeLength<p.length/2))throw Error('Each electrode length must be nonnegative and less than half the total length.');
  if(p.meshType==='annular')return makeAnnularGrid(p);
  const sw=p.width/1000,sh=(['block','neck','cad','stl'].includes(p.shape)?p.height:p.width)/1000;
  const wd=typeof wallDomain==='function'?wallDomain(p):null;
  let nx=p.nx||p.n,ny=p.ny||p.n;let nz=p.nz||3*p.n;const W=wd?wd[0]/1000:p.flow?p.channelWidth/1000:sw,H=wd?wd[1]/1000:p.flow?p.channelHeight/1000:sh,L=p.length/1000;
  let tubeRefined=false,thinFlowRefined=false;
  // Resolve a centered thin plate inside a wider gas domain before classifying cells.
  // Preserve all physical dimensions; only automatic mesh counts may change.
  if(p.flow&&!wd&&['block','neck'].includes(p.shape)&&H/ny>sh/3){
    const count=(length,solid,n)=>{let occupied=0;for(let i=0;i<n;i++)if(Math.abs((i+.5)*length/n-length/2)<=solid/2+1e-12)occupied++;return occupied;};
    if(!p.ny){let best=0;for(let n=Math.max(ny,Math.ceil(3*H/sh));n<=512;n++){const cells=count(H,sh,n);if(cells>=3&&Math.abs(cells*H/n/sh-1)<=.02){best=n;break;}}if(!best)throw Error('Thin plate gas mesh needs more than 512 thickness-direction cells to retain its thickness. This uniform-grid solver cannot resolve these dimensions.');ny=best;}
    if(count(H,sh,ny)<1)throw Error('The specified Y mesh misses the heater. Set Y cells to 0 for automatic thin-plate resolution.');
    if(nx*ny*nz>60000){let candidate=null;for(let x=3;x<=nx;x++){if(p.nx&&x!==p.nx)continue;const occupied=count(W,sw,x);if(occupied<3||Math.abs(occupied*W/x/sw-1)>.02)continue;const z=p.nz||Math.min(nz,Math.floor(60000/(x*ny)));if(z<18||x*ny*z>60000)continue;const score=Math.min(x/nx,z/nz);if(!candidate||score>candidate.score)candidate={x,z,score};}if(!candidate)throw Error('The thin-plate gas mesh exceeds 60,000 cells while retaining three heater cells across width/thickness and 18 axial cells. Set independent mesh counts to 0, or use a smaller physical channel if appropriate.');nx=candidate.x;nz=candidate.z;}
    thinFlowRefined=true;
  }
  if(p.shape==='tube'){
    if(!(Number.isFinite(p.bore)&&p.bore>=0&&p.bore<p.width))throw Error('Bore must be smaller than the outer diameter.');
    const thickness=(p.width-p.bore)/2000,spacing=Math.min(thickness/1.5,p.bore>0?p.bore/3000:Infinity),needX=Math.max(nx,Math.ceil(W/spacing)),needY=Math.max(ny,Math.ceil(H/spacing));
    if(needX>96||needY>96||needX*needY*nz>60000)throw Error('Tube needs at least '+needX+' × '+needY+' × '+nz+' cells to resolve its wall and bore, exceeding the mesh limit. Reduce Z cells/channel size or increase tube thickness.');
    tubeRefined=needX!==nx||needY!==ny;nx=needX;ny=needY;
  }
  if(p.flow&&(!(W>sw)||!(H>sh)))throw Error('Channel width and height must exceed the solid bounding dimensions.');
  if(![W,H,L].every(v=>v>0&&Number.isFinite(v))||![nx,ny,nz].every(v=>Number.isInteger(v)&&v>=3&&v<=(thinFlowRefined?512:96))||nx*ny*nz>60000) throw Error('Invalid dimensions or mesh resolution.');
  if(p.shape==='tube'&&!(p.bore>=0&&p.bore<p.width)) throw Error('Bore must be smaller than the outer diameter.');
  const d=[W/nx,H/ny,L/nz],area=[d[1]*d[2],d[0]*d[2],d[0]*d[1]],vol=d[0]*d[1]*d[2];
  const map=new Int32Array(nx*ny*nz).fill(-1),xyz=[],ijk=[];
  const id=(i,j,k)=>(k*ny+j)*nx+i;
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const x=(i+.5)*d[0]-W/2,y=(j+.5)*d[1]-H/2,z=(k+.5)*d[2]-L/2;
    const r=Math.hypot(x,y),neck=Math.abs(z)<L*.23;
    if(Math.abs(x)>sw/2||Math.abs(y)>sh/2)continue;
    if(p.shape==='cad'&&!cadContains(p.parts,x*1000,y*1000,z*1000))continue;
    if(p.shape==='stl'&&!stlContains(p.triangles,x/sw,y/sh,z/L))continue;
    if((p.shape==='rod'||p.shape==='tube')&&r>sw/2)continue;
    if(p.shape==='tube'&&r<p.bore/2000)continue;
    if(p.shape==='neck'&&neck&&Math.abs(x)>sw*.25)continue;
    map[id(i,j,k)]=xyz.length;xyz.push([x,y,z]);ijk.push([i,j,k]);
  }
  if(!xyz.length)throw Error('The gas-domain mesh contains no heater cells. The heater is smaller than the cell spacing; its geometry has not been resolved.');
  const edges=[],faces=[],termA=[],termB=[];
  const kmin=Math.min(...ijk.map(q=>q[2])),kmax=Math.max(...ijk.map(q=>q[2]));
  for(let a=0;a<xyz.length;a++)for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const q=ijk[a].slice();q[axis]+=sign;
    const b=q[0]<0||q[0]>=nx||q[1]<0||q[1]>=ny||q[2]<0||q[2]>=nz?-1:map[id(...q)];
    if(b>=0){if(sign===1)edges.push([a,b,axis]);continue;}
    let terminal=0;
    if(axis===2&&((sign<0&&ijk[a][2]===kmin)||(sign>0&&ijk[a][2]===kmax))){
      const offset=(sign<0?p.offsetA:p.offsetB)/100*sw/2;
      if(Math.abs(xyz[a][0]-offset)<=p.contact/100*sw/2+1e-12)terminal=sign<0?1:2;
    }
    faces.push([a,axis,sign,terminal]);
    if(terminal===1)termA.push(a);if(terminal===2)termB.push(a);
  }
  if(!termA.length||!termB.length)throw Error('An electrode covers no cells. Increase contact width or refine the mesh.');
  // Every component must reach a terminal; disjoint solids have no defined potential.
  const seen=new Uint8Array(xyz.length),adj=Array.from({length:xyz.length},()=>[]);
  for(const [a,b]of edges){adj[a].push(b);adj[b].push(a);}
  const stack=[termA[0]];seen[termA[0]]=1;let connected=0;
  while(stack.length){const a=stack.pop();connected++;for(const b of adj[a])if(!seen[b]){seen[b]=1;stack.push(b);}}
  if(connected!==xyz.length)throw Error('The voxel solid is disconnected. Refine the mesh or increase wall thickness.');
  const region=Int8Array.from(xyz,q=>p.electrodeLength>0?(q[2]<-L/2+p.electrodeLength/1000?1:q[2]>L/2-p.electrodeLength/1000?2:0):0);
  if(p.electrodeLength>0&&(!region.includes(0)||!region.includes(1)||!region.includes(2)))throw Error('Electrode lengths must resolve both end regions and leave heater cells.');
  const m={N:xyz.length,nx,ny,nz,W,H,L,d,area,vol,xyz,ijk,map,edges,faces,termA,termB,region,tubeRefined,thinFlowRefined};return typeof attachWallGrid==='function'?attachWallGrid(p,m):m;
}
function cg(diag,edges,g,b,initial,tol=1e-10){
  const n=b.length,x=initial?Float64Array.from(initial):new Float64Array(n),r=new Float64Array(n),z=new Float64Array(n),v=new Float64Array(n),a=new Float64Array(n);
  function mul(src,dst){for(let i=0;i<n;i++)dst[i]=diag[i]*src[i];for(let e=0;e<edges.length;e++){const [i,j]=edges[e];dst[i]-=g[e]*src[j];dst[j]-=g[e]*src[i];}}
  // IC(0) preconditioning retains nearest-neighbor coupling, including thin-cell stiffness.
  const lower=Array.from({length:n},()=>new Map()),ld=new Float64Array(n);
  for(let e=0;e<edges.length;e++){const [a,b]=edges[e],i=Math.max(a,b),j=Math.min(a,b);lower[i].set(j,(lower[i].get(j)||0)-g[e]);}
  const rows=lower.map(row=>Array.from(row.keys()).sort((a,b)=>a-b));
  for(let i=0;i<n;i++){let sum=0;for(const j of rows[i]){let v=lower[i].get(j);for(const k of rows[j])if(k<j&&lower[i].has(k))v-=lower[i].get(k)*lower[j].get(k);v/=ld[j];lower[i].set(j,v);sum+=v*v;}const pivot=diag[i]-sum;if(!(pivot>0))throw Error('Incomplete Cholesky preconditioner has a nonpositive pivot.');ld[i]=Math.sqrt(pivot);}
  function precondition(){z.set(r);for(let i=0;i<n;i++){for(const j of rows[i])z[i]-=lower[i].get(j)*z[j];z[i]/=ld[i];}for(let i=n-1;i>=0;i--){z[i]/=ld[i];for(const j of rows[i])z[j]-=lower[i].get(j)*z[i];}}
  mul(x,a);let rz=0,b2=0;
  for(let i=0;i<n;i++){if(!(diag[i]>0))throw Error('No thermal reference: add heat loss or select transient.');r[i]=b[i]-a[i];b2+=b[i]*b[i];}
  precondition();for(let i=0;i<n;i++){v[i]=z[i];rz+=r[i]*z[i];}
  const threshold=Math.max(1e-26,b2*tol*tol);
  for(let it=0;it<2400;it++){
    let r2=0;for(let i=0;i<n;i++)r2+=r[i]*r[i];if(r2<=threshold)return x;
    mul(v,a);let va=0;for(let i=0;i<n;i++)va+=v[i]*a[i];
    if(!(va>0))throw Error('Linear solve lost positive definiteness.');
    const step=rz/va;let next=0;
    for(let i=0;i<n;i++){x[i]+=step*v[i];r[i]-=step*a[i];}
    precondition();for(let i=0;i<n;i++)next+=r[i]*z[i];
    const beta=next/rz;for(let i=0;i<n;i++)v[i]=z[i]+beta*v[i];rz=next;
  }
  throw Error('Linear solve did not converge.');
}
// Piecewise-linear positive material data. Integration is exact on each segment.
function materialTable(rows,fallback,name){
  rows=rows||[];
  if(!Array.isArray(rows)||rows.length===1||rows.some((r,i)=>!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||r[0]<=-273.15||r[1]<=0||(i&&r[0]<=rows[i-1][0])))throw Error(name+': use increasing temperature (°C), positive property pairs.');
  function coordinate(t){const c=t-273.15;if(!Number.isFinite(c))throw Error(name+': invalid temperature.');if(rows.length&&(c<rows[0][0]-1e-8||c>rows.at(-1)[0]+1e-8))throw Error(name+': temperature '+c.toFixed(5)+' °C outside table ['+rows[0][0]+', '+rows.at(-1)[0]+']; extrapolation disabled.');return rows.length?Math.max(rows[0][0],Math.min(rows.at(-1)[0],c)):c;}
  function value(t){const c=coordinate(t);if(!rows.length)return fallback;let i=1;while(i<rows.length-1&&c>rows[i][0])i++;const a=rows[i-1],b=rows[i];return a[1]+(b[1]-a[1])*(c-a[0])/(b[0]-a[0]);}
  function integral(from,to){let a=coordinate(from),b=coordinate(to);if(!rows.length)return fallback*(b-a);let sign=1;if(a>b){[a,b]=[b,a];sign=-1;}let total=0;for(let i=1;i<rows.length;i++){const l=Math.max(a,rows[i-1][0]),h=Math.min(b,rows[i][0]);if(h<=l)continue;const slope=(rows[i][1]-rows[i-1][1])/(rows[i][0]-rows[i-1][0]);total+=(h-l)*(rows[i-1][1]+slope*((l+h)/2-rows[i-1][0]));}return sign*total;}
  return {value,integral};
}
function solveModel(p,progress=()=>{}){
  p={insulationThickness:0,insulationK:.04,...p};
  // Homogeneous porous heater: envelope mesh, skeleton mass and body-scale k.
  // Transform a copy so repeated solves and exported inputs retain their basis.
  const porosity=p.porosity??0;
  if(!Number.isFinite(porosity)||porosity<0||porosity>=1)throw Error('Porosity must be in [0, 1).');
  const resistivityBasis=p.resistivityBasis??'skeleton';
  if(!['skeleton','effective'].includes(resistivityBasis))throw Error('Unknown resistivity basis.');
  const solidFraction=1-porosity;
  p.density*=solidFraction;
  if(resistivityBasis==='skeleton'){
    p.rho/=solidFraction;
    p.rhoCurve=(p.rhoCurve||[]).map(([t,r])=>[t,r/solidFraction]);
  }
  for(const k of ['contactR','thermalR','slew','jlimit'])if(p[k]!==undefined&&!(Number.isFinite(p[k])&&p[k]>=0))throw Error(k+' must be finite and nonnegative.');
  if(p.wall&&(!(p.wallEmissivity>=0&&p.wallEmissivity<=1)||!(p.insulationThickness>=0)||!(p.insulationK>0)))throw Error('Invalid wall emissivity or insulation.');
  if(p.wall&&!p.flow)throw Error('Enable gas flow to solve the reactor wall.');
  if(p.flowUnit==='standard')p.flowRate=p.flowRate*(p.gasInlet+273.15)/273.15*101325/p.outletPressure;
  if(p.flowUnit==='mass')p.flowRate=p.flowRate/p.gasDensity*6e7;
  if(p.outletPressure!==undefined&&!(p.outletPressure>0))throw Error('Outlet absolute pressure must be positive.');
  if(p.thermalR&&!p.electrodeLength)p.hc=p.hc?1/(1/p.hc+p.thermalR):0;
  if(p.electrodeLength>0)for(const k of ['electrodeRho','electrodeK','electrodeCp','electrodeDensity'])if(!(p[k]>0&&Number.isFinite(p[k])))throw Error(k+' must be positive.');
  const rhoCurve=p.rhoCurve||[];
  if(rhoCurve.length){if(rhoCurve.length<2||rhoCurve.some((r,i)=>r.length!==2||!r.every(Number.isFinite)||r[1]<=0||(i&&r[0]<=rhoCurve[i-1][0])))throw Error('Resistivity table requires increasing temperature and positive resistivity.');}
  function resistivity(t){const c=t-273.15;if(!rhoCurve.length)return p.rho*(1+p.alpha*(t-298.15));if(c<rhoCurve[0][0]||c>rhoCurve.at(-1)[0])throw Error('Temperature outside measured resistivity table; extrapolation is disabled.');let i=1;while(i<rhoCurve.length-1&&c>rhoCurve[i][0])i++;const a=rhoCurve[i-1],b=rhoCurve[i];return a[1]+(b[1]-a[1])*(c-a[0])/(b[0]-a[0]);}

  const heaterK=materialTable(p.kCurve,p.k,'Heater k'),heaterCp=materialTable(p.cpCurve,p.cp,'Heater Cp'),electrodeK=materialTable(p.electrodeKCurve,p.electrodeK,'Electrode k'),electrodeCp=materialTable(p.electrodeCpCurve,p.electrodeCp,'Electrode Cp'),electrodeRho=materialTable(p.electrodeRhoCurve,p.electrodeRho,'Electrode resistivity');
  const started=Date.now(),gridKey=geometryKey(p),gridReused=p.reuse!==false&&reusableSolve.gridKey===gridKey;
  const m=gridReused?reusableSolve.mesh:makeGrid(p);reusableSolve.gridKey=gridKey;reusableSolve.mesh=m;const Ns=m.N,SB=5.670374419e-8,Ta=p.ambient+273.15,Tc=p.sink+273.15;
  for(const key of ['rho','k','cp','density','vmax','imax','pmax','maxTemp'])if(!(p[key]>0&&Number.isFinite(p[key])))throw Error(key+' must be positive.');
  for(const key of ['h','hc','command'])if(!(p[key]>=0&&Number.isFinite(p[key])))throw Error(key+' must be nonnegative.');
  if(!(Ta>0&&Tc>0&&p.initial>-273.15&&p.emissivity>=0&&p.emissivity<=1&&Number.isFinite(p.alpha)))throw Error('Invalid temperature, emissivity or resistivity coefficient.');
  if(p.study==='transient'&&!(p.dt>0&&p.duration>0&&p.period>0&&p.duty>=0&&p.duty<=1))throw Error('Invalid time or pulse settings.');
  if(!p.flow&&p.study==='steady'&&p.h===0&&p.hc===0&&p.emissivity===0)throw Error('Steady heating needs a path for heat to leave the solid.');
  if(p.initialMode==='saved'&&p.study==='transient'&&!p.initialState)throw Error('Saved initial temperature field is missing.');
  if(p.flow&&(![p.mu,p.gasDensity,p.gasCp,p.gasK,p.flowRate].every(x=>Number.isFinite(x)&&x>0)||!Number.isFinite(p.gasInlet)||p.gasInlet<=-273.15))throw Error('Gas properties and flow rate must be positive; inlet temperature must exceed absolute zero.');
  const flowKey=JSON.stringify([gridKey,p.mu,p.gasDensity,p.flowRate]),flowReused=!!p.flow&&p.reuse!==false&&reusableSolve.flowKey===flowKey;
  const flow=p.flow?(flowReused?reusableSolve.flow:solveFlow(p,m,progress)):null;if(p.flow){reusableSolve.flowKey=flowKey;reusableSolve.flow=flow;}let network=flow?thermalFlowNetwork(p,m,flow):null;const N=network?network.N:Ns;
  let T=new Float64Array(N).fill(p.study==='steady'?Ta:p.initial+273.15),phi=new Float64Array(Ns);
  let gt=new Float64Array(m.edges.length),base=new Float64Array(N),thermalEdges=m.edges;
  const capacities=Float64Array.from(T,(v,i)=>network?.capacities?network.capacities[i]:(i<Ns?(m.region[i]?p.electrodeDensity*p.electrodeCp:p.density*p.cp):p.gasDensity*p.gasCp)*cellVolume(m,i));
  m.edges.forEach(([a,b,axis],e)=>{gt[e]=edgeMetric(m,m.edges[e]).area/(edgeMetric(m,m.edges[e]).a*(m.region[a]?1/p.electrodeK:1/p.k)+edgeMetric(m,m.edges[e]).b*(m.region[b]?1/p.electrodeK:1/p.k)+(m.region[a]!==m.region[b]?(p.thermalR||0):0));base[a]+=gt[e];base[b]+=gt[e];});
  if(network){gt=network.g;base=network.diag;thermalEdges=network.edges;for(let i=Ns;i<Ns+flow.N;i++)T[i]=p.gasInlet+273.15;}
  if(p.study==='transient'&&p.initialState){const state=p.initialState;if(state.geometryKey!==gridKey||state.temperatureK?.length!==N||Array.from(state.temperatureK).some(t=>!Number.isFinite(t)||t<=0||t>p.maxTemp+273.15))throw Error('Saved temperature field does not match the current geometry or temperature limits.');T.set(state.temperatureK);}
  function solidConductivity(temp){return Float64Array.from(temp.slice(0,Ns),(t,i)=>(m.region[i]?electrodeK:heaterK).value(t));}
  function refreshThermal(temp){
    const kval=solidConductivity(temp);
    if(network){network=thermalFlowNetwork(p,m,flow,kval);gt=network.g;base=network.diag;thermalEdges=network.edges;}
    else {base.fill(0);m.edges.forEach(([a,b,axis],e)=>{gt[e]=edgeMetric(m,m.edges[e]).area/(edgeMetric(m,m.edges[e]).a/kval[a]+edgeMetric(m,m.edges[e]).b/kval[b]+(m.region[a]!==m.region[b]?(p.thermalR||0):0));base[a]+=gt[e];base[b]+=gt[e];});}
  }
  function heatChange(i,from,to){if(i>=Ns)return capacities[i]*(to-from);return (m.region[i]?p.electrodeDensity:p.density)*cellVolume(m,i)*(m.region[i]?electrodeCp:heaterCp).integral(from,to);}
  function secantCapacity(i,from,to){if(i>=Ns)return capacities[i];return Math.abs(to-from)>1e-7?heatChange(i,from,to)/(to-from):(m.region[i]?p.electrodeDensity:p.density)*cellVolume(m,i)*(m.region[i]?electrodeCp:heaterCp).value(to);}
  for(let i=0;i<Ns;i++){(m.region[i]?electrodeCp:heaterCp).value(T[i]);}
  function electrical(temp,on){
    const res=Float64Array.from(temp.slice(0,Ns),(t,i)=>m.region[i]?electrodeRho.value(t):resistivity(t));
    if(res.some(r=>!Number.isFinite(r)||r<=0))throw Error('The linear resistivity law reached zero or a negative value. Change its coefficient or temperature range.');
    const diag=new Float64Array(Ns),rhs=new Float64Array(Ns),ge=new Float64Array(m.edges.length);
    m.edges.forEach(([a,b,axis],e)=>{ge[e]=edgeMetric(m,m.edges[e]).area/(edgeMetric(m,m.edges[e]).a*res[a]+edgeMetric(m,m.edges[e]).b*res[b]+(m.region[a]!==m.region[b]?(p.contactR||0):0));diag[a]+=ge[e];diag[b]+=ge[e];});
    for(const a of m.termA){const g=terminalMetric(m,a).area/(terminalMetric(m,a).distance*res[a]+(p.electrodeLength?0:(p.contactR||0)));diag[a]+=g;rhs[a]+=g;}
    for(const a of m.termB)diag[a]+=terminalMetric(m,a).area/(terminalMetric(m,a).distance*res[a]+(p.electrodeLength?0:(p.contactR||0)));
    phi=cg(diag,m.edges,ge,rhs,phi);
    let G=0,Gb=0;for(const a of m.termA)G+=terminalMetric(m,a).area/(terminalMetric(m,a).distance*res[a]+(p.electrodeLength?0:(p.contactR||0)))*(1-phi[a]);
    for(const a of m.termB)Gb+=terminalMetric(m,a).area/(terminalMetric(m,a).distance*res[a]+(p.electrodeLength?0:(p.contactR||0)))*phi[a];
    if(!(G>0))throw Error('No conducting path between electrodes.');
    const req=on?(p.mode==='V'?p.command:p.mode==='I'?p.command/G:Math.sqrt(p.command/G)):0;
    const limits=[req,p.vmax,p.imax/G,Math.sqrt(p.pmax/G)];let V=Math.min(...limits),limiter=['Setpoint','Voltage limit','Current limit','Power limit'][limits.indexOf(V)];
    if(p.limitAction==='trip'&&V<req*(1-1e-10))throw Error('Supply tripped: '+limiter+'. Requested voltage '+req.toPrecision(5)+' V.');
    if(activeDt&&p.slew){const bounded=Math.max(previousVoltage-p.slew*activeDt,Math.min(previousVoltage+p.slew*activeDt,V));V=Math.min(bounded,p.vmax,p.imax/G,Math.sqrt(p.pmax/G));if(Math.abs(V-limits[0])>1e-10&&limiter==='Setpoint')limiter='Voltage slew';}
    let contactPower=0;
    const heat=new Float64Array(Ns),jx=new Float64Array(Ns),jy=new Float64Array(Ns),jz=new Float64Array(Ns),components=[jx,jy,jz];
    m.edges.forEach(([a,b,axis],e)=>{const dp=(phi[a]-phi[b])*V,watts=ge[e]*dp*dp;const rc=m.region[a]!==m.region[b]?(p.contactR||0):0,ra=edgeMetric(m,m.edges[e]).a*res[a],rb=edgeMetric(m,m.edges[e]).b*res[b];heat[a]+=watts*(ra+rc/2)/(ra+rb+rc);heat[b]+=watts*(rb+rc/2)/(ra+rb+rc);contactPower+=watts*rc/(ra+rb+rc);const j=ge[e]*dp/(2*edgeMetric(m,m.edges[e]).area);components[axis][a]+=j;components[axis][b]+=j;});
    for(const [list,u]of [[m.termA,1],[m.termB,0]])for(const a of list){const g=terminalMetric(m,a).area/(terminalMetric(m,a).distance*res[a]+(p.electrodeLength?0:(p.contactR||0))),dp=(u-phi[a])*V;heat[a]+=g*dp*dp;contactPower+=(g*dp)**2*(p.electrodeLength?0:(p.contactR||0))/terminalMetric(m,a).area;jz[a]+=(u===1?1:-1)*g*dp/(2*terminalMetric(m,a).area);}
    let peak=0;for(let i=0;i<Ns;i++)peak=Math.max(peak,Math.hypot(jx[i],jy[i],jz[i]));
    if(p.jlimit&&peak>p.jlimit)throw Error('Current-density trip: reconstructed J exceeds '+p.jlimit+' A/m².');
    return {requestedVoltage:req,contactPower,R:1/G,V,I:G*V,P:G*V*V,limiter,heat,potential:Float64Array.from(phi,x=>x*V),J:Float64Array.from(jx,(x,i)=>Math.hypot(x,jy[i],jz[i])),chargeError:Math.abs(G-Gb)/G};
  }
  function boundaries(temp){
    if(network)return network.boundary(temp);
    const diag=new Float64Array(N),rhs=new Float64Array(N);let ambient=0,contacts=0;
    for(const face of m.faces){
      const [a,axis,sign,terminal]=face,fm=faceMetric(m,face);
      const cond=(m.region[a]?electrodeK:heaterK).value(temp[a])/fm.distance,target=terminal?Tc:Ta;let h=p.hc;
      if(!terminal){
        let surface=temp[a];
        for(let j=0;j<10;j++)surface+=(cond*(temp[a]-surface)-p.h*(surface-Ta)-p.emissivity*SB*(surface**4-Ta**4))/(cond+p.h+4*p.emissivity*SB*surface**3);
        h=p.h+p.emissivity*SB*(surface+Ta)*(surface*surface+Ta*Ta);
      }
      const g=h===0?0:fm.area/(1/cond+1/h);diag[a]+=g;rhs[a]+=g*target;
      if(terminal)contacts+=g*(temp[a]-target);else ambient+=g*(temp[a]-target);
    }
    return {diag,rhs,ambient,contacts};
  }
  let lastE,lastB,lastRate=0,lastError=0,iterations=0,previousVoltage=0,activeDt=0;
  function advance(old,dt,on,time){
    activeDt=dt;let guess=Float64Array.from(old),converged=false;
    for(let it=0;it<140;it++){
      refreshThermal(guess);
      const e=electrical(guess,on),b=boundaries(guess),diag=Float64Array.from(base),rhs=new Float64Array(N);
      for(let i=0;i<N;i++){const mass=dt?secantCapacity(i,old[i],guess[i])/dt:0;diag[i]+=b.diag[i]+mass;rhs[i]=(e.heat[i]||0)+b.rhs[i]+mass*old[i];}
      const next=network?bicg(diag,thermalEdges,gt,network.advection,rhs,guess):cg(diag,thermalEdges,gt,rhs,guess);let delta=0;
      // Damped, bounded Picard step avoids cold-start radiation overshoot.
      // Test convergence with the full fixed-point residual, never the bounded step.
      for(let i=0;i<N;i++){delta=Math.max(delta,Math.abs(next[i]-guess[i]));guess[i]+=Math.max(-100,Math.min(100,.3*(next[i]-guess[i])));if(!Number.isFinite(guess[i])||guess[i]>p.maxTemp+273.15||guess[i]<=0)throw Error('Temperature left the specified calculation range. Reduce the input or adjust the model.');}
      iterations++;if(it%5===0)progress({time,iteration:it+1,delta,cells:N});
      if(delta<2e-6){converged=true;break;}
    }
    if(!converged)throw Error('Electrothermal iteration did not converge. A steady solution has not been established.');
    refreshThermal(guess);lastE=electrical(guess,on);previousVoltage=lastE.V;lastB=boundaries(guess);
    const storage=dt?guess.reduce((s,t,i)=>s+heatChange(i,old[i],t)/dt,0):0;
    lastRate=dt?guess.slice(0,Ns).reduce((s,t,i)=>s+(t-old[i])*cellVolume(m,i)/dt,0)/volume:0;
    lastError=Math.abs(lastE.P-lastB.ambient-lastB.contacts-storage)/Math.max(Math.abs(lastE.P),Math.abs(lastB.ambient)+Math.abs(lastB.contacts),Math.abs(storage),1e-8);
    return {temp:guess,storage};
  }
  const history=[];let inputEnergy=0,lossEnergy=0,time=0,steps=0;
  const volume=Array.from({length:Ns},(_,i)=>cellVolume(m,i)).reduce((a,b)=>a+b,0);
  const summarize=()=>{let max=-Infinity,min=Infinity,avg=0;T.slice(0,Ns).forEach((t,i)=>{max=Math.max(max,t);min=Math.min(min,t);avg+=t*cellVolume(m,i);});return {max:max-273.15,min:min-273.15,spread:max-min,avg:avg/volume-273.15};};
  const initialT=Float64Array.from(T);
  if(p.study==='steady'){T=advance(T,0,true,0).temp;history.push({t:0,...summarize(),P:lastE.P,V:lastE.V,I:lastE.I,limiter:lastE.limiter});}
  else{
    history.push({t:0,...summarize(),P:0});
    while(time<p.duration-1e-10){
      if(++steps>1200)throw Error('More than 1,200 time steps. Increase the time step or reduce the duration.');
      let on=true,toEvent=Infinity;
      if(p.duty<=0)on=false;else if(p.duty<1){let phase=(time+1e-10)%p.period;on=phase<p.duty*p.period;toEvent=(on?p.duty*p.period:p.period)-phase+1e-10;}
      const dt=Math.min(p.dt,p.duration-time,toEvent);if(dt<1e-12)throw Error('Time step too small.');
      T=advance(T,dt,on,time+dt).temp;time+=dt;inputEnergy+=lastE.P*dt;lossEnergy+=(lastB.ambient+lastB.contacts)*dt;
      history.push({t:time,...summarize(),P:lastE.P,V:lastE.V,I:lastE.I,limiter:lastE.limiter});progress({time,iteration:0,delta:0,cells:N});
    }
  }
  const stored=T.reduce((s,t,i)=>s+heatChange(i,initialT[i],t),0);
  const gas=flow?gasResult(p,m,flow,T.slice(Ns,Ns+flow.N),lastB):null;
  return {restart:{geometryKey:gridKey,temperatureK:Array.from(T)},cache:{gridReused,flowReused},wall:network?.wall3d?wall3DResult(m,T.slice(network.wallStart)):network?.wallStart!==undefined?{inner:Array.from(T.slice(network.wallStart,network.wallStart+m.nz),t=>t-273.15),outer:Array.from(T.slice(network.wallStart+m.nz),t=>t-273.15)}:null,params:p,mesh:m,gas,T:Float64Array.from(T.slice(0,Ns),t=>t-273.15),phi:lastE.potential,q:Float64Array.from(lastE.heat,(q,i)=>q/cellVolume(m,i)),J:lastE.J,history,
    stats:{...summarize(),electrodeMax:p.electrodeLength?Math.max(...Array.from(T.slice(0,Ns),(t,i)=>m.region[i]?t-273.15:-Infinity)):null,heaterMax:Math.max(...Array.from(T.slice(0,Ns),(t,i)=>!m.region[i]?t-273.15:-Infinity)),contactPower:lastE.contactPower,requestedVoltage:lastE.requestedVoltage,peakJ:Math.max(...lastE.J),targetFraction:T.slice(0,Ns).reduce((s,t,i)=>s+(!m.region[i]&&t-273.15>=(p.targetLow??0)&&t-273.15<=(p.targetHigh??1000)?cellVolume(m,i):0),0)/m.region.reduce((s,v,i)=>s+(!v?cellVolume(m,i):0),0),R:lastE.R,V:lastE.V,I:lastE.I,P:lastE.P,limiter:lastE.limiter,ambient:lastB.ambient,contacts:lastB.contacts,rate:lastRate,energyError:lastError,chargeError:lastE.chargeError,inputEnergy:p.study==='transient'?inputEnergy:null,lossEnergy:p.study==='transient'?lossEnergy:null,stored:p.study==='transient'?stored:null,integratedError:p.study==='transient'?Math.abs(inputEnergy-lossEnergy-stored)/Math.max(Math.abs(inputEnergy),Math.abs(stored),1e-8):null,seconds:(Date.now()-started)/1000,iterations,steps,volume}};
}
if(typeof module!=='undefined')module.exports={makeGrid,solveModel,materialTable};

function makeIC0(diag,edges,g){const n=diag.length;
  const lower=Array.from({length:n},()=>new Map()),ld=new Float64Array(n);
  for(let e=0;e<edges.length;e++){const [a,b]=edges[e],i=Math.max(a,b),j=Math.min(a,b);lower[i].set(j,(lower[i].get(j)||0)-g[e]);}
  const rows=lower.map(row=>Array.from(row.keys()).sort((a,b)=>a-b));
  for(let i=0;i<n;i++){let sum=0;for(const j of rows[i]){let v=lower[i].get(j);for(const k of rows[j])if(k<j&&lower[i].has(k))v-=lower[i].get(k)*lower[j].get(k);v/=ld[j];lower[i].set(j,v);sum+=v*v;}const pivot=diag[i]-sum;if(!(pivot>0))throw Error('Incomplete Cholesky preconditioner has a nonpositive pivot.');ld[i]=Math.sqrt(pivot);}
  return r=>{const z=Float64Array.from(r);for(let i=0;i<n;i++){for(const j of rows[i])z[i]-=lower[i].get(j)*z[j];z[i]/=ld[i];}for(let i=n-1;i>=0;i--){z[i]/=ld[i];for(const j of rows[i])z[j]-=lower[i].get(j)*z[i];}return z;};

}
