// Constrain the local model to the exact shape consumed by validateAI.
export const briefingFormat={type:'json_object',schema:JSON.stringify({
 type:'object',properties:{
  briefing:{type:'string'},
  scores:{type:'object',properties:{
   turbulence:{type:'integer',minimum:1,maximum:100},
   congestion:{type:'integer',minimum:1,maximum:100},
   weather:{type:'integer',minimum:1,maximum:100}
  },required:['turbulence','congestion','weather'],additionalProperties:false}
 },required:['briefing','scores'],additionalProperties:false
})};

export function aiErrorMessage(error){
 if(typeof error==='string'&&error.trim())return error;
 if(typeof error?.message==='string'&&error.message.trim())return error.message;
 if(typeof error?.error==='string'&&error.error.trim())return error.error;
 return 'The local AI engine stopped without an error description. Reload the model and try again.';
}
