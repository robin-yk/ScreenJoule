from pathlib import Path
import numpy as np,json
b=Path(__file__).resolve().parent
rows=[]
for sj in json.loads((b.parent/'results.json').read_text())['rows']:
 p=b/'cases'/f"level{sj['level']}-flow{sj['flowRate']}"; of=json.loads((p/'fields.json').read_text()); a=np.array(of['cells']); lut={tuple(np.round(v[:3],11)):i for i,v in enumerate(a)}
 def indices(x):return np.array([lut[tuple(np.round(q,11))] for q in x])
 si=indices(sj['solidXYZ']);gi=indices(sj['gasXYZ']); gj=np.array(sj['gasXYZ']); ui=np.array(sj['U'])[:,2];last=np.isclose(gj[:,2],gj[:,2].max());area=.02/sj['mesh'][0]*.006/sj['mesh'][1]
 out=np.sum(a[gi[last],3]*a[gi[last],4])/np.sum(a[gi[last],4]);qout=np.sum(a[gi[last],4])*area
 row=dict(level=sj['level'],flowRate=sj['flowRate'],case=str(p.relative_to(b)),dp=of['dp'],outlet=out,solidMean=float(a[si,3].mean()),solidMax=float(a[si,3].max()),Qout=qout,budget=of['budget'],energyResidual=sum(of['budget'].values())-1,maxVelocityError=float(np.max(abs(a[gi,4]-ui))),maxPressureError=float(np.max(abs(a[gi,5]-sj['pressure']))),maxSolidTemperatureError=float(np.max(abs(a[si,3]-sj['T']))),maxGasTemperatureError=float(np.max(abs(a[gi,3]-sj['gasT']))),dpRelativeError=abs(of['dp']/sj['gas']['dp']-1),outletError=out-sj['gas']['outlet'],massRelativeError=abs(qout/(sj['flowRate']/6e7)-1),cells=len(a))
 rows.append(row)
 assert 'Mesh OK' in (p/'mesh-check.log').read_text()
 assert row['massRelativeError']<1e-9
 assert abs(row['energyResidual'])<1e-7
 assert row['maxVelocityError']<1e-9
 assert row['maxPressureError']<1e-10
 assert row['maxSolidTemperatureError']<1e-5
 assert row['maxGasTemperatureError']<1e-5
 print(json.dumps(row))
(b/'comparison.json').write_text(json.dumps({'method':'OpenFOAM 2512 fully-developed Stokes and 3D conjugate energy; harmonic conduction; first-order upwind advection','temperatureUnit':'degC','rows':rows},indent=2))
