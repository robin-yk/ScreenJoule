// Equivalent constant-area insulation screening. Power is delivered heater power.
const sigma = 5.670374419e-8;
export function assessInsulation({area, power, duty=0, targetC, ambientC=20, h=12, emissivity=.8, k=.1, maxMm=50}) {
  if (![area,power,duty,targetC,ambientC,h,emissivity,k,maxMm].every(Number.isFinite)) throw Error('All inputs must be finite.');
  if (area<=0 || power<=0 || duty<0 || duty>=power || h<=0 || k<=0 || maxMm<=0 || emissivity<0 || emissivity>1 || ambientC<=-273.15 || targetC<=ambientC) throw Error('Use positive area, h, k and thickness range; temperature must exceed ambient and process duty must be below heater power.');
  const ambient=ambientC+273.15, target=targetC+273.15, net=power-duty, flux=net/area;
  const loss=s=>h*(s-ambient)+emissivity*sigma*(s**4-ambient**4);
  let lo=ambient,hi=ambient+flux/h;
  for(let n=0;n<100;n++){const mid=(lo+hi)/2;if(loss(mid)<flux)lo=mid;else hi=mid;}
  const outer=(lo+hi)/2, resistance=(target-outer)/flux;
  const exposedPower=area*loss(target)+duty;
  const requiredMm=Math.max(0,resistance)*k*1000;
  const samples=Array.from({length:41},(_,i)=>{const mm=maxMm*i/40;return {mm,tempC:outer+flux*(mm/1000/k)-273.15};});
  return {netPower:net,outerC:outer-273.15,resistance:Math.max(0,resistance),requiredMm,exposedPower,
    status:resistance<=0?'no-insulation-needed':'finite-layer',samples};
}
