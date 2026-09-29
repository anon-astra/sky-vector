export function aiErrorMessage(error){
 if(typeof error==='string'&&error.trim())return error;
 if(typeof error?.message==='string'&&error.message.trim())return error.message;
 if(typeof error?.error==='string'&&error.error.trim())return error.error;
 return 'The local AI engine stopped without an error description. Reload the model and try again.';
}
