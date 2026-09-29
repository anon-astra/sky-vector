// ACI World, overall passenger traffic in calendar 2025 (2026 dataset).
export const rankingSource = 'https://aci.aero/resources/busiest-airports-in-the-world/';
const rows = [
['ATL','KATL','Atlanta','Hartsfield–Jackson Atlanta',33.6407,-84.4277,106302208],
['DXB','OMDB','Dubai','Dubai International',25.2532,55.3657,95192160],
['HND','RJTT','Tokyo','Tokyo Haneda',35.5494,139.7798,91679814],
['DFW','KDFW','Dallas / Fort Worth','Dallas Fort Worth International',32.8998,-97.0403,85660127],
['PVG','ZSPD','Shanghai','Shanghai Pudong International',31.1443,121.8083,84994548],
['ORD','KORD','Chicago','Chicago O’Hare International',41.9742,-87.9073,84856018],
['LHR','EGLL','London','London Heathrow',51.4700,-.4543,84482126],
['IST','LTFM','Istanbul','Istanbul Airport',41.2753,28.7519,84437710],
['CAN','ZGGG','Guangzhou','Guangzhou Baiyun International',23.3924,113.2988,83582952],
['DEN','KDEN','Denver','Denver International',39.8561,-104.6737,82427962],
['DEL','VIDP','New Delhi','Indira Gandhi International',28.5562,77.1000,78148081],
['ICN','RKSI','Seoul','Incheon International',37.4602,126.4407,74126912],
['LAX','KLAX','Los Angeles','Los Angeles International',33.9416,-118.4085,73709594],
['CDG','LFPG','Paris','Paris Charles de Gaulle',49.0097,2.5479,72029407],
['PEK','ZBAA','Beijing','Beijing Capital International',40.0799,116.6031,70742712],
['SIN','WSSS','Singapore','Singapore Changi',1.3644,103.9915,69982000],
['AMS','EHAM','Amsterdam','Amsterdam Schiphol',52.3105,4.7683,68771592],
['MAD','LEMD','Madrid','Adolfo Suárez Madrid–Barajas',40.4983,-3.5676,68118754],
['SZX','ZGSZ','Shenzhen','Shenzhen Bao’an International',22.6393,113.8107,66485213],
['KUL','WMKK','Kuala Lumpur','Kuala Lumpur International',2.7456,101.7072,63409501],
];
export const hubs = Object.fromEntries(rows.map(([iata,icao,name,airport,lat,lon,passengers],i)=>[iata,{iata,icao,name,airport,lat,lon,passengers,rank:i+1}]));
hubs.JFK={iata:'JFK',icao:'KJFK',name:'New York',airport:'John F. Kennedy International',lat:40.6413,lon:-73.7781,passengers:null,rank:null};
export const rankedHubs=Object.values(hubs).filter(h=>h.rank);
