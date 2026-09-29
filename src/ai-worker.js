import {pipeline,env,LogitsProcessor,LogitsProcessorList} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
import {aiErrorMessage} from './ai-format.js';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.proxy=false;
let generator=null;
self.onmessage=async({data:{id,type,messages}})=>{
 try{
  if(type==='load'){
   generator=await pipeline('text-generation','onnx-community/SmolLM2-135M-Instruct-ONNX-MHA',{
    device:'wasm',dtype:'q8',progress_callback:p=>{
     if(p.status==='progress')self.postMessage({id,progress:`Downloading CPU model: ${Math.round(p.progress||0)}% (${p.file})`});
    }
   });
   self.postMessage({id,result:true});
  }else if(type==='generate'){
   if(!generator)throw Error('Enable free AI first');
   const allowed=['A','B','C'].map(letter=>{const ids=generator.tokenizer.encode(letter,{add_special_tokens:false});if(ids.length!==1)throw Error('Unsupported model choice token');return ids[0];});
   class ChoiceOnly extends LogitsProcessor{
    _call(input_ids,logits){for(let i=0;i<input_ids.length;i++){const row=logits[i].data;const scores=allowed.map(id=>row[id]);row.fill(-Infinity);allowed.forEach((id,j)=>{row[id]=scores[j];});}return logits;}
   }
   const processors=new LogitsProcessorList();processors.push(new ChoiceOnly());
   const output=await generator(messages,{max_new_tokens:1,do_sample:false,logits_processor:processors});
   const generated=output[0]?.generated_text;
   const text=typeof generated==='string'?generated:generated?.at(-1)?.content;
   if(!['A','B','C'].includes(text?.trim()))throw Error('The model could not select an evidence-based summary. Please retry.');
   self.postMessage({id,result:text.trim()});
  }
 }catch(error){self.postMessage({id,error:aiErrorMessage(error)});}
};
