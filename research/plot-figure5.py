from pathlib import Path
import sys,json,numpy as np
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from matplotlib.colors import Normalize
from matplotlib.cm import ScalarMappable
P=Path(__file__).resolve().parent;O=P/'output';O.mkdir(exist_ok=True)
sys.path.insert(0,str(P))
from common import plt,minor,figcheck
D=json.loads((P/'3d-browser-check/screening.json').read_text());F=json.loads((P/'3d-browser-check/fig5-fields.json').read_text())
fig=plt.figure(figsize=(11.8,10.5));axs=[]
a=fig.add_axes([.55/11.8,5.85/10.5,3.65/11.8,3.65/10.5]);axs.append(a)
for j,r in enumerate(F['rows']):
 xyz=np.array(r['xyz'])*1000;zmin=xyz[:,2].min();mask=np.isclose(xyz[:,2],zmin);ids=np.flatnonzero(mask);col=['#dce3e6' if i not in r['termA'] else '#247e8b' for i in ids]
 a.scatter(xyz[mask,0]+j*17,xyz[mask,1],c=col,s=19,marker='s',linewidths=0)
 a.text(j*17,8,f'{r["params"]["contact"]}% width',ha='center',fontsize=13)
a.set(xlim=(-8,25),ylim=(-16,17));a.set_aspect('equal');a.axis('off');a.text(.02,1.05,'a',transform=a.transAxes,weight='bold',fontsize=18)
a.text(.5,.18,'Terminal patch',color='#247e8b',ha='center',transform=a.transAxes,fontsize=13)
a.text(.5,.08,'Same footprint at both ends',ha='center',transform=a.transAxes,fontsize=11)
b=fig.add_axes([5.6/11.8,5.85/10.5,3.65/11.8,3.65/10.5]);axs.append(b);b.set_box_aspect(1)
X,Y=np.meshgrid(D['xs'],D['ys']);Z=np.array([r['metrics']['spread'] for r in D['rows']]).reshape(Y.shape)
im=b.contourf(X,Y,Z,levels=np.linspace(0,80,17),cmap='viridis_r',vmin=0,vmax=80)
b.scatter(X,Y,s=16,color='#fff',edgecolors='#303030',linewidths=.5,zorder=4)
limits=np.array([D['rows'][i*5]['metrics']['R']*D['base']['imax']**2 for i in range(4)])
b.plot(limits,D['ys'],'k--',lw=1.8);b.text(.59,.86,'Current-limited',transform=b.transAxes,fontsize=10,bbox=dict(fc='white',ec='none',alpha=.8))
b.set(xlabel='Power setpoint (W)',ylabel='Terminal patch width (%)',xlim=(10,90),ylim=(25,100));minor(b);b.text(-.18,1.04,'b',transform=b.transAxes,weight='bold',fontsize=18)
cb=fig.add_axes([9.55/11.8,6.1/10.5,.15/11.8,3.1/10.5]);fig.colorbar(im,cax=cb,label='Temperature spread (K)')
norm=Normalize(440,485);cmap=plt.get_cmap('viridis')
for j,r in enumerate(F['rows']):
 xyz=np.array(r['xyz'])*1000;ds=np.array(r['d'])*1000;idx=np.rint((xyz+[6,6,15])/ds-.5).astype(int);occupied={tuple(v) for v in idx};faces=[];colors=[]
 for pos,ij,t in zip(xyz,idx,r['T']):
  for k in range(3):
   rest=[v for v in range(3) if v!=k]
   for sign in [-1,1]:
    neighbor=ij.copy();neighbor[k]+=sign
    if tuple(neighbor) in occupied:continue
    vertices=[]
    for u,v in [(-1,-1),(1,-1),(1,1),(-1,1)]:
     pt=pos.copy();pt[k]+=sign*ds[k]/2;pt[rest[0]]+=u*ds[rest[0]]/2;pt[rest[1]]+=v*ds[rest[1]]/2;vertices.append(pt)
    faces.append(vertices);colors.append(cmap(norm(t)))
 ax=fig.add_axes([(.3+j*5)/11.8,.45/10.5,4.7/11.8,4.7/10.5],projection='3d');axs.append(ax)
 ax.add_collection3d(Poly3DCollection(faces,facecolors=colors,edgecolors='none',rasterized=True))
 ax.set(xlim=(-6,6),ylim=(-6,6),zlim=(-15,15));ax.set_box_aspect((12,12,30));ax.view_init(elev=25,azim=-65);ax.axis('off')
 ax.text2D(.02,.96,chr(99+j),transform=ax.transAxes,weight='bold',fontsize=18)
 ax.text2D(.5,1.01,f'{r["params"]["contact"]}% width | 30 W',transform=ax.transAxes,ha='center',fontsize=13)
 ax.text2D(.5,-.01,f'ΔT = {r["stats"]["spread"]:.1f} K',transform=ax.transAxes,ha='center',fontsize=14)
cb=fig.add_axes([10/11.8,1.1/10.5,.15/11.8,3/10.5]);fig.colorbar(ScalarMappable(norm=norm,cmap=cmap),cax=cb,label='Temperature (°C)')
fig.canvas.draw();dims=[]
for ax in axs:
 q=ax.get_window_extent().transformed(fig.dpi_scale_trans.inverted());dims.append([q.width,q.height]);assert abs(q.width/q.height-1)<.01
issues=figcheck(fig);assert not issues,issues
fig.savefig(O/'figure-5.svg');fig.savefig(O/'figure-5.png',dpi=600);fig.savefig(O/'preview.png',dpi=110)
(O/'checks.json').write_text(json.dumps({'issues':issues,'axes_inches':dims,'panel_allocation':'5 by 5 in; additional colorbar space','map_points':20,'geometry':'true physical proportions in 3D'}))
