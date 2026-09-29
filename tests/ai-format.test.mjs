import {test} from 'node:test';
import assert from 'node:assert/strict';
import {briefingFormat,aiErrorMessage} from '../src/ai-format.js';
import {validateAI} from '../src/core.js';
test('generation constrains every field consumed by the briefing UI',()=>{
 const s=JSON.parse(briefingFormat.schema);
 assert.equal(briefingFormat.type,'json_object');
 assert.deepEqual(s.required,['briefing','scores']);
 assert.deepEqual(s.properties.scores.required,['turbulence','congestion','weather']);
 assert.equal(s.additionalProperties,false);
 for(const key of s.properties.scores.required){assert.equal(s.properties.scores.properties[key].type,'integer');assert.equal(s.properties.scores.properties[key].minimum,1);assert.equal(s.properties.scores.properties[key].maximum,100);}
});
test('bad, incomplete and out-of-range model output is not shown as an AI result',()=>{
 for(const raw of ['{"briefing":','{}',JSON.stringify({briefing:'Review the current weather observations.',scores:{turbulence:20,congestion:20,weather:101}})])assert.throws(()=>validateAI(raw));
 assert.equal(validateAI(JSON.stringify({briefing:'Review the current weather observations.',scores:{turbulence:20,congestion:20,weather:20}})).scores.weather,20);
});

test('worker string rejections retain their actual error instead of undefined',()=>{assert.equal(aiErrorMessage('GPU device lost'),'GPU device lost');assert.equal(aiErrorMessage(new Error('Invalid JSON')),'Invalid JSON');assert.equal(aiErrorMessage({message:'Model failed'}),'Model failed');for(const value of [null,undefined,{},''])assert.ok(aiErrorMessage(value).length>20);});
