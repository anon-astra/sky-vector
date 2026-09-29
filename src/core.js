import {hubs} from './airports.js';
import {briefingAnalysis,composeBriefing} from './briefing.js';
export function demo(hub){const h=hubs[hub];return Array.from({length:24},(_,i)=>({id:'demo'+i,callsign:['DAL204','BAW117','JBU602','AAL106','UAL918','VIR3'][i%6]+(i>5?i:''),lat:h.lat+Math.sin(i*2.4)*(.13+i*.018),lon:h.lon+Math.cos(i*2.4)*(.16+i*.022),altitude:2500+(i*1370)%33000,speed:180+(i*17)%280,heading:(i*53+80)%360,verticalRate:i%3===0?-750:0,observedAt:null}));}
export function risk(f,w,flights){const gust=Math.max(0,(w.gust||w.windSpeed||0)-(w.windSpeed||0));const storm=/TS|CB/.test(w.raw);const weather=Math.min(100,Math.round(12+(w.visibility<3?40:w.visibility<5?22:0)+(w.ceiling!==null&&w.ceiling<1000?30:0)+(storm?30:0)+(w.windSpeed>20?15:0)));const turbulence=Math.min(100,Math.round(12+gust*3+(storm?35:0)+(f.altitude!==null&&f.altitude<10000?12:0)));const nearby=flights.filter(a=>a.altitude!==null&&a.altitude<10000).length;return {turbulence,congestion:Math.min(100,15+nearby*3),weather,nearby,method:'Heuristic screening, not calibrated probabilities',evidence:[`Surface wind ${w.windSpeed} kt; gust spread ${gust} kt`,`${nearby} aircraft below 10,000 ft in sector`,`${w.visibility} mi visibility; ${w.ceiling===null?'no BKN/OVC ceiling reported':w.ceiling+' ft ceiling'}`]};}
export function sample(hub){return {hub,flights:demo(hub),aircraftSource:'demo',weatherSource:'demo',fetchedAt:Date.now(),aircraftObservedAt:null,issues:[],weather:{raw:hubs[hub].icao+' 291651Z 22018G28KT 5SM -RA BKN025 OVC040 19/16 A2992',windSpeed:18,gust:28,windDirection:220,visibility:5,ceiling:2500,temperature:19,observedAt:null}};}
export function normalizeStates(d,hub,now=Date.now()) {
 if(!Number.isFinite(d.time)||now/1000-d.time>180)throw Error('Stale aircraft feed');
 if(d.states!==null&&!Array.isArray(d.states))throw Error('Invalid aircraft feed');
 const h=hubs[hub];
 return (d.states||[]).filter(s=>Number.isFinite(s[5])&&Number.isFinite(s[6])&&!s[8]&&s[3]&&now/1000-s[3]<180&&Math.abs(s[6]-h.lat)<=.7&&Math.abs(s[5]-h.lon)<=1).map(s=>({id:s[0],callsign:s[1]?.trim()||s[0],lat:s[6],lon:s[5],altitude:s[7]==null?null:Math.round(s[7]*3.28084),speed:s[9]==null?null:Math.round(s[9]*1.94384),heading:s[10]??0,verticalRate:s[11]==null?null:Math.round(s[11]*196.85),observedAt:s[3]*1000}));
}
export function normalizeWeather(w,now=Date.now()) {
 if(!w||!Number.isFinite(w.obsTime)||now/1000-w.obsTime>7200||typeof w.rawOb!=='string')throw Error('Missing or stale METAR');
 const ceilings=(w.clouds||[]).filter(c=>['BKN','OVC','VV'].includes(c.cover)&&Number.isFinite(c.base)).map(c=>c.base);
 let visibility=parseFloat(w.visib);if(!Number.isFinite(visibility))throw Error('METAR visibility unavailable');
 return {raw:w.rawOb,windSpeed:w.wspd??0,gust:w.wgst??null,windDirection:w.wdir??'VRB',visibility,ceiling:ceilings.length?Math.min(...ceilings):null,temperature:w.temp??null,observedAt:w.obsTime*1000};
}
export function acceptSnapshot(saved,hub,now=Date.now()) {
 const d=sample(hub);
 if(!saved||saved.hub!==hub)return d;
 if(saved.aircraftSource!=='demo'&&Array.isArray(saved.flights)&&Number.isFinite(saved.aircraftObservedAt)&&now-saved.aircraftObservedAt<45*60*1000){d.flights=saved.flights;d.aircraftSource='snapshot';d.aircraftObservedAt=saved.aircraftObservedAt;}
 if(saved.weatherSource!=='demo'&&saved.weather?.observedAt&&now-saved.weather.observedAt<7200000){d.weather=saved.weather;d.weatherSource='snapshot';}
 return d;
}
export function ruleBrief(f,d){const r=risk(f,d.weather,d.flights);return {source:'Evidence-based briefing · rule-based',risk:r,text:composeBriefing(f,d,r,briefingAnalysis(f,d,r).lead)};}
export function validateAI(raw){const p=JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g,''));if(typeof p.briefing!=='string'||p.briefing.length<20||p.briefing.length>5000||!['turbulence','congestion','weather'].every(k=>Number.isInteger(p.scores?.[k])&&p.scores[k]>=1&&p.scores[k]<=100))throw Error('Invalid model output');return p;}
