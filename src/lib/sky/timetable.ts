import { carrierById, carriers, type Carrier } from "./carriers"
import { haversineKm, tzAbbr, zonedParts, zonedTimeToUtc } from "./geo"
import type { ParsedQuery } from "./nlp"
import type { Place } from "./places"

export type Flight = {
  id: string
  carrier: Carrier
  number: string
  flight: string
  origin: Place
  destination: Place
  departUtc: number
  arriveUtc: number
  departLocal: string
  arriveLocal: string
  plusDay: number
  durationMin: number
  aircraft: string
  distanceKm: number
  tzDepart: string
  tzArrive: string
}

export type FlightSearch = { flights: Flight[]; caveat: string | null }

function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619)
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pairCarriers(origin: Place, destination: Place, only: Carrier | null) {
  if (only) return [only]
  const pool: Carrier[] = []
  const add = (id: string) => {
    const carrier = carrierById(id)
    if (carrier && !pool.includes(carrier)) pool.push(carrier)
  }
  const india = (place: Place) => place.country === "India"
  if (india(origin) && india(destination)) {
    ;["6E", "AI", "QP", "SG", "IX"].forEach(add)
    return pool
  }
  if (india(origin) || india(destination)) {
    add("AI")
    add("6E")
    const other = india(origin) ? destination : origin
    const foreign = carriers.find((c) => c.home.includes(other.country))
    if (foreign) pool.push(foreign)
    add("IX")
    return pool
  }
  const left = carriers.find((c) => c.home.includes(origin.country))
  const right = carriers.find((c) => c.home.includes(destination.country))
  if (left) pool.push(left)
  if (right && right !== left) pool.push(right)
  if (!pool.length) add("UA")
  return pool
}

function inPart(hour: number, part: ParsedQuery["partOfDay"]) {
  if (part === "any") return true
  if (part === "morning") return hour >= 5 && hour < 12
  if (part === "afternoon") return hour >= 12 && hour < 17
  if (part === "evening") return hour >= 17 && hour < 21
  return hour >= 21 || hour < 5
}

function clock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function searchFlights(query: ParsedQuery): FlightSearch {
  const { origin, destination } = query
  if (query.intent !== "route" || !origin || !destination || origin.iata === destination.iata) {
    return { flights: [], caveat: null }
  }
  const distanceKm = haversineKm(origin, destination)
  const rawMin = (distanceKm / 780) * 60 + 28
  const durationMin = Math.max(50, Math.round(rawMin / 5) * 5)
  const domestic = origin.country === "India" && destination.country === "India"
  const count = domestic ? (distanceKm < 2200 ? 12 : 7) : distanceKm < 2500 ? 6 : distanceKm < 6500 ? 4 : 3
  const pool = pairCarriers(origin, destination, query.airline)
  const caveat = query.airline ? `${query.airline.name} on this city pair is an illustration, not a confirmed published service.` : null
  const rng = mulberry32(hash(`${origin.iata}-${destination.iata}-${query.dayIso}`))
  const [year, month, day] = query.dayIso.split("-").map(Number)
  const start = 5 * 60 + 40
  const end = 22 * 60 + 10
  const usedNumbers = new Set<string>()
  const flights: Flight[] = []
  for (let i = 0; i < count; i++) {
    const base = start + ((end - start) * i) / Math.max(1, count - 1)
    let mins = Math.round((base + (rng() - 0.5) * 18) / 5) * 5
    mins = Math.min(23 * 60 + 20, Math.max(5 * 60, mins))
    const hour = Math.floor(mins / 60)
    if (!inPart(hour, query.partOfDay)) continue
    const carrier = pool[i % pool.length]!
    const long = distanceKm > 4500
    const types = long ? carrier.wide : carrier.narrow
    const aircraft = types[Math.floor(rng() * types.length)] ?? types[0] ?? "A320neo"
    let number = ""
    for (let attempt = 0; attempt < 6 && !number; attempt++) {
      const n = String(100 + Math.floor(rng() * 8900))
      const key = carrier.code + n
      if (!usedNumbers.has(key)) {
        usedNumbers.add(key)
        number = n
      }
    }
    if (!number) number = String(2000 + i)
    const departUtc = zonedTimeToUtc(year!, month!, day!, hour, mins % 60, origin.tz).getTime()
    const arriveUtc = departUtc + durationMin * 60_000
    const arrive = zonedParts(new Date(arriveUtc), destination.tz)
    const depart = zonedParts(new Date(departUtc), origin.tz)
    const plusDay = arrive.iso === depart.iso ? 0 : arrive.iso > depart.iso ? 1 : -1
    flights.push({
      id: `${carrier.code}${number}-${query.dayIso}`,
      carrier,
      number,
      flight: `${carrier.code} ${number}`,
      origin,
      destination,
      departUtc,
      arriveUtc,
      departLocal: clock(depart.hour * 60 + depart.minute),
      arriveLocal: clock(arrive.hour * 60 + arrive.minute),
      plusDay,
      durationMin,
      aircraft,
      distanceKm: Math.round(distanceKm),
      tzDepart: tzAbbr(new Date(departUtc), origin.tz),
      tzArrive: tzAbbr(new Date(arriveUtc), destination.tz),
    })
  }
  flights.sort((a, b) => {
    if (query.sort === "duration") return a.durationMin - b.durationMin || a.departUtc - b.departUtc
    if (query.sort === "depart-desc") return b.departUtc - a.departUtc
    return a.departUtc - b.departUtc
  })
  return { flights, caveat }
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
