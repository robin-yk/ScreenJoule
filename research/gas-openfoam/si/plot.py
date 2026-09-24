"""Compare retained ScreenJoule fields with actual OpenFOAM output."""
from pathlib import Path
import json,sys,numpy as np
P=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(P))
from _plot_style import plt,save_nature,colors

def key(x): return tuple(np.round(x,11))

def matched(sj,of):
    points={key(x):i for i,x in enumerate(of['xyz'])}
    si=np.array([points[key(x)] for x in sj['solidXYZ']])
    gi=np.array([points[key(x)] for x in sj['gasXYZ']])
    assert len(si)+len(gi)==len(points)
    return si,gi

def main():
    rows=json.loads((P/'results.json').read_text())['rows']
    comparisons=[]
    for sj in rows:
        fp=P/'openfoam/cases'/f"level{sj['level']}-flow{sj['flowRate']}"/'fields.json'
        raw=json.loads(fp.read_text());cells=np.array(raw['cells']);of={'xyz':cells[:,:3], 'T':cells[:,3]+273.15,'uz':cells[:,4],'pressure':cells[:,5],'budget':raw['budget'],'dp':raw['dp']};si,gi=matched(sj,of)
        ot=np.array(of['T'])-273.15;ou=np.array(of['uz']);op=np.array(of['pressure'])
        st=np.array(sj['T']);gt=np.array(sj['gasT']);su=np.array(sj['U'])[:,2]
        comparison={'level':sj['level'],'flowRate':sj['flowRate'],
                    'max_solid_T_error_K':float(abs(ot[si]-st).max()),
                    'max_gas_T_error_K':float(abs(ot[gi]-gt).max()),
                    'max_uz_error_m_s':float(abs(ou[gi]-su).max()),
                    'max_pressure_error_Pa':float(abs(op[gi]-sj['pressure']).max())}
        comparisons.append(comparison)
        sj.update(of=of,si=si,gi=gi,ot=ot,ou=ou)
    (P/'si/field-comparison.json').write_text(json.dumps(comparisons,indent=2)+'\n')
    fine=[r for r in rows if r['level']==2]
    chosen=next(r for r in fine if r['flowRate']==100)
    f,axes=plt.subplots(2,3,figsize=(15,10))
    a,b,c,d,e,g=axes.flat
    for ax,letter in zip(axes.flat,'ABCDEF'):
        ax.text(.03,.96,letter,transform=ax.transAxes,va='top',weight='bold',fontsize=16)
    # A: y profile through the central gas columns, with solid cells omitted.
    xyz=np.array(chosen['gasXYZ']);su=np.array(chosen['U'])[:,2]
    x0=np.min(abs(xyz[:,0]));z0=np.min(abs(xyz[:,2]))
    mask=np.isclose(abs(xyz[:,0]),x0)&np.isclose(xyz[:,2],z0)
    yy=np.unique(xyz[mask,1])
    for sign in [-1,1]:
        y=yy[yy*sign>0]
        s=[su[mask&np.isclose(xyz[:,1],v)].mean() for v in y]
        o=[chosen['ou'][chosen['gi']][mask&np.isclose(xyz[:,1],v)].mean() for v in y]
        ends=(-3,-1) if sign<0 else (1,3)
        a.plot(np.r_[ends[0],y*1000,ends[1]],np.r_[0,np.array(o)*1000,0],color='#444444',label='OpenFOAM' if sign<0 else None)
        a.plot(y*1000,np.array(s)*1000,'o',color='#c0392b',ms=7,label='ScreenJoule' if sign<0 else None)
    a.axvspan(-1,1,color='#eeeeee',zorder=-2)
    a.set(xlabel='Transverse position (mm)',ylabel='Axial velocity\n(mm s$^{-1}$)',xlim=(-3,3),ylim=(0,11));a.legend(loc='center',fontsize=12)
    # B: independently calculated pressure drop versus throughput.
    for level,mark in [(1,'s'),(2,'o')]:
        rr=[r for r in rows if r['level']==level]
        sjp=[r['gas']['dp'] for r in rr]
        ofp=[]
        for r in rr:
            gas=np.array(r['gasXYZ']);p=np.array(r['of']['pressure'])[r['gi']]
            ofp.append(float(np.polyfit(gas[:,2],p,1)[0]*-.04))
        b.loglog([r['flowRate'] for r in rr],ofp,'-',color=['#777777','#222222'][level-1],label=f'OpenFOAM, grid {level}')
        b.loglog([r['flowRate'] for r in rr],sjp,mark,color='#c0392b',ms=7,label=f'ScreenJoule, grid {level}')
    b.set(xlabel='Actual flow (cm$^3$ min$^{-1}$)',ylabel='Pressure drop (Pa)',xlim=(.1,1000),ylim=(1e-5,.1));b.legend(fontsize=10,loc='lower right')
    # C/D: same finest-grid case, volume mean solid and velocity-weighted gas.
    for ax,phase in [(c,'solid'),(d,'gas')]:
        xx=np.array(chosen['solidXYZ'] if phase=='solid' else chosen['gasXYZ']);zs=np.unique(xx[:,2])
        idx=chosen['si'] if phase=='solid' else chosen['gi']
        ts=np.array(chosen['T'] if phase=='solid' else chosen['gasT']);to=chosen['ot'][idx]
        ws=np.ones(len(ts)) if phase=='solid' else su;wo=np.ones(len(ts)) if phase=='solid' else chosen['ou'][idx]
        ys=[np.average(ts[np.isclose(xx[:,2],z)],weights=ws[np.isclose(xx[:,2],z)]) for z in zs]
        yo=[np.average(to[np.isclose(xx[:,2],z)],weights=wo[np.isclose(xx[:,2],z)]) for z in zs]
        ax.plot(zs*1000,yo,color='#444444',label='OpenFOAM')
        ax.plot(zs[::4]*1000,np.array(ys)[::4],'o',color='#c0392b',ms=7,label='ScreenJoule')
        ax.set(xlabel='Axial position (mm)',ylabel=('Solid mean' if phase=='solid' else 'Gas bulk')+'\ntemperature (°C)',xlim=(-20,20));ax.legend(loc='lower right',fontsize=12)
    # E: the discrete solution difference, separate from continuum convergence.
    for q,col in zip([1,10,100],colors(3)):
        rr=[r for r in comparisons if r['flowRate']==q]
        e.plot([1,2],[max(r['max_gas_T_error_K'],r['max_solid_T_error_K']) for r in rr],'-o',color=col,label=str(q))
    e.set(xlabel='Grid level',ylabel='Maximum temperature\ndifference (K)',xlim=(.8,2.2),ylim=(0,1.5e-6));e.set_xticks([1,2]);e.ticklabel_format(axis='y',style='sci',scilimits=(0,0));e.legend(title='cm$^3$ min$^{-1}$',fontsize=12,title_fontsize=12,loc='best')
    # F: solid/gas separation over the flow sweep in both implementations.
    q=[r['flowRate'] for r in fine]
    for phase,col,marker in [('solid','#444444','s'),('gas','#c0392b','o')]:
        sv=[];ov=[]
        for r in fine:
            if phase=='solid':sv.append(r['stats']['avg']);ov.append(float(r['ot'][r['si']].mean()))
            else:
                xyz=np.array(r['gasXYZ']);sel=np.isclose(xyz[:,2],xyz[:,2].max());sv.append(r['gas']['outlet']);ov.append(float(np.average(r['ot'][r['gi']][sel],weights=r['ou'][r['gi']][sel])))
        g.semilogx(q,ov,'-',color=col,label='Solid mean' if phase=='solid' else 'Gas outlet')
        g.semilogx(q,sv,marker,color=col,ms=7,clip_on=False)
    g.set(xlabel='Actual flow (cm$^3$ min$^{-1}$)',ylabel='Temperature (°C)',xlim=(1,100),ylim=(25,80));g.legend(loc='center right',fontsize=12)
    save_nature(f,P/'si/gas-openfoam-comparison',panel_shape=(2,3))
    print(json.dumps(comparisons,indent=2))

if __name__=='__main__':main()
