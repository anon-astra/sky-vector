import {hubs} from './airports.js';
import {sample,normalizeStates,acceptSnapshot} from './core.js';
let snapshotPromise=null,snapshotAt=0,retryAfter=0,lastFailure='';
async function snapshots(){if(!snapshotPromise||Date.now()-snapshotAt>60000){snapshotAt=Date.now();snapshotPromise=fetch(new URL('../data/airspace.json',import.meta.url),{cache:'no-store',signal:AbortSignal.timeout(7000)}).then(r=>{if(!r.ok)throw Error('No published observations');return r.json()}).catch(()=>null);}return snapshotPromise;}
export async function loadSector(hub,mode){
 if(mode==='demo')return sample(hub);
 const h=hubs[hub],all=await snapshots(),d=acceptSnapshot(all?.sectors?.[hub],hub);
 if(Date.now()>=retryAfter){
  let delay=120000;
  try{
   const q=new URLSearchParams({lamin:h.lat-.7,lamax:h.lat+.7,lomin:h.lon-1,lomax:h.lon+1});
   const r=await fetch('https://opensky-network.org/api/states/all?'+q,{signal:AbortSignal.timeout(8000)});
   if(!r.ok){
    if(r.status===429){const seconds=Number(r.headers.get('X-Rate-Limit-Retry-After-Seconds'));delay=Math.max(600,Number.isFinite(seconds)?seconds:600)*1000;}
    throw Error('OpenSky returned HTTP '+r.status+(r.status===429?' (rate limit)':''));
   }
   const raw=await r.json();d.flights=normalizeStates(raw,hub);d.aircraftSource='live';d.aircraftObservedAt=raw.time*1000;retryAfter=0;lastFailure='';
  }catch(e){
   retryAfter=Date.now()+delay;
   lastFailure=e.name==='TimeoutError'?'Live request timed out':e instanceof TypeError?'Browser could not reach OpenSky (network or CORS; exact cause unavailable)':e.message;
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
