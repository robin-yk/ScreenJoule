/* Electrically insulating 3D reactor wall on the shared Cartesian lattice. */
function wall3DEnabled(p){return !!p.wall&&['cylinder3d','box3d','cad3d','stl3d'].includes(p.wallGeometry);}
function wallDomain(p){if(!wall3DEnabled(p))return null;const t=p.wallThickness;if(!(t>0&&Number.isFinite(t)))throw Error('Wall thickness must be positive.');return p.wallGeometry==='cylinder3d'?[p.channelWidth+2*t,p.channelWidth+2*t]:p.wallGeometry==='box3d'?[p.channelWidth+2*t,p.channelHeight+2*t]:[p.wallWidth,p.wallHeight];}
function attachWallGrid(p,m){
 if(!wall3DEnabled(p))return m;
 const {nx,ny,nz,d,W,H,L}=m,id=(i,j,k)=>(k*ny+j)*nx+i,size=nx*ny*nz,map=new Int32Array(size).fill(-1),outside=new Uint8Array(size),xyz=[],ijk=[];
 const contains=(x,y,z)=>p.wallGeometry==='cylinder3d'?Math.hypot(x,y)>=p.channelWidth/2000&&Math.hypot(x,y)<=(p.channelWidth/2+p.wallThickness)/1000:p.wallGeometry==='box3d'?Math.abs(x)>=p.channelWidth/2000||Math.abs(y)>=p.channelHeight/2000:p.wallGeometry==='cad3d'?cadContains(p.wallParts,x*1000,y*1000,z*1000):stlContains(p.wallTriangles,x/W,y/H,z/L);
 for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const q=[(i+.5)*d[0]-W/2,(j+.5)*d[1]-H/2,(k+.5)*d[2]-L/2],u=id(i,j,k);if(contains(...q)){if(m.map[u]>=0)throw Error('Wall overlaps heater/electrode cells. Increase bore or adjust CAD.');map[u]=xyz.length;xyz.push(q);ijk.push([i,j,k]);}}
 if(!xyz.length)throw Error('Wall resolves no cells. Refine X/Y mesh or increase thickness.');
 // Exterior is connected to lateral edges; z openings are deliberately not seeds.
 const stack=[];for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if((i===0||j===0||i===nx-1||j===ny-1)&&map[id(i,j,k)]<0){const u=id(i,j,k);if(!outside[u]){outside[u]=1;stack.push([i,j,k]);}}
 while(stack.length){const q=stack.pop();for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const v=q.slice();v[axis]+=sign;if(v.some((n,a)=>n<0||n>=[nx,ny,nz][a]))continue;const u=id(...v);if(map[u]<0&&!outside[u]){outside[u]=1;stack.push(v);}}}
 for(let u=0;u<size;u++)if(outside[u]&&m.map[u]>=0)throw Error('Wall is laterally open or under-resolved: heater connects to exterior. Use a closed through-channel and refine the mesh.');
 let gas=0;for(let u=0;u<size;u++)if(!outside[u]&&map[u]<0&&m.map[u]<0)gas++;if(!gas)throw Error('No enclosed gas cells. Wall CAD must enclose a channel open at both z ends.');
 const edges=[],faces=[],outerFaces=[],innerFaces=[];
 ijk.forEach((q,a)=>{for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const v=q.slice();v[axis]+=sign;const out=v.some((n,k)=>n<0||n>=[nx,ny,nz][k]),u=out?-1:id(...v),b=out?-1:map[u];if(b>=0){if(sign===1)edges.push([a,b,axis]);}else{const face=[a,axis,sign,0];faces.push(face);(out||outside[u]?outerFaces:innerFaces).push(face);}}});
 const wallMesh={N:xyz.length,nx,ny,nz,W,H,L,d,area:m.area,vol:m.vol,xyz,ijk,map,edges,faces,termA:[],termB:[]};
 m.wall3d={mesh:wallMesh,map,outside,outerFaces,innerFaces,gasCells:gas};m.assembly={N:m.N+wallMesh.N,nx,ny,nz,W,H,L,d,area:m.area,vol:m.vol,xyz:[...m.xyz,...xyz],ijk:[...m.ijk,...ijk],faces:[...m.faces,...faces.map(([a,k,s,t])=>[a+m.N,k,s,t])],edges:[...m.edges,...edges.map(([a,b,k])=>[a+m.N,b+m.N,k])],termA:m.termA,termB:m.termB,region:Int8Array.from([...m.region,...new Array(wallMesh.N).fill(3)])};return m;
}
function thermalWall3DNetwork(p,m,f,kval){
 const Ns=m.N,start=Ns+f.N,w=m.wall3d,N=start+w.mesh.N,{nx,ny,nz}=m,id=(i,j,k)=>(k*ny+j)*nx+i;
 if(![p.wallK,p.wallCp,p.wallDensity].every(v=>v>0&&Number.isFinite(v)))throw Error('Wall material properties must be positive.');
 const cell=q=>{if(q.some((v,a)=>v<0||v>=[nx,ny,nz][a]))return -1;const u=id(...q);return m.map[u]>=0?m.map[u]:w.map[u]>=0?start+w.map[u]:f.map[u]>=0?Ns+f.map[u]:-1;};
 const conductivity=a=>a<Ns?(kval?kval[a]:m.region[a]?p.electrodeK:p.k):a<start?p.gasK:p.wallK;
 const edges=[],g=[],diag=new Float64Array(N),advection=[],openings=[],inlets=[];
 function link(a,b,v){edges.push([a,b]);g.push(v);diag[a]+=v;diag[b]+=v;}
 for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=cell([i,j,k]);if(a<0)continue;for(let axis=0;axis<3;axis++){const q=[i,j,k];q[axis]++;const b=cell(q);if(b<0)continue;const resistance=m.d[axis]/2*(1/conductivity(a)+1/conductivity(b))+(a<Ns&&b<Ns&&m.region[a]!==m.region[b]?(p.thermalR||0):0);link(a,b,m.area[axis]/resistance);}}
 f.faces.forEach((face,i)=>{const flux=p.gasDensity*p.gasCp*f.velocity[i]*m.area[face.axis];if(face.a>=0&&face.b>=0){const a=Ns+(flux>=0?face.a:face.b),b=Ns+(flux>=0?face.b:face.a);advection.push([a,b,Math.abs(flux)]);diag[a]+=Math.abs(flux);}else openings.push([Ns+(face.a>=0?face.a:face.b),face.a>=0?flux:-flux]);});
 f.ijk.forEach((q,i)=>{if(q[2]===0)inlets.push([Ns+i,2*p.gasK*m.area[2]/m.d[2]]);});
 // Normal-direction ray approximation, cached by geometry. No angular view factors.
 if(!w.rays){w.rays=[];let totalArea=0,hitArea=0;for(const[a,axis,sign,terminal]of m.faces)if(!terminal){totalArea+=m.area[axis];const q=m.ijk[a].slice();q[axis]+=sign;let b=cell(q);if(b>=start||b<Ns)continue;while(b>=Ns&&b<start){q[axis]+=sign;b=cell(q);}if(b>=start){w.rays.push([a,b-start,m.area[axis]]);hitArea+=m.area[axis];}}w.rayFraction=totalArea?hitArea/totalArea:0;}
 const capacities=Float64Array.from({length:N},(_,i)=>(i<Ns?(m.region[i]?p.electrodeDensity*p.electrodeCp:p.density*p.cp):i<start?p.gasDensity*p.gasCp:p.wallDensity*p.wallCp)*m.vol);
 function boundary(temp){const add=new Float64Array(N),rhs=new Float64Array(N),Tin=p.gasInlet+273.15,Ta=p.ambient+273.15,Tc=p.sink+273.15,SB=5.670374419e-8;let contacts=0,wall=0,enthalpy=0,inletConduction=0;
  for(const[a,axis,sign,terminal]of m.faces)if(terminal){const v=p.hc?m.area[axis]/(m.d[axis]/(2*conductivity(a))+1/p.hc):0;add[a]+=v;rhs[a]+=v*Tc;contacts+=v*(temp[a]-Tc);}
  for(const[a,axis]of w.outerFaces){const b=start+a,cond=1/(m.d[axis]/(2*p.wallK)+(p.insulationThickness||0)/1000/(p.insulationK||.04));let surface=temp[b];for(let j=0;j<15;j++)surface+=(cond*(temp[b]-surface)-p.h*(surface-Ta)-p.wallEmissivity*SB*(surface**4-Ta**4))/(cond+p.h+4*p.wallEmissivity*SB*surface**3);const h=p.h+p.wallEmissivity*SB*(surface+Ta)*(surface*surface+Ta*Ta),v=h?m.area[axis]/(1/cond+1/h):0;add[b]+=v;rhs[b]+=v*Ta;wall+=v*(temp[b]-Ta);}
  for(const[a,wi,A]of w.rays){const b=start+wi,ta=temp[a],tb=temp[b],eps=p.emissivity&&p.wallEmissivity?1/(1/p.emissivity+1/p.wallEmissivity-1):0,v=eps*SB*A*(ta+tb)*(ta*ta+tb*tb);add[a]+=v;rhs[a]+=v*tb;add[b]+=v;rhs[b]+=v*ta;}
  for(const[a,v]of inlets){add[a]+=v;rhs[a]+=v*Tin;inletConduction+=v*(temp[a]-Tin);}
  for(const[a,flux]of openings){if(flux>=0){add[a]+=flux;enthalpy+=flux*(temp[a]-Tin);}else rhs[a]-=flux*Tin;}
  return {diag:add,rhs,ambient:wall+enthalpy+inletConduction,contacts,wall,enthalpy,inletConduction};
 }
 return {N,edges,g,diag,advection,boundary,capacities,wallStart:start,wall3d:true};
}
function wall3DResult(m,temp){const w=m.wall3d;return {mesh:w.mesh,T:Float64Array.from(temp,t=>t-273.15),stats:{volume:w.mesh.N*m.vol,cells:w.mesh.N,max:Math.max(...temp)-273.15,min:Math.min(...temp)-273.15,rayFraction:w.rayFraction}};}
