import {risk} from './core.js';
import {briefingAnalysis} from './briefing.js';
import {checkGeneratedSummary} from './ai-format.js';
import {aiErrorMessage} from './ai-format.js';
let worker=null,ready=false,loading=null,generating=false,sequence=0;
const pending=new Map();
function request(type,payload={},progress,timeout=300000){
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
 const a=briefingAnalysis(f,d,baseline);
 const evidence=Object.values(a.priorities).join(' ')+' Next checks: '+a.checks.join('; ')+'. Data: '+a.quality;
 try{
  const text=await request('generate',{messages:[
   {role:'system',content:'Write a concise dispatcher briefing in your own words using ONLY the evidence supplied. Write one paragraph of three sentences: the main concern, why it matters for this aircraft, then the most useful verification step and uncertainty. Do not list all measurements. Do not invent weather, airport queues, delay minutes, destination or clearances. Do not issue flight instructions. Sector aircraft counts are not runway queues. A METAR is not en-route turbulence evidence. Do not add headings or repeat the source paragraphs verbatim.'},
   {role:'user',content:evidence}
  ]});
  const summary=checkGeneratedSummary(text,evidence);
  return {text:summary+'\n\nBased on: '+a.quality+'. AI-generated draft; verify against the observed data. Scores remain rule-based.',source:'Local AI · Qwen 2.5 · CPU',risk:baseline,generatedAt:Date.now()};

 }finally{generating=false;}
}
