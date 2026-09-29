import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aiErrorMessage} from '../src/ai-format.js';
test('worker string rejections retain their actual error instead of undefined',()=>{assert.equal(aiErrorMessage('GPU device lost'),'GPU device lost');assert.equal(aiErrorMessage(new Error('Invalid JSON')),'Invalid JSON');assert.equal(aiErrorMessage({message:'Model failed'}),'Model failed');for(const value of [null,undefined,{},''])assert.ok(aiErrorMessage(value).length>20);});
