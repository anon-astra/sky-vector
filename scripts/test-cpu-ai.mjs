import {chromium} from 'playwright';
const browser=await chromium.launch({args:['--disable-gpu','--disable-webgpu']});
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
 page.on('console',m=>{if(m.type()==='error')console.log('BROWSER ERROR',m.text().slice(0,500));});
 await page.goto('https://anon-astra.github.io/sky-vector/?cpu-test='+Date.now(),{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Enable free AI',exact:true}).waitFor({timeout:60000});
 await page.getByRole('button',{name:'Enable free AI',exact:true}).click();
 console.log('Loading real model with GPU disabled');
 await page.waitForFunction(()=>document.querySelector('.ai-controls p')?.textContent.includes('CPU AI is ready'),{},{timeout:480000});
 await page.getByRole('button',{name:'Generate with AI',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.briefing .source')?.textContent.includes('Local AI · SmolLM2 · CPU'),{},{timeout:180000});
 const briefing=await page.locator('.briefing p').innerText();
 if(!briefing.includes('Flight relevance:')||!briefing.includes('Next checks')||!briefing.includes('Data confidence'))throw Error('Missing contextual briefing sections');
 console.log('CPU AI GENERATED:',briefing);
 await page.getByRole('button',{name:'Stop AI',exact:true}).click();
 await page.getByRole('button',{name:'Enable free AI',exact:true}).waitFor();
 console.log('CPU model load, actual generation, and stop/retry UI passed');
}catch(e){console.error(e);throw e;}finally{await browser.close();}
