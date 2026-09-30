import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aiErrorMessage} from '../src/ai-format.js';
test('worker string rejections retain their actual error instead of undefined',()=>{assert.equal(aiErrorMessage('GPU device lost'),'GPU device lost');assert.equal(aiErrorMessage(new Error('Invalid JSON')),'Invalid JSON');assert.equal(aiErrorMessage({message:'Model failed'}),'Model failed');for(const value of [null,undefined,{},''])assert.ok(aiErrorMessage(value).length>20);});

import {checkGeneratedSummary} from '../src/ai-format.js';
test('generated summary rejects invented numbers and flight instructions',()=>{
 assert.throws(()=>checkGeneratedSummary('The aircraft is expected to experience a delay of 30 minutes.','Delay duration unknown.'));
 assert.throws(()=>checkGeneratedSummary('The dispatcher should instruct the aircraft to climb to 10000 feet.','Altitude 10000 feet.'));
 assert.equal(checkGeneratedSummary('Traffic density warrants checking current flow advisories; the runway queue is unknown.','Traffic density is elevated; runway queue unknown.'),'Traffic density warrants checking current flow advisories; the runway queue is unknown.');
});
