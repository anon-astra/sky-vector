import{chromium}from'playwright';
const browser=await chromium.launch({args:['--disable-gpu','--js-flags=--max-old-space-size=128']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const forbidden=[];page.on('request',r=>{if(/huggingface|onnxruntime|transformers.*\.js|\.onnx(?:\?|$)|\.wasm(?:\?|$)|ai-worker\.js/i.test(r.url()))forbidden.push(r.url());});
 let crashed=false;page.on('crash',()=>{crashed=true});
 await page.goto('https://anon-astra.github.io/sky-vector/?cloud-test='+Date.now(),{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Connect cloud AI',exact:true}).waitFor({timeout:60000});
 await page.waitForFunction(()=>Boolean(globalThis.puter?.ai?.chat),{},{timeout:30000});
 console.log('Actual Puter SDK loaded; no account authenticated');
 // UI transport mock: never use a test account or claim real provider generation.
 await page.evaluate(()=>{globalThis.puter={auth:{isSignedIn:()=>true,signIn:async()=>{}},ai:{chat:async()=>({message:{content:'Review current weather observations and traffic advisories with dispatch; actual delays remain unknown.'}})}};});
 await page.getByRole('button',{name:'Connect cloud AI',exact:true}).click();
 await page.getByRole('button',{name:'Generate with AI',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.briefing .source')?.textContent.includes('Cloud AI'),{},{timeout:10000});
 const text=await page.locator('.briefing p').innerText();
 await page.getByRole('button',{name:'Refresh sector',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('button[aria-label="Refresh sector"]')?.disabled);
 if(await page.locator('.briefing p').innerText()!==text)throw Error('Refresh discarded AI text');
 await page.getByRole('button',{name:'Disconnect AI',exact:true}).click();
 await page.getByRole('button',{name:'Connect cloud AI',exact:true}).waitFor();
 if(crashed||forbidden.length)throw Error('Local inference detected: '+JSON.stringify(forbidden));
 console.log('PASS: mobile UI, cloud response mock, refresh and disconnect; zero model/worker/WASM requests');
}finally{await browser.close();}
