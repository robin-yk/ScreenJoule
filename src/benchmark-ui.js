// Embedded so benchmark selection also works in the downloaded offline HTML.
const literatureRuns=/* LITERATURE RUNS */;
const benchmarkDefaults=structuredClone(params());
let selectedBenchmark=null,benchmarkSnapshot=null,loadingBenchmark=false;
function benchmarkEvidence(entry){return entry.name.startsWith('Zheng')?'Source: Table 2 transcribed | Effective resistivity calibrated from 13.04 V / 30.26 A | Thermal boundaries assumed':entry.name.startsWith('Wismann')?'Source: dimensions transcribed from the reference catalog | Constant resistivity and thermal boundaries assumed | Original SI not independently checked':'Source: resistance fit transcribed from the reference catalog | Prescribed R(T), not a validation output | Original SI not independently checked';}
function benchmarkSummary(){
 const host=$('benchmarkComparison');host.replaceChildren();host.hidden=!selectedBenchmark;if(!selectedBenchmark)return;
 const modified=JSON.stringify(params())!==benchmarkSnapshot;
 const title=document.createElement('strong');title.textContent=(modified?'Modified preset | ':'')+selectedBenchmark.name;host.append(title);
 const note=document.createElement('p');note.className='note';note.textContent=benchmarkEvidence(selectedBenchmark)+' | '+selectedBenchmark.classification+' | Original benchmark: no gas, reaction heat or enclosure; ambient and terminal sink 20 °C.';host.append(note);
 const text=document.createElement('p');text.className='note';const ref=selectedBenchmark.reference;
 let comparison=ref.I?'Reference current: '+ref.I+' A | Downstream contact temperature: '+ref.Tdown+' °C':ref.Tmax?'Transcribed maximum temperature: '+ref.Tmax+' °C':'Prescribed resistance: '+ref.resistanceFit+' | No independent temperature validation';
 if(result){const s=result.stats;comparison+=' | Calculated: '+fmt(s.I)+' A | '+fmt(s.P,2)+' W | Maximum '+fmt(s.max,1)+' °C';if(ref.I)comparison+=' | Current difference '+fmt(100*(s.I/ref.I-1),2)+'%';if(ref.Tmax)comparison+=' | Maximum difference '+fmt(s.max-ref.Tmax,1)+' K';}
 else comparison+=' | Awaiting completed calculation';
 text.textContent=comparison;host.append(text);$('benchmarkState').textContent=modified?'Modified preset':'Preset loaded';
}
const benchmarkSelect=$('benchmarkPreset');
for(let i=0;i<literatureRuns.length;i++){const o=document.createElement('option');o.value=String(i);o.textContent=literatureRuns[i].name;benchmarkSelect.append(o);}
benchmarkSelect.onchange=()=>{
 if(worker)return;
 if(benchmarkSelect.value===''){selectedBenchmark=null;benchmarkSnapshot=null;$('benchmarkState').textContent='Custom design';benchmarkSummary();return;}
 const entry=literatureRuns[Number(benchmarkSelect.value)];if(!entry)return;
 loadingBenchmark=true;
 try{
 const p={...structuredClone(benchmarkDefaults),...structuredClone(entry.params),nx:entry.params.nx||0,ny:entry.params.ny||0,nz:entry.params.nz||0,meshType:'cartesian',initialMode:'uniform',initialState:null,wall:false,flow:false,contactR:0,thermalR:0,slew:0,jlimit:0,electrodeLength:0,limitAction:'limit',rhoCurve:[],kCurve:[],cpCurve:[],electrodeRhoCurve:[],electrodeKCurve:[],electrodeCpCurve:[],parts:[],triangles:null,wallParts:[],wallTriangles:null,wallGeometry:'axial',materialSource:entry.name+' | '+entry.classification};
 if(!Array.from($('n').options).some(o=>Number(o.value)===p.n)){const o=document.createElement('option');o.value=String(p.n);o.textContent='Benchmark | '+p.n+' transverse cells';$('n').append(o);}
 loadParameters(p);selectedBenchmark=entry;benchmarkSnapshot=JSON.stringify(params());$('rhoslider').value=Math.log10(p.rho);$('field').value='T';$('worktab').click();benchmarkSummary();
 }catch(e){selectedBenchmark=null;benchmarkSnapshot=null;benchmarkSelect.value='';$('benchmarkState').textContent='Preset could not load';benchmarkSummary();status(e.message,true);}finally{loadingBenchmark=false;}
};
const invalidateBeforeBenchmark=invalidate;
invalidate=function(){invalidateBeforeBenchmark();if(!loadingBenchmark)benchmarkSummary();};
const extraResultsBeforeBenchmark=extraResults;
extraResults=function(){extraResultsBeforeBenchmark();benchmarkSummary();};
// Some existing handlers retain the original invalidate reference.
for(const event of ['input','change'])document.querySelector('.inputs').addEventListener(event,e=>{if(e.target!==benchmarkSelect&&!loadingBenchmark)benchmarkSummary();});
function benchmarkMetadata(){return selectedBenchmark?{name:selectedBenchmark.name,classification:selectedBenchmark.classification,evidence:benchmarkEvidence(selectedBenchmark),reference:selectedBenchmark.reference,baseline:JSON.parse(benchmarkSnapshot),modified:JSON.stringify(params())!==benchmarkSnapshot}:null;}
function restoreBenchmarkMetadata(meta){selectedBenchmark=meta&&literatureRuns.find(r=>r.name===meta.name)||null;benchmarkSnapshot=selectedBenchmark&&meta.baseline?JSON.stringify(meta.baseline):null;benchmarkSelect.value=selectedBenchmark?String(literatureRuns.indexOf(selectedBenchmark)):'';if(!selectedBenchmark)$('benchmarkState').textContent='Custom design';benchmarkSummary();}
$('json').onclick=()=>download('joule3d-settings.json',JSON.stringify({schema:'joule3d-draft-2',parameters:params(),stats:result?.stats,benchmark:benchmarkMetadata()},null,2),'application/json');
