import {sample,acceptSnapshot} from './core.js';
let snapshotPromise=null,snapshotAt=0,retryAfter=0,lastFailure='';
async function snapshots(){if(!snapshotPromise||Date.now()-snapshotAt>60000){snapshotAt=Date.now();snapshotPromise=fetch(new URL('../data/airspace.json',import.meta.url),{cache:'no-store',signal:AbortSignal.timeout(7000)}).then(r=>{if(!r.ok)throw Error('No published observations');return r.json()}).catch(()=>null);}return snapshotPromise;}
export async function loadSector(hub,mode){
 if(mode==='demo')return sample(hub);
 const all=await snapshots(),d=acceptSnapshot(all?.sectors?.[hub],hub);
 if(Date.now()>=retryAfter){
  try{
   const endpoint='https://skyvector-airspace.anon69f.chatgpt.site/api/live?hub='+encodeURIComponent(hub);
   const r=await fetch(endpoint,{mode:'cors',credentials:'omit',signal:AbortSignal.timeout(25000)});
   if(!r.ok)throw Error('Aircraft proxy returned HTTP '+r.status);
   if(!r.headers.get('Content-Type')?.includes('application/json'))throw Error('Aircraft proxy requires public access');
   const live=await r.json();
   if(live.hub!==hub)throw Error('Wrong sector returned by proxy');
   if(live.weatherSource==='live'&&live.weather?.observedAt&&Date.now()-live.weather.observedAt<7200000){d.weather=live.weather;d.weatherSource='live';}
   if(live.aircraftSource==='live'&&Array.isArray(live.flights)&&Number.isFinite(live.aircraftObservedAt)&&Date.now()-live.aircraftObservedAt<180000){
    d.flights=live.flights;d.aircraftSource='live';d.aircraftProvider=live.aircraftProvider||'ADS-B';d.aircraftObservedAt=live.aircraftObservedAt;retryAfter=0;lastFailure='';
   }else{
    retryAfter=Date.now()+Math.max(60,Number(live.retryAfterSeconds)||60)*1000;
    lastFailure=live.issues?.filter(x=>/^(OpenSky|ADSB)/.test(x)).join('; ')||'No current aircraft observations from the source';
   }
  }catch(e){
   retryAfter=Date.now()+120000;
   lastFailure=e.name==='TimeoutError'?'Live proxy request timed out':e instanceof TypeError?'Live proxy is unreachable or not publicly accessible':e.message;
  }
 }
 if(d.aircraftSource==='snapshot'){
  const age=Math.max(0,Math.floor((Date.now()-d.aircraftObservedAt)/60000));
  d.issues.push('Real aircraft observations · '+(age<1?'less than 1 minute':age+' minutes')+' old. Scheduled snapshots refresh about every 15 minutes; this is not live tracking.');
 }
 if(d.aircraftSource!=='live'&&lastFailure)d.issues.push(lastFailure+'. Next live attempt in '+Math.max(1,Math.ceil((retryAfter-Date.now())/1000))+' seconds.');
 if(d.aircraftSource==='demo')d.issues.push('No fresh aircraft observations available: showing simulated positions.');
 if(d.weatherSource==='demo')d.issues.push('No fresh METAR available: showing simulated weather.');
 d.fetchedAt=Date.now();return d;
}
