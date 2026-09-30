import {risk} from './core.js';
import {briefingAnalysis} from './briefing.js';
import {checkGeneratedSummary,aiErrorMessage} from './ai-format.js';
let ready=false,generating=false,epoch=0;
const active=new Set();
export function stopAI(){
 epoch++;ready=false;generating=false;
 for(const cancel of active)cancel();
 active.clear();
}
function bounded(task,timeout=60000){
 return new Promise((resolve,reject)=>{
  let timer;
  const cancel=()=>{clearTimeout(timer);reject(Error('AI request cancelled'));};
  active.add(cancel);
  timer=setTimeout(()=>{active.delete(cancel);reject(Error('Cloud AI timed out. The standard briefing remains available.'));},timeout);
  Promise.resolve(task).then(resolve,reject).finally(()=>{clearTimeout(timer);active.delete(cancel);});
 });
}
export async function enableAI(progress=()=>{}){
 const sdk=globalThis.puter;
 if(!sdk?.auth?.signIn)throw Error('Cloud AI could not load. Check your connection or use the standard briefing.');
 const current=epoch;
 progress('Complete Puter sign-in in the popup. Your account allowance is used for AI.');
 // Called directly from the Connect button so sign-in retains the user gesture.
 await bounded(sdk.auth.isSignedIn()?Promise.resolve():sdk.auth.signIn(),120000);
 if(current!==epoch)throw Error('AI connection cancelled');
 ready=true;return true;
}
export async function summarize(f,d){
 if(!ready)throw Error('Connect cloud AI first');
 if(generating)throw Error('AI is finishing another request');
 const current=epoch;generating=true;
 const baseline=risk(f,d.weather,d.flights),a=briefingAnalysis(f,d,baseline);
 const evidence=Object.values(a.priorities).join(' ')+' Next checks: '+a.checks.join('; ')+'. Data quality: '+a.quality;
 try{
  const result=await bounded(globalThis.puter.ai.chat([
   {role:'system',content:'Write a concise dispatcher briefing in three sentences using ONLY the supplied observations. Explain the main concern, relevance to the selected aircraft, and the most useful next check. Preserve uncertainty. Do not invent weather, runway queues, delay times, route, destination or clearances. Do not issue flight instructions. These are experimental screening inputs, not validated operational predictions. Return plain English, no headings.'},
   {role:'user',content:evidence}
  ],{model:'gemini-3.1-flash-lite',normalize:true,max_tokens:400,temperature:0.1}));
  if(current!==epoch)throw Error('AI request cancelled');
  const content=typeof result==='string'?result:result?.message?.content;
  const text=Array.isArray(content)?content.filter(x=>x.type==='text').map(x=>x.text).join('\n'):content;
  if(typeof text!=='string')throw Error('Cloud AI returned no text. Please retry.');
  const summary=checkGeneratedSummary(text,evidence);
  return {text:summary+'\n\nGenerated '+new Date().toISOString().slice(11,19)+' UTC · Input ages at generation: '+a.quality+'. AI-generated draft; verify against observations. Scores remain rule-based.',source:'Cloud AI · Gemini Flash Lite',risk:baseline,generatedAt:Date.now()};
 }catch(e){throw Error(aiErrorMessage(e));}finally{if(current===epoch)generating=false;}
}
