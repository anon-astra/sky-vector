export type Place = {
  iata: string
  icao: string
  city: string
  name: string
  lat: number
  lon: number
  country: string
  tz: string
  radar: boolean
  rank: number | null
  passengers: number | null
  aliases: string[]
}

type Row = [
  iata: string,
  icao: string,
  city: string,
  name: string,
  lat: number,
  lon: number,
  country: string,
  tz: string,
  radar: boolean,
  rank: number | null,
  passengers: number | null,
  aliases: string[],
]

const rows: Row[] = [
  ["ATL", "KATL", "Atlanta", "Hartsfield–Jackson Atlanta", 33.6407, -84.4277, "United States", "America/New_York", true, 1, 106302208, ["atlanta", "atl", "hartsfield"]],
  ["DXB", "OMDB", "Dubai", "Dubai International", 25.2532, 55.3657, "United Arab Emirates", "Asia/Dubai", true, 2, 95192160, ["dubai", "dxb"]],
  ["HND", "RJTT", "Tokyo", "Tokyo Haneda", 35.5494, 139.7798, "Japan", "Asia/Tokyo", true, 3, 91679814, ["tokyo", "haneda", "hnd"]],
  ["DFW", "KDFW", "Dallas / Fort Worth", "Dallas Fort Worth International", 32.8998, -97.0403, "United States", "America/Chicago", true, 4, 85660127, ["dallas", "fort worth", "dfw", "dallas fort worth"]],
  ["PVG", "ZSPD", "Shanghai", "Shanghai Pudong", 31.1443, 121.8083, "China", "Asia/Shanghai", true, 5, 84994548, ["shanghai", "pudong", "pvg"]],
  ["ORD", "KORD", "Chicago", "Chicago O'Hare", 41.9742, -87.9073, "United States", "America/Chicago", true, 6, 84856018, ["chicago", "ohare", "o hare", "ord"]],
  ["LHR", "EGLL", "London", "London Heathrow", 51.47, -0.4543, "United Kingdom", "Europe/London", true, 7, 84482126, ["london", "heathrow", "lhr"]],
  ["IST", "LTFM", "Istanbul", "Istanbul Airport", 41.2753, 28.7519, "Turkey", "Europe/Istanbul", true, 8, 84437710, ["istanbul", "ist"]],
  ["CAN", "ZGGG", "Guangzhou", "Guangzhou Baiyun", 23.3924, 113.2988, "China", "Asia/Shanghai", true, 9, 83582952, ["guangzhou", "baiyun", "can"]],
  ["DEN", "KDEN", "Denver", "Denver International", 39.8561, -104.6737, "United States", "America/Denver", true, 10, 82427962, ["denver", "den"]],
  ["DEL", "VIDP", "New Delhi", "Indira Gandhi International", 28.5562, 77.1, "India", "Asia/Kolkata", true, 11, 78148081, ["delhi", "new delhi", "del", "igi", "indira gandhi", "palam"]],
  ["ICN", "RKSI", "Seoul", "Incheon International", 37.4602, 126.4407, "South Korea", "Asia/Seoul", true, 12, 74126912, ["seoul", "incheon", "icn"]],
  ["LAX", "KLAX", "Los Angeles", "Los Angeles International", 33.9416, -118.4085, "United States", "America/Los_Angeles", true, 13, 73709594, ["los angeles", "lax"]],
  ["CDG", "LFPG", "Paris", "Paris Charles de Gaulle", 49.0097, 2.5479, "France", "Europe/Paris", true, 14, 72029407, ["paris", "charles de gaulle", "cdg"]],
  ["PEK", "ZBAA", "Beijing", "Beijing Capital", 40.0799, 116.6031, "China", "Asia/Shanghai", true, 15, 70742712, ["beijing", "peking", "pek"]],
  ["SIN", "WSSS", "Singapore", "Singapore Changi", 1.3644, 103.9915, "Singapore", "Asia/Singapore", true, 16, 69982000, ["singapore", "changi", "sin"]],
  ["AMS", "EHAM", "Amsterdam", "Amsterdam Schiphol", 52.3105, 4.7683, "Netherlands", "Europe/Amsterdam", true, 17, 68771592, ["amsterdam", "schiphol", "ams"]],
  ["MAD", "LEMD", "Madrid", "Adolfo Suárez Madrid–Barajas", 40.4983, -3.5676, "Spain", "Europe/Madrid", true, 18, 68118754, ["madrid", "barajas", "mad"]],
  ["SZX", "ZGSZ", "Shenzhen", "Shenzhen Bao'an", 22.6393, 113.8107, "China", "Asia/Shanghai", true, 19, 66485213, ["shenzhen", "szx"]],
  ["KUL", "WMKK", "Kuala Lumpur", "Kuala Lumpur International", 2.7456, 101.7072, "Malaysia", "Asia/Kuala_Lumpur", true, 20, 63409501, ["kuala lumpur", "kl", "kul"]],
  ["JFK", "KJFK", "New York", "John F. Kennedy International", 40.6413, -73.7781, "United States", "America/New_York", true, null, null, ["new york", "nyc", "jfk", "kennedy"]],
  ["NRT", "RJAA", "Tokyo", "Tokyo Narita", 35.772, 140.3929, "Japan", "Asia/Tokyo", false, null, null, ["narita", "nrt"]],
  ["EWR", "KEWR", "Newark", "Newark Liberty", 40.6895, -74.1745, "United States", "America/New_York", false, null, null, ["newark", "ewr"]],
  ["SFO", "KSFO", "San Francisco", "San Francisco International", 37.6213, -122.379, "United States", "America/Los_Angeles", false, null, null, ["san francisco", "sfo"]],
  ["SEA", "KSEA", "Seattle", "Seattle–Tacoma", 47.4502, -122.3088, "United States", "America/Los_Angeles", false, null, null, ["seattle", "sea tac", "seatac"]],
  ["BOS", "KBOS", "Boston", "Boston Logan", 42.3656, -71.0096, "United States", "America/New_York", false, null, null, ["boston", "logan", "bos"]],
  ["MIA", "KMIA", "Miami", "Miami International", 25.7959, -80.287, "United States", "America/New_York", false, null, null, ["miami", "mia"]],
  ["IAD", "KIAD", "Washington", "Washington Dulles", 38.9531, -77.4565, "United States", "America/New_York", false, null, null, ["washington", "dulles", "iad"]],
  ["FRA", "EDDF", "Frankfurt", "Frankfurt Airport", 50.0379, 8.5622, "Germany", "Europe/Berlin", false, null, null, ["frankfurt", "fra"]],
  ["MUC", "EDDM", "Munich", "Munich Airport", 48.3538, 11.7861, "Germany", "Europe/Berlin", false, null, null, ["munich", "munchen", "muc"]],
  ["FCO", "LIRF", "Rome", "Rome Fiumicino", 41.8003, 12.2389, "Italy", "Europe/Rome", false, null, null, ["rome", "fiumicino", "fco"]],
  ["BCN", "LEBL", "Barcelona", "Barcelona–El Prat", 41.2971, 2.0785, "Spain", "Europe/Madrid", false, null, null, ["barcelona", "bcn"]],
  ["DOH", "OTHH", "Doha", "Hamad International", 25.2731, 51.6081, "Qatar", "Asia/Qatar", false, null, null, ["doha", "doh", "hamad"]],
  ["AUH", "OMAA", "Abu Dhabi", "Zayed International", 24.433, 54.6511, "United Arab Emirates", "Asia/Dubai", false, null, null, ["abu dhabi", "auh"]],
  ["BKK", "VTBS", "Bangkok", "Suvarnabhumi", 13.69, 100.7501, "Thailand", "Asia/Bangkok", false, null, null, ["bangkok", "bkk", "suvarnabhumi"]],
  ["HKG", "VHHH", "Hong Kong", "Hong Kong International", 22.308, 113.9185, "Hong Kong", "Asia/Hong_Kong", false, null, null, ["hong kong", "hkg"]],
  ["SYD", "YSSY", "Sydney", "Sydney Kingsford Smith", -33.9399, 151.1753, "Australia", "Australia/Sydney", false, null, null, ["sydney", "syd"]],
  ["MEL", "YMML", "Melbourne", "Melbourne Airport", -37.669, 144.841, "Australia", "Australia/Melbourne", false, null, null, ["melbourne", "mel"]],
  ["YYZ", "CYYZ", "Toronto", "Toronto Pearson", 43.6777, -79.6248, "Canada", "America/Toronto", false, null, null, ["toronto", "pearson", "yyz"]],
  ["GRU", "SBGR", "São Paulo", "São Paulo–Guarulhos", -23.4356, -46.4731, "Brazil", "America/Sao_Paulo", false, null, null, ["sao paulo", "são paulo", "guarulhos", "gru"]],
  ["MEX", "MMMX", "Mexico City", "Mexico City International", 19.4363, -99.0721, "Mexico", "America/Mexico_City", false, null, null, ["mexico city", "mex"]],
  ["CPT", "FACT", "Cape Town", "Cape Town International", -33.9648, 18.6017, "South Africa", "Africa/Johannesburg", false, null, null, ["cape town", "cpt"]],
  ["JNB", "FAOR", "Johannesburg", "O. R. Tambo", -26.1367, 28.2411, "South Africa", "Africa/Johannesburg", false, null, null, ["johannesburg", "joburg", "tambo", "jnb"]],
  ["CAI", "HECA", "Cairo", "Cairo International", 30.112, 31.4, "Egypt", "Africa/Cairo", false, null, null, ["cairo", "cai"]],
  ["BOM", "VABB", "Mumbai", "Chhatrapati Shivaji Maharaj", 19.0896, 72.8656, "India", "Asia/Kolkata", false, null, null, ["mumbai", "bombay", "bom", "chhatrapati", "csia"]],
  ["BLR", "VOBL", "Bengaluru", "Kempegowda International", 13.1986, 77.7066, "India", "Asia/Kolkata", false, null, null, ["bengaluru", "bangalore", "blr", "kempegowda"]],
  ["MAA", "VOMM", "Chennai", "Chennai International", 12.9941, 80.1709, "India", "Asia/Kolkata", false, null, null, ["chennai", "madras", "maa"]],
  ["HYD", "VOHS", "Hyderabad", "Rajiv Gandhi International", 17.2403, 78.4294, "India", "Asia/Kolkata", false, null, null, ["hyderabad", "hyd", "rajiv gandhi"]],
  ["CCU", "VECC", "Kolkata", "Netaji Subhas Chandra Bose", 22.6547, 88.4467, "India", "Asia/Kolkata", false, null, null, ["kolkata", "calcutta", "ccu"]],
  ["AMD", "VAAH", "Ahmedabad", "Sardar Vallabhbhai Patel", 23.0772, 72.6347, "India", "Asia/Kolkata", false, null, null, ["ahmedabad", "amd"]],
  ["GOI", "VOGO", "Goa", "Goa Dabolim", 15.3808, 73.8314, "India", "Asia/Kolkata", false, null, null, ["goa", "dabolim", "goi"]],
  ["COK", "VOCI", "Kochi", "Cochin International", 10.152, 76.4019, "India", "Asia/Kolkata", false, null, null, ["kochi", "cochin", "cok"]],
  ["PNQ", "VAPO", "Pune", "Pune Airport", 18.5822, 73.9197, "India", "Asia/Kolkata", false, null, null, ["pune", "pnq"]],
  ["JAI", "VIJP", "Jaipur", "Jaipur International", 26.8242, 75.8122, "India", "Asia/Kolkata", false, null, null, ["jaipur", "jai"]],
  ["LKO", "VILK", "Lucknow", "Chaudhary Charan Singh", 26.7606, 80.8893, "India", "Asia/Kolkata", false, null, null, ["lucknow", "lko"]],
  ["TRV", "VOTV", "Thiruvananthapuram", "Thiruvananthapuram", 8.4821, 76.92, "India", "Asia/Kolkata", false, null, null, ["thiruvananthapuram", "trivandrum", "trv"]],
  ["CJB", "VOCB", "Coimbatore", "Coimbatore International", 11.03, 77.0434, "India", "Asia/Kolkata", false, null, null, ["coimbatore", "cjb"]],
  ["IXC", "VICG", "Chandigarh", "Chandigarh Airport", 30.6735, 76.7885, "India", "Asia/Kolkata", false, null, null, ["chandigarh", "ixc"]],
  ["SXR", "VISR", "Srinagar", "Sheikh ul-Alam", 33.9871, 74.7742, "India", "Asia/Kolkata", false, null, null, ["srinagar", "sxr"]],
  ["GAU", "VEGT", "Guwahati", "Lokpriya Gopinath Bordoloi", 26.1061, 91.5859, "India", "Asia/Kolkata", false, null, null, ["guwahati", "gau"]],
  ["IDR", "VAID", "Indore", "Devi Ahilya Bai Holkar", 22.7218, 75.8011, "India", "Asia/Kolkata", false, null, null, ["indore", "idr"]],
  ["NAG", "VANP", "Nagpur", "Dr. Babasaheb Ambedkar", 21.0922, 79.0472, "India", "Asia/Kolkata", false, null, null, ["nagpur", "nag"]],
  ["PAT", "VEPT", "Patna", "Jay Prakash Narayan", 25.5913, 85.088, "India", "Asia/Kolkata", false, null, null, ["patna", "pat"]],
  ["BBI", "VEBS", "Bhubaneswar", "Biju Patnaik", 20.2444, 85.8178, "India", "Asia/Kolkata", false, null, null, ["bhubaneswar", "bhubaneshwar", "bbi"]],
  ["IXE", "VOML", "Mangaluru", "Mangaluru International", 12.9613, 74.8901, "India", "Asia/Kolkata", false, null, null, ["mangaluru", "mangalore", "ixe"]],
  ["VNS", "VEBN", "Varanasi", "Lal Bahadur Shastri", 25.4524, 82.8593, "India", "Asia/Kolkata", false, null, null, ["varanasi", "banaras", "vns"]],
  ["BDQ", "VABO", "Vadodara", "Vadodara Airport", 22.3362, 73.2263, "India", "Asia/Kolkata", false, null, null, ["vadodara", "baroda", "bdq"]],
  ["STV", "VASU", "Surat", "Surat Airport", 21.1141, 72.7418, "India", "Asia/Kolkata", false, null, null, ["surat", "stv"]],
  ["CNN", "VOKN", "Kannur", "Kannur International", 11.9186, 75.5472, "India", "Asia/Kolkata", false, null, null, ["kannur", "cannanore", "cnn"]],
]

function toPlace(row: Row): Place {
  const [iata, icao, city, name, lat, lon, country, tz, radar, rank, passengers, aliases] = row
  return { iata, icao, city, name, lat, lon, country, tz, radar, rank, passengers, aliases }
}

export const places: Place[] = rows.map(toPlace)

export const byIata: Record<string, Place> = Object.fromEntries(places.map((p) => [p.iata, p]))

/** IATA tokens that are also ordinary English words. Never match these in lowercase prose. */
export const ambiguousCodes = new Set([
  "can", "den", "mad", "sin", "sea", "lax", "and", "the", "for", "air", "new", "san", "via", "non", "day", "all", "any", "not", "out", "how", "who", "its", "nag",
])
