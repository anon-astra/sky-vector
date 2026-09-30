import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
import {aiErrorMessage} from './ai-format.js';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.proxy=false;
let generator=null;
self.onmessage=async({data:{id,type,messages}})=>{
 try{
  if(type==='load'){
   generator=await pipeline('text-generation','onnx-community/Qwen2.5-0.5B-Instruct',{
    device:'wasm',dtype:'q4',progress_callback:p=>{
     if(p.status==='progress')self.postMessage({id,progress:`Downloading CPU model: ${Math.round(p.progress||0)}% (${p.file})`});
    }
   });
   self.postMessage({id,result:true});
  }else if(type==='generate'){
   if(!generator)throw Error('Enable free AI first');
   const output=await generator(messages,{max_new_tokens:190,do_sample:false,repetition_penalty:1.1});
   const generated=output[0]?.generated_text;
   const text=typeof generated==='string'?generated:generated?.at(-1)?.content;
   if(typeof text!=='string'||text.trim().length<40)throw Error('The model returned an incomplete summary. Please retry.');
   self.postMessage({id,result:text.trim()});
  }
 }catch(error){self.postMessage({id,error:aiErrorMessage(error)});}
};
