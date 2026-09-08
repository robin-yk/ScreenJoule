from pathlib import Path
root=Path(__file__).resolve().parent
(root/'dist').mkdir(exist_ok=True)
html=(root/'src/page.html').read_text().replace('<!-- METHOD -->',(root/'src/method.html').read_text())
html=html.replace('</head>','<style>'+(root/'src/workspace-polish.css').read_text()+'</style></head>')
for marker,name in [('/* ENGINE */','engine.js'),('/* APP */','app.js')]:
    code=(root/'src'/name).read_text()
    if name=='engine.js': code=(root/'src/flow.js').read_text()+'\n'+(root/'src/wall3d.js').read_text()+'\n'+code
    if name=='app.js': code=(root/'src/materials.js').read_text()+'\n'+(root/'src/figures.js').read_text()+'\n'+(root/'src/figure-ui.js').read_text()+'\n'+code; code+='\n'+(root/'src/enhancements.js').read_text()+'\n'+(root/'src/screening-core.js').read_text()+'\n'+(root/'src/screening.js').read_text()+'\n'+(root/'src/material-ui.js').read_text()
    if name=='app.js':
        import json
        runs=[{k:r[k] for k in ['name','params','reference','classification']} for r in json.loads((root/'validation-literature.json').read_text())['results']]
        code+='\n'+(root/'src/benchmark-ui.js').read_text().replace('/* LITERATURE RUNS */',json.dumps(runs))
    if name=='app.js': code+='\n'+(root/'src/workspace-polish.js').read_text()+'\n'+(root/'src/shared-3d.js').read_text()
    html=html.replace(marker,code)
(root/'dist/joule3d.html').write_text(html.replace('</head>','<style>body>header{display:none}</style></head>').replace('href="index.html" download=','href="joule3d.html" download='))
print('Built self-contained dist/joule3d.html')

import shutil
shutil.copyfile(root/"validation-literature.json", root/"dist/validation-literature.json")

exec(compile((root/"build-suite.py").read_text(),str(root/"build-suite.py"),"exec"))
