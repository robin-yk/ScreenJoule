import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const scripts=fs.readdirSync('.').filter(f=>/^test.*\.(js|mjs)$/.test(f)).sort();
for(const file of scripts){
 console.log('\nRunning '+file);
 const r=spawnSync(process.execPath,[file],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
const tests=fs.readdirSync('tests').filter(f=>f.endsWith('.mjs')).map(f=>'tests/'+f);
const r=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit'});
process.exit(r.status||0);
