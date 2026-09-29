import {mkdir,cp,copyFile,writeFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('src','dist/src',{recursive:true});await copyFile('index.html','dist/index.html');await writeFile('dist/.nojekyll','');
try{await cp('data','dist/data',{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
console.log('Built dist/ — portable static files, no server required.');
