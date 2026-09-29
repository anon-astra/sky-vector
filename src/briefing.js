export function summaryFacts(d,r){
 const w=d.weather;
 return {
  A:`Surface weather: wind ${w.windSpeed} kt${w.gust==null?' (gust not reported)':', gust '+w.gust+' kt'}, visibility ${w.visibility} mi, ${w.ceiling==null?'no ceiling reported':'ceiling '+w.ceiling+' ft'}.`,
  B:`Sector traffic: ${r.nearby} observed aircraft below 10,000 ft; this indicates regional density, not a runway queue.`,
  C:'METAR cannot establish en-route turbulence or predict delay duration.'
 };
}
export function composeBriefing(f,d,r,choice){
 if(!['A','B','C'].includes(choice))throw Error('Invalid AI priority');
 const facts=summaryFacts(d,r);
 const order=[choice,...['A','B','C'].filter(k=>k!==choice)];
 return `${f.callsign} — ${order.map(k=>facts[k]).join(' ')} ${d.aircraftSource==='demo'||d.weatherSource==='demo'?'Includes simulated inputs.':d.aircraftSource==='snapshot'?'Aircraft positions are a timestamped snapshot, not live tracking.':''} AI prioritizes these observations; scores are rule-based screening indices. Verify official weather and ATC advisories before operational decisions.`;
}
