import {risk} from './core.js';
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
 const facts=`Surface wind ${d.weather.windSpeed} knots, gust ${d.weather.gust??'not reported'}, visibility ${d.weather.visibility} miles, ceiling ${d.weather.ceiling??'not reported'} feet. ${baseline.nearby} aircraft below 10,000 feet in the sector. These are ${d.aircraftSource} observations. Surface weather does not establish en-route turbulence or runway queues.`;
 try{
  const text=await request('generate',{messages:[
   {role:'system',content:'Summarize only the supplied facts in two short sentences. Do not invent conditions, forecasts, probabilities, or flight instructions.'},
   {role:'user',content:facts}
  ]});
  return {text:`${f.callsign} — ${text}\n\nObserved inputs: ${facts}\nScores are rule-based screening indices, not AI probabilities. Verify official weather and ATC advisories before operational decisions.`,source:'Local AI · SmolLM2 · CPU',risk:baseline};
 }finally{generating=false;}
}
