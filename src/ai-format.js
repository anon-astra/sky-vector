export function aiErrorMessage(error){
 if(typeof error==='string'&&error.trim())return error;
 if(typeof error?.message==='string'&&error.message.trim())return error.message;
 if(typeof error?.error==='string'&&error.error.trim())return error.error;
 return 'The local AI engine stopped without an error description. Reload the model and try again.';
}

// Catch invented numerical observations; this is not a complete factuality check.
export function checkGeneratedSummary(text,evidence){
 const clean=text.trim();
 if(clean.length<40)throw Error('AI returned an incomplete summary');
 const numbers=s=>new Set((s.replace(/(\d),(?=\d{3})/g,'$1').match(/\d+(?:\.\d+)?/g)||[]));
 const supplied=numbers(evidence);
 for(const n of numbers(clean))if(!supplied.has(n))throw Error('AI added a number absent from the observations. The evidence-based briefing is retained.');
 if(/\b(?:turn|climb|descend|maintain)\s+(?:left|right|to|heading|flight level|\d)/i.test(clean))throw Error('AI proposed an unsupported flight instruction. The evidence-based briefing is retained.');
 for(const term of ['inversion','icing','crosswind','windshear','thunderstorm','storm','fog','snow','rain','visibility','ceiling','gust','temperature']){
  if(new RegExp('\\b'+term,'i').test(clean)&&!new RegExp('\\b'+term,'i').test(evidence))throw Error('AI introduced an unsupported condition. The evidence-based briefing is retained.');
 }
 if(/normal conditions|minimal adverse|safe to|no (?:significant )?turbulence/i.test(clean))throw Error('AI added an unsupported reassurance. The evidence-based briefing is retained.');
 return clean;
}
