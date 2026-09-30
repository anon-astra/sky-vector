import{test}from'node:test';import assert from'node:assert/strict';
import{enableAI,summarize,stopAI}from'../src/ai.js';import{sample}from'../src/core.js';
test('cloud generation allocates no model worker and handles normalized provider output',async()=>{
 globalThis.Worker=class{constructor(){throw Error('Local workers forbidden');}};
 let options;globalThis.puter={auth:{isSignedIn:()=>true,signIn:async()=>{}},ai:{chat:async(messages,o)=>{options=o;assert.equal(messages.length,2);return {message:{content:'Review current weather observations and traffic advisories with dispatch; actual delays remain unknown.'}};}}};
 await enableAI();const d=sample('JFK'),r=await summarize(d.flights[0],d);assert.match(r.source,/Cloud AI/);assert.equal(options.normalize,true);stopAI();
});
test('a rejected sign-in leaves the standard briefing usable',async()=>{
 globalThis.puter={auth:{isSignedIn:()=>false,signIn:()=>Promise.reject(Error('Sign-in cancelled'))}};
 await assert.rejects(enableAI(),/Sign-in cancelled/);stopAI();
});
test('disconnect rejects pending requests without waiting for the provider',async()=>{
 globalThis.puter={auth:{isSignedIn:()=>true,signIn:async()=>{}},ai:{chat:()=>new Promise(()=>{})}};
 await enableAI();const d=sample('JFK'),p=summarize(d.flights[0],d);stopAI();await assert.rejects(p,/cancelled/);
});
