import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
fs.mkdirSync('tests/results',{recursive:true});
const scripts=fs.readdirSync('tests/regression').filter(f=>/^test.*\.(js|mjs)$/.test(f)).sort();
for(const file of scripts){
 console.log('\nRunning '+file);
 const r=spawnSync(process.execPath,['tests/regression/'+file],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
const tests=fs.readdirSync('tests').filter(f=>f.endsWith('.mjs')).sort().map(f=>'tests/'+f);
const r=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit'});
process.exit(r.status||0);
