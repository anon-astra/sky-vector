import type { Place } from "./places"

export type SectorFlight = {
  id: string
  callsign: string
  lat: number
  lon: number
  altitude: number
  speed: number
  heading: number
  verticalRate: number
}

const stems = ["IGO", "AIC", "AKJ", "SEJ", "UAE", "BAW", "AFR", "DAL", "UAL", "SIA"]

export function sectorFlights(place: Place): SectorFlight[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `${place.iata}-demo-${i}`,
    callsign: `${stems[i % stems.length]}${200 + ((i * 37) % 700)}`,
    lat: place.lat + Math.sin(i * 2.4) * (0.12 + i * 0.012),
    lon: place.lon + Math.cos(i * 2.4) * (0.14 + i * 0.014),
    altitude: 2800 + ((i * 1450) % 32000),
    speed: 190 + ((i * 17) % 280),
    heading: (i * 53 + 80) % 360,
    verticalRate: i % 3 === 0 ? -700 : i % 3 === 1 ? 500 : 0,
  }))
}

export function sampleMetar(place: Place) {
  return {
    raw: `${place.icao} 301200Z 27008KT 6SM FEW040 29/22 Q1010`,
    wind: "270° at 8 kt",
    visibility: "6 SM",
    ceiling: "Few clouds at 4,000 ft",
    temperature: "29°C",
    note: "Fixed sample, not a live METAR.",
  }
}
