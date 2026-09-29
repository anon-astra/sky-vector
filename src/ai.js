import {risk} from './core.js';
import {summaryFacts,composeBriefing} from './briefing.js';
import {aiErrorMessage} from './ai-format.js';
let worker=null,ready=false,loading=null,generating=false,sequence=0;
const pending=new Map();
function request(type,payload={},progress,timeout=180000){
 return new Promise((resolve,reject)=>{
  const id=++sequence;
  const timer=setTimeout(()=>{stopAI('AI operation timed out. Reload the model and retry.');},timeout);
  pending.set(id,{resolve,reject,progress,timer});
  worker.postMessage({id,type,...payload});
 });
}
export function stopAI(reason='AI cancelled'){
 worker?.terminate();worker=null;ready=false;loading=null;generating=false;
 for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error(reason));}
 pending.clear();
}
export async function enableAI(progress=()=>{}){
 if(ready)return true;
 if(loading)return loading;
 progress('Loading CPU AI runtime — no WebGPU required…');
 worker=new Worker(new URL('./ai-worker.js',import.meta.url),{type:'module'});
 worker.onmessage=({data})=>{
  const p=pending.get(data.id);if(!p)return;
  if(data.progress){p.progress?.(data.progress);return;}
  clearTimeout(p.timer);pending.delete(data.id);
  if(data.error)p.reject(Error(data.error));else p.resolve(data.result);
 };
 worker.onerror=e=>{e.preventDefault();stopAI('AI worker failed: '+(e.message||'Could not load the runtime. Check your connection and retry.'));};
 worker.onmessageerror=()=>stopAI('Could not read the AI worker response. Reload the model and retry.');
 loading=request('load',{},progress,600000).then(()=>{ready=true;return true;}).catch(e=>{stopAI(aiErrorMessage(e));throw e;}).finally(()=>{loading=null;});
 return loading;
}
export async function summarize(f,d){
 if(!ready)throw Error('Enable free AI first');
 if(generating)throw Error('AI is finishing another request');
 generating=true;
 const baseline=risk(f,d.weather,d.flights);
 const facts=summaryFacts(d,baseline);
 try{
  const choice=await request('generate',{messages:[
   {role:'system',content:'Select which supplied observation should lead a short briefing. Reply with exactly A for weather, B for traffic density, or C for uncertainty. Choose only from the supplied facts.'},
   {role:'user',content:`A: ${facts.A} Weather index ${baseline.weather}/100. B: ${facts.B} Traffic index ${baseline.congestion}/100. C: ${facts.C}`}
  ]});
  return {text:composeBriefing(f,d,baseline,choice),source:'Local AI · SmolLM2 · CPU',risk:baseline};
 }finally{generating=false;}
}
