import {mkdir,writeFile} from 'node:fs/promises';
import {hubs} from '../src/airports.js';
import {sample,acceptSnapshot,normalizeStates,normalizeWeather} from '../src/core.js';
async function json(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
const errors=[];let headers={};
if(process.env.OPENSKY_CLIENT_ID&&process.env.OPENSKY_CLIENT_SECRET){try{const token=await json('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',{method:'POST',body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.OPENSKY_CLIENT_ID,client_secret:process.env.OPENSKY_CLIENT_SECRET})});headers={Authorization:'Bearer '+token.access_token};}catch{errors.push('OpenSky authentication unavailable');}}
// One global call costs 4 OpenSky credits rather than 21 per-sector calls.
const [air,wx,previous]=await Promise.allSettled([json('https://opensky-network.org/api/states/all',{headers}),json('https://aviationweather.gov/api/data/metar?ids='+Object.values(hubs).map(h=>h.icao).join(',')+'&format=json'),json('https://anon-astra.github.io/sky-vector/data/airspace.json')]);
if(air.status==='rejected')errors.push('OpenSky unavailable: '+air.reason.message);
if(wx.status==='rejected')errors.push('METAR unavailable: '+wx.reason.message);
const sectors={};for(const hub of Object.keys(hubs)){const d=acceptSnapshot(previous.status==='fulfilled'?previous.value.sectors?.[hub]:null,hub);d.issues=[...errors];if(air.status==='fulfilled'){try{d.flights=normalizeStates(air.value,hub);d.aircraftSource='snapshot';d.aircraftObservedAt=air.value.time*1000;}catch(e){d.issues.push(e.message);}}if(wx.status==='fulfilled'){try{d.weather=normalizeWeather(wx.value.find(w=>w.icaoId===hubs[hub].icao));d.weatherSource='snapshot';}catch(e){d.issues.push(e.message);}}sectors[hub]=d;}
await mkdir('data',{recursive:true});await writeFile('data/airspace.json',JSON.stringify({generatedAt:Date.now(),sectors}));
console.log(JSON.stringify({sectors:Object.keys(sectors).length,aircraft:air.status,weather:wx.status,errors}));
