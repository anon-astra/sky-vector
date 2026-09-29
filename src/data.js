import {sample,acceptSnapshot} from './core.js';
let snapshotPromise=null,snapshotAt=0,lastGood=null;
async function snapshots(){
 if(!snapshotPromise||Date.now()-snapshotAt>30000){
  snapshotAt=Date.now();
  snapshotPromise=fetch(new URL('../data/airspace.json',import.meta.url),{cache:'no-store',signal:AbortSignal.timeout(7000)})
   .then(async r=>{if(!r.ok)throw Error('Observations unavailable');const d=await r.json();if(!d.sectors)throw Error('Invalid observations');lastGood=d;return d;}).catch(()=>lastGood);
 }
 return snapshotPromise;
}
export async function loadSector(hub,mode){
 if(mode==='demo')return sample(hub);
 const all=await snapshots(),d=acceptSnapshot(all?.sectors?.[hub],hub);
 if(d.aircraftSource==='demo')d.issues.push('Current aircraft observations are unavailable. Showing explicitly simulated positions; choose another sector or try again shortly.');
 if(d.weatherSource==='demo')d.issues.push('No fresh METAR available: weather values are simulated.');
 d.fetchedAt=Date.now();return d;
}
