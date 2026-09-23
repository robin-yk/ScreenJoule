from pathlib import Path
import sys,json,numpy as np
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P))
from _plot_style import plt,save_nature,colors
r=json.loads((P/'results.json').read_text());assert len(r['rows'])==6
fine=[x for x in r['rows'] if x['level']==2]
f,a=plt.subplots(figsize=(5,5))
a.semilogx([x['flowRate'] for x in fine],[x['stats']['avg'] for x in fine],'-s',color='#444444',label='Solid mean')
a.semilogx([x['flowRate'] for x in fine],[x['gas']['outlet'] for x in fine],'-o',color='#c0392b',label='Gas outlet')
a.set(xlabel='Actual flow rate (cm$^3$ min$^{-1}$)',ylabel='Temperature (°C)',xlim=(1,100),ylim=(25,80));a.legend(loc='center right')
save_nature(f,P/'figures/solid-gas-temperatures')
f,a=plt.subplots(figsize=(5,5))
for row,col in zip(fine,colors(3)):
 xyz=np.array(row['solidXYZ']);gxyz=np.array(row['gasXYZ']);t=np.array(row['T']);gt=np.array(row['gasT']);u=np.array(row['U'])[:,2]
 z=np.unique(xyz[:,2]);ts=[t[np.isclose(xyz[:,2],v)].mean() for v in z]
 tg=[np.average(gt[np.isclose(gxyz[:,2],v)],weights=u[np.isclose(gxyz[:,2],v)]) for v in z]
 a.plot(z*1000,ts,color=col,label=str(row['flowRate']))
 a.plot(z*1000,tg,'--',color=col)
a.set(xlabel='Axial position (mm)',ylabel='Temperature (°C)',xlim=(-20,20),ylim=(25,80));a.legend(title='cm$^3$ min$^{-1}$',loc='center',fontsize=12,title_fontsize=12)
save_nature(f,P/'figures/axial-profiles')
rows='\n'.join(f"| {x['flowRate']} | {x['stats']['avg']:.3f} | {x['gas']['outlet']:.3f} | {x['stats']['avg']-x['gas']['outlet']:.3f} | {x['gas']['dp']:.7f} | {x['gas']['enthalpy']:.6f} |" for x in fine)
checks={'cases':6,'maximum_relative_energy_residual':max(x['stats']['energyError'] for x in r['rows']),'maximum_relative_mass_residual':max(x['gas']['massError'] for x in r['rows']), 'refinement':'X and Z doubled; Y retained at 9 cells','mesh_changes':[]}
for x in fine:
 c=next(v for v in r['rows'] if v['level']==1 and v['flowRate']==x['flowRate'])
 checks['mesh_changes'].append({'flow':x['flowRate'],'solid_mean_K':x['stats']['avg']-c['stats']['avg'],'gas_outlet_K':x['gas']['outlet']-c['gas']['outlet'],'pressure_relative':x['gas']['dp']/c['gas']['dp']-1})
(P/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
print(json.dumps(checks,indent=2))
