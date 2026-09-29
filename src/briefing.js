import {hubs} from './airports.js';
const age=(time,now)=>Number.isFinite(time)&&time>0?Math.max(0,Math.floor((now-time)/60000))+' min old':'time unavailable';
export function briefingAnalysis(f,d,r,now=Date.now()){
 const w=d.weather,flags=[],checks=[];
 if(/TS|CB/.test(w.raw||'')){flags.push('convective activity is coded in the METAR');checks.push('Check current SIGMETs, weather radar and the TAF for convective development');}
 if(/FZ(?:RA|DZ|FG)/.test(w.raw||'')){flags.push('freezing precipitation or freezing fog is coded in the METAR');checks.push('Review current icing advisories and airport surface-condition reports');}
 else if(/(?:^|\s)[+-]?(?:SH)?(?:RA|SN|DZ|PL|GR|GS)(?:\s|$)/.test(w.raw||'')){flags.push('precipitation is coded in the METAR');checks.push('Review current runway-condition reports and the precipitation trend in the TAF');}
 if(w.visibility<5){flags.push(`visibility is reduced to ${w.visibility} mi`);checks.push('Review the latest ATIS and published approach minima with dispatch');}
 if(w.ceiling!=null&&w.ceiling<1000){flags.push(`the reported ceiling is ${w.ceiling} ft`);checks.push('Review the TAF ceiling trend and current airport operating restrictions');}
 const spread=Math.max(0,(w.gust??w.windSpeed)-w.windSpeed);
 if(spread>=8||w.windSpeed>20){flags.push(`wind is ${w.windSpeed} kt${w.gust==null?'':', gusting '+w.gust+' kt'}`);checks.push('Check current runway wind and aircraft-specific limits; crosswind cannot be calculated without the active runway');}
 const weather=flags.length?`Weather watch: ${flags.join('; ')}. These are surface-weather flags that merit an updated airport-weather review, not a prediction of delay minutes.`:`Surface weather: no elevated flags in the prototype's visibility, ceiling, wind or convection checks (${w.visibility} mi visibility; ${w.ceiling==null?'no ceiling reported':w.ceiling.toLocaleString()+' ft ceiling'}). This report alone provides no positive evidence of a weather delay.`;
 const traffic=r.nearby>=20?`Traffic watch: ${r.nearby} sector tracks are below 10,000 ft, which drives the traffic index to ${r.congestion}/100. This is an uncalibrated regional-density measure; adjacent airports and overflights are included. It cannot establish a runway queue or expected hold.`:`Traffic context: ${r.nearby} sector tracks are below 10,000 ft. The available positions do not establish airport-specific demand, runway capacity or a delay estimate.`;
 const altitude=f?.altitude;
 const trend=f?.verticalRate==null?'vertical trend unavailable':f.verticalRate < -300?`descending at ${Math.abs(f.verticalRate).toLocaleString()} ft/min`:f.verticalRate>300?`climbing at ${f.verticalRate.toLocaleString()} ft/min`:'little vertical change in the observation';
 const context=altitude==null?'Flight relevance: altitude is unavailable, so terminal versus en-route relevance cannot be assessed.':`Flight relevance: ${f.callsign} is observed at ${altitude.toLocaleString()} ft, ${trend}. ${altitude>=18000?'At this altitude, the airport METAR says little about conditions along the flight path. En-route turbulence requires route/altitude-specific PIREPs and SIGMETs.':'Surface conditions may be relevant if this flight is using the selected airport, but destination, flight phase and clearance are not supplied.'}`;
 if(r.nearby>=20)checks.push('Check official airport/ATC flow advisories for actual holds or restrictions');
 if(altitude==null||altitude>=18000)checks.push('Review route/altitude-specific PIREPs and SIGMETs before assessing turbulence');
 if(!checks.length)checks.push('Check the TAF and latest ATIS for changes since this observation; confirm current flow restrictions with dispatch');
 const priorities={A:weather,B:traffic,C:context};
 const lead=flags.length?'A':r.nearby>=20?'B':'C';
 const station=hubs[d.hub]?.icao||d.hub;
 const quality=[`Aircraft ${age(d.aircraftObservedAt,now)}`,`${station} METAR ${age(w.observedAt,now)}`];
 if(d.aircraftSource==='demo'||d.weatherSource==='demo')quality.unshift('SIMULATED INPUTS — demonstration only');
 else if(d.aircraftSource==='snapshot')quality.push('delayed positions');
 return {priorities,lead,checks:[...new Set(checks)].slice(0,3),quality:quality.join(' · ')};
}
export function summaryFacts(d,r,f){return briefingAnalysis(f,d,r).priorities;}
export function composeBriefing(f,d,r,choice,now=Date.now()){
 if(!['A','B','C'].includes(choice))throw Error('Invalid AI priority');
 const a=briefingAnalysis(f,d,r,now);
 // Observed weather flags stay first regardless of the small model's preference.
 const first=a.lead==='A'?'A':choice;
 const order=[first,...['A','B','C'].filter(k=>k!==first)];
 return `${f.callsign} / ${hubs[d.hub]?.icao||d.hub}\n${order.map(k=>a.priorities[k]).join('\n\n')}\n\nNext checks\n${a.checks.map((c,i)=>`${i+1}. ${c}.`).join('\n')}\n\nData confidence\n${a.quality}. Runway assignment, route, destination and ATC restrictions are not in this dataset. Scores are screening indices, not probabilities or flight instructions.`;
}
