const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const entries=require('./validation-literature.json').results;
const elements={};function el(){return {value:'',options:[],children:[],append(o){this.children.push(o);if(o.value!==undefined)this.options.push(o)},replaceChildren(){this.children=[]},addEventListener(){},click(){}}}const $=id=>elements[id]||(elements[id]=el());
let current={contactR:99,flow:true,wall:true,nx:90,rhoCurve:[[20,99]],electrodeLength:4},loaded;
const ctx={structuredClone,JSON,Math,Number,Array,document:{createElement:el,querySelector:el},$,params:()=>current,worker:null,result:null,fmt:String,loadParameters:p=>{loaded=p;current=structuredClone(p)},invalidate(){},extraResults(){},status:s=>{throw Error(s)}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/benchmark-ui.js','utf8').replace('/* LITERATURE RUNS */',JSON.stringify(entries)),ctx);
for(let i=0;i<entries.length;i++){$('benchmarkPreset').value=String(i);$('benchmarkPreset').onchange();assert.equal(loaded.command,entries[i].params.command);assert.equal(loaded.flow,false);assert.equal(loaded.wall,false);assert.equal(loaded.contactR,0);assert.equal(loaded.electrodeLength,0);assert.equal(loaded.rhoCurve.length,0);assert.equal(loaded.nx,entries[i].params.nx||0);assert.equal($('benchmarkState').textContent,'Preset loaded');current.command++;ctx.invalidate();assert.equal($('benchmarkState').textContent,'Modified preset');}
console.log('10 preset selections reset prior settings and detect modified inputs.');
