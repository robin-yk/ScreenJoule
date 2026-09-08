from pathlib import Path
import shutil,json,re
root=Path(__file__).resolve().parent
out=root/'dist/suite';out.mkdir(exist_ok=True)
source=root/'src/suite-upstream'
# Retain upstream attribution in source and generated distributions.
shutil.copyfile(root/'LICENSE',out/'LICENSE')
shutil.copyfile(root/'LICENSE',root/'dist/LICENSE')
shutil.copyfile(source/'PROVENANCE.json',out/'PROVENANCE.json')
(out/'package.json').write_text('{"type":"module"}\n')
for f in ['solver.js','crosscheck.js']:
 shutil.copyfile(source/f,out/f)
shutil.copytree(source/'data',out/'data',dirs_exist_ok=True)
shutil.copyfile(root/'src/suite-worker.js',out/'worker.js')
shutil.copyfile(root/'src/suite-theme.css',out/'theme.css')
shutil.copyfile(root/'src/workspace-polish.css',out/'workspace-polish.css')
s=(source/'index.html').read_text()
s=re.sub(r'<div class="author-line">.*?</div>','',s)
s=re.sub(r'<p class="section-kicker" id="jumpCite">.*?(?=</section>)','',s,flags=re.S)
s=re.sub(r'<a[^>]+href="https://github.com/robin-yk/Electrification-Suite[^"]*"[^>]*>.*?</a>','the limitations below',s,flags=re.S)
s=re.sub(r'<link[^>]+href="../../assets/fonts/[^"]+"[^>]*>','',s)
s=s.replace('</head>','<link rel="stylesheet" href="theme.css"><link rel="stylesheet" href="workspace-polish.css"></head>')
s=s.replace('    const COLORS =', (root/'src/suite-bridge.js').read_text()+'\n    const COLORS =',1)
s=s.replace('const result=solveThermal2D(eq.x,zeroD,cfg,eq.material);','const result=await workerSteady(eq.x,zeroD,cfg,eq.material);')
s=s.replace('const run=createTransientRun(eq.x,zeroD,cfg,eq.material,{','const run=await workerTransient(eq.x,zeroD,cfg,eq.material,{\n        drive:plan.drive,period:plan.period,duty:plan.duty,')
s=s.replace('while(!run.done&&performance.now()<budget) run.advance(4);','while(!run.done&&performance.now()<budget) await run.advance(4);')
s=s.replace('const result=run.result();','const result=await run.result();')
s=s.replace('const zeroD=currentResult(),cfg=get2DConfig();','const zeroD=currentResult(),cfg=get2DConfig(),requestedSignature=signature2D(zeroD.input,zeroD.material);')
s=s.replace('result.signature=signature2D(zeroD.input,zeroD.material);','result.signature=requestedSignature; if(requestedSignature!==signature2D(currentResult().input,currentResult().material)){pendingAutoSolve2D=true;return;}')
s=s.replace('function updateAll() {\n      let result = currentResult();', '''let updateSerial=0;
    async function updateAll() {
      const serial=++updateSerial;let result;
      try{result=document.documentElement.dataset.dimension==='0d'?await workerCall('zero',[baseInputs()]):currentResult();}catch(e){const note=document.querySelector('.workspace-note');if(note)note.textContent='Calculation failed: '+e.message;return;}
      if(serial!==updateSerial)return;''')
s=s.replace('    init();',(root/'src/figures.js').read_text()+'\n'+(root/'src/figure-ui.js').read_text()+'\n'+(root/'src/suite-figures.js').read_text()+'\n    init();\n'+(root/'src/suite-sweep.js').read_text()+'\n'+(root/'src/suite-adapter.js').read_text().replace('window.innerHeight-map.getBoundingClientRect().top-152','Math.min(650,window.innerHeight-map.getBoundingClientRect().top-270)')+'\n'+(root/'src/workspace-polish.js').read_text(),1)
# Color rendering only; numerical solvers and temperature normalization are unchanged.
s=s.replace('const render=()=>{if(!state)return;','const render=()=>{if(!state)return;return renderSuiteSweep(state,$("unifiedOutput").value,fields);',1)
s=s.replace('[[16,42,67],[40,120,165],[88,184,177],[235,190,70],[211,55,55]]','[[22,13,61],[89,18,105],[168,46,94],[232,91,56],[253,164,45],[246,251,164]]')
# A single temperature is represented by a single color, without a false spatial gradient.
s=s.replace('const light = toRgb(mix(base, [255,255,255], 0.34));','const light = toRgb(base);').replace('const lighter = toRgb(mix(base, [255,255,255], 0.55));','const lighter = toRgb(base);').replace('const dark = toRgb(mix(base, [0,0,0], 0.32));','const dark = toRgb(base);')
# Replace typographic separators, leaving unit multiplication dots intact.
s=s.replace(' · ',' | ')
s=s.replace("Wismann's tube is the only case with a measured element temperature","The Wismann comparison uses the transcribed maximum element temperature")
for dim in ['0d','2d']:
 page=s.replace('<html lang="en">','<html lang="en" data-dimension="'+dim+'">')
 page=re.sub(r'<title>.*?</title>','<title>ScreenJoule | '+dim.upper()+' workspace</title>',page,count=1)
 (out/('joule'+dim+'.html')).write_text(page)
shutil.copyfile(root/'src/home.html',root/'dist/index.html')
print('Built independent Joule0D / Joule2D workspaces and shared homepage')
