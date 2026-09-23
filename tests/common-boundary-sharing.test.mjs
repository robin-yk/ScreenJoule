import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('thermal wrapper preserves initial-preview options and transfers subsequent boundaries', async()=>{
  const values={commonBoundary:'local',outerAmbient:'20',outerH:'100',outerEmissivity:'0',wrapThickness:'5',wrapK:'0.1'};
  const elements=new Map(Object.entries(values).map(([id,value])=>[id,{value,addEventListener(){}}]));
  elements.set('rho',{});
  elements.set('material',{closest:()=>({before(){}})});
  elements.set('commonExternal',{});
  elements.set('wrapInputs',{});
  const calls=[];
  const context={document:{getElementById:id=>elements.get(id),createElement:()=>({})},
    window:{screenJouleShared:async(...args)=>calls.push(args),screenJouleCapture:()=>({length:15})},
    keys:[],strings:new Set(),controls(){},invalidate(){}};
  vm.runInNewContext(readFileSync(new URL('../src/common-boundary.js',import.meta.url),'utf8'),context);
  await context.window.screenJouleShared({commonBoundary:'exposed'},{initialPreview:true});
  assert.equal(elements.get('commonBoundary').value,'local');
  assert.equal(calls[0][1].initialPreview,true);
  await context.window.screenJouleShared({commonBoundary:'insulated',wrapThickness:12,outerAmbient:35});
  assert.equal(elements.get('commonBoundary').value,'insulated');
  assert.equal(elements.get('wrapThickness').value,12);
  assert.equal(elements.get('wrapInputs').hidden,false);
  const captured=context.window.screenJouleCapture();
  assert.equal(captured.commonBoundary,'insulated');
  assert.equal(captured.outerAmbient,35);
  assert.equal(captured.length,15);
});
