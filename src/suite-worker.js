import {calculate,solveThermal2D,createTransientRun} from './solver.js';
let transient;
const wire=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='function'?undefined:v));
self.onmessage=e=>{const {id,type,args}=e.data;try{let result;
 if(type==='zero')result=calculate(args[0]);
 else if(type==='steady')result=solveThermal2D(...args);
 else if(type==='start'){const [x,z,c,m,p]=args,{drive,period,duty}=p;const onBefore=t=>{const cycles=Math.floor(t/period);return cycles*duty*period+Math.min(Math.max(t-cycles*period,0),duty*period);};p.sourceScale=drive==='off'?()=>0:drive==='pulse'?t=>((t-1e-9)%period)/period<duty?1:0:()=>1;p.sourceIntegral=drive==='pulse'?(a,b)=>b>a?(onBefore(b)-onBefore(a))/(b-a):0:null;transient=createTransientRun(x,z,c,m,p);result=transient.errors?.length?{errors:transient.errors}:{done:transient.done,t:transient.t,stepsDone:transient.stepsDone,history:transient.history};}
 else if(type==='advance'){if(!transient)throw Error('No active transient');transient.advance(args[0]);result={done:transient.done,t:transient.t,stepsDone:transient.stepsDone,history:transient.history};}
 else if(type==='result'){result=transient.result();transient=null;}
 else throw Error('Unknown calculation');
 self.postMessage({id,result:wire(result)});
 }catch(error){self.postMessage({id,error:error.message});}};
