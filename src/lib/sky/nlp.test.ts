import assert from "node:assert/strict"
import { test } from "node:test"
import { parseQuery } from "./nlp"
import { searchFlights } from "./timetable"

const now = new Date("2026-09-30T05:00:00Z")

test("show me flights from Delhi to Mumbai", () => {
  const q = parseQuery("show me flights from Delhi to Mumbai", now)
  assert.equal(q.intent, "route")
  assert.equal(q.confidence, "high")
  assert.equal(q.origin?.iata, "DEL")
  assert.equal(q.destination?.iata, "BOM")
  assert.equal(q.partOfDay, "any")
  assert.equal(q.dayIso, "2026-09-30")
  assert.equal(q.missing, null)
  const { flights } = searchFlights(q)
  assert.ok(flights.length >= 8)
  assert.equal(flights[0]?.origin.iata, "DEL")
  assert.equal(flights[0]?.destination.iata, "BOM")
  assert.ok(flights[0]!.durationMin >= 90 && flights[0]!.durationMin <= 150)
  assert.ok(flights.some((f) => f.carrier.name === "IndiGo"))
  const again = searchFlights(q)
  assert.deepEqual(again.flights.map((f) => f.id), flights.map((f) => f.id))
})

test("aliases, day part, and airline", () => {
  const q = parseQuery("Indigo from Bombay to Bangalore tomorrow morning", now)
  assert.equal(q.origin?.iata, "BOM")
  assert.equal(q.destination?.iata, "BLR")
  assert.equal(q.dayIso, "2026-10-01")
  assert.equal(q.partOfDay, "morning")
  assert.equal(q.airline?.id, "6E")
  const { flights } = searchFlights(q)
  assert.ok(flights.length >= 1)
  assert.ok(flights.every((f) => f.carrier.id === "6E"))
  assert.ok(flights.every((f) => Number(f.departLocal.slice(0, 2)) < 12))
})

test("common words are not airport codes", () => {
  const q = parseQuery("can you show flights from delhi to mumbai", now)
  assert.equal(q.origin?.iata, "DEL")
  assert.equal(q.destination?.iata, "BOM")
  assert.equal(parseQuery("flights from SIN to DEL", now).origin?.iata, "SIN")
  assert.notEqual(parseQuery("this is not a sin", now).focus?.iata, "SIN")
})

test("weather, sector, codes, and honest gaps", () => {
  assert.equal(parseQuery("weather at Heathrow", now).intent, "weather")
  assert.equal(parseQuery("weather at Heathrow", now).focus?.iata, "LHR")
  assert.equal(parseQuery("radar at Tokyo Haneda", now).intent, "sector")
  assert.equal(parseQuery("radar at Tokyo Haneda", now).focus?.iata, "HND")
  assert.equal(parseQuery("del to bom", now).destination?.iata, "BOM")
  const cheap = parseQuery("cheapest flights from Delhi to Mumbai", now)
  assert.match(cheap.note ?? "", /fare/i)
  const via = parseQuery("flights from Delhi to London via Dubai", now)
  assert.equal(via.origin?.iata, "DEL")
  assert.equal(via.destination?.iata, "LHR")
  assert.equal(via.via?.iata, "DXB")
  assert.match(via.note ?? "", /via Dubai/i)
  const same = parseQuery("flights from Delhi to Delhi", now)
  assert.match(same.note ?? "", /same airport/i)
  assert.equal(parseQuery("flights from Delhi", now).missing !== null, true)
})
