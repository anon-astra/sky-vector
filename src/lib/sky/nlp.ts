import { carrierById, matchCarrier, type Carrier } from "./carriers"
import { addIsoDays, formatDay, zonedParts } from "./geo"
import { ambiguousCodes, byIata, places, type Place } from "./places"

export type Intent = "route" | "sector" | "weather" | "unknown"
export type PartOfDay = "any" | "morning" | "afternoon" | "evening" | "night"
export type Sort = "depart" | "duration" | "depart-desc"
export type Source = "rules" | "grok"

export type ParsedQuery = {
  raw: string
  intent: Intent
  confidence: "high" | "low"
  origin: Place | null
  destination: Place | null
  via: Place | null
  focus: Place | null
  dayIso: string
  dayLabel: string
  partOfDay: PartOfDay
  airline: Carrier | null
  nonstop: boolean
  wantsConnection: boolean
  sort: Sort
  note: string | null
  understood: string
  missing: string | null
  source: Source
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const

type Tok = { raw: string; norm: string }

function fold(value: string) {
  return value.toLowerCase().replace(/['’]/g, "").normalize("NFD").replace(/\p{M}/gu, "")
}

function tokenize(text: string): Tok[] {
  return text
    .replace(/['’]/g, "")
    .split(/[^A-Za-z0-9À-ÿ]+/)
    .filter(Boolean)
    .map((raw) => ({ raw, norm: fold(raw) }))
    .filter((t) => t.norm.length > 0)
}

type Alias = { tokens: string[]; place: Place; code: boolean }

const aliases: Alias[] = places
  .flatMap((place) =>
    place.aliases.map((alias) => ({
      tokens: fold(alias).split(" ").filter(Boolean),
      place,
      code: fold(alias) === place.iata.toLowerCase(),
    })),
  )
  .sort((a, b) => b.tokens.length - a.tokens.length || b.tokens.join(" ").length - a.tokens.join(" ").length)

function hasPhrase(norms: string[], phrase: string[]) {
  for (let i = 0; i <= norms.length - phrase.length; i++) {
    if (phrase.every((part, j) => norms[i + j] === part)) return true
  }
  return false
}

function findPlaces(tokens: Tok[]) {
  const used = tokens.map(() => false)
  const hits: { place: Place; at: number }[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (used[i]) continue
    for (const alias of aliases) {
      if (i + alias.tokens.length > tokens.length) continue
      if (alias.tokens.some((_, j) => used[i + j]!)) continue
      if (!alias.tokens.every((part, j) => tokens[i + j]?.norm === part)) continue
      if (alias.code && ambiguousCodes.has(alias.tokens[0] ?? "")) {
        const raw = tokens[i]?.raw ?? ""
        if (raw !== raw.toUpperCase() || raw.length < 3) continue
      }
      for (let j = 0; j < alias.tokens.length; j++) used[i + j] = true
      hits.push({ place: alias.place, at: i })
      i += alias.tokens.length - 1
      break
    }
  }
  return hits
}

function partOfDay(norms: string[]): PartOfDay {
  if (norms.includes("morning")) return "morning"
  if (norms.includes("afternoon")) return "afternoon"
  if (norms.includes("evening")) return "evening"
  if (norms.includes("tonight") || norms.includes("redeye") || norms.includes("night") || hasPhrase(norms, ["red", "eye"])) return "night"
  return "any"
}

function travelIso(now: Date, tz: string, norms: string[]) {
  const today = zonedParts(now, tz).iso
  const wanted = WEEKDAYS.find((day) => norms.includes(day))
  if (wanted) {
    const current = new Date(`${today}T12:00:00Z`).getUTCDay()
    const target = WEEKDAYS.indexOf(wanted)
    const delta = (target - current + 7) % 7
    return addIsoDays(today, delta)
  }
  if (norms.includes("tomorrow")) return addIsoDays(today, 1)
  return today
}

function placeLabel(place: Place) {
  return `${place.city} (${place.iata})`
}

export function queryFromFields(
  input: {
    raw: string
    intent: Intent
    origin?: Place | null
    destination?: Place | null
    via?: Place | null
    dayIso?: string
    partOfDay?: PartOfDay
    airline?: Carrier | null
    nonstop?: boolean
    wantsConnection?: boolean
    sort?: Sort
    extraNote?: string | null
    source?: Source
  },
  now = new Date(),
): ParsedQuery {
  const origin = input.origin ?? null
  const destination = input.destination ?? null
  const via = input.via ?? null
  const tz = origin?.tz ?? destination?.tz ?? "UTC"
  const dayIso = input.dayIso ?? zonedParts(now, tz).iso
  const part = input.partOfDay ?? "any"
  const airline = input.airline ?? null
  const nonstop = input.nonstop ?? false
  const wantsConnection = input.wantsConnection ?? false
  const sort = input.sort ?? "depart"
  let intent = input.intent
  const same = origin && destination && origin.iata === destination.iata
  const focus = intent === "route" ? (origin ?? destination) : (origin ?? destination)

  const notes: string[] = []
  if (input.extraNote) notes.push(input.extraNote)
  if (same) notes.push("Origin and destination are the same airport.")
  if (via) notes.push(`Connections via ${via.city} aren’t in this timetable. Showing the nonstop city pair only.`)
  else if (wantsConnection) notes.push("This timetable only illustrates nonstops, not connections.")
  if (airline && intent === "route") notes.push("Filtered to the airline you named. City-pair service is illustrative, not a published schedule.")

  let missing: string | null = null
  if (intent === "route" && !same) {
    if (!origin && destination) missing = `Where are you flying to ${destination.city} from?`
    else if (origin && !destination) missing = `Where are you flying from ${origin.city}?`
    else if (!origin && !destination) missing = "Name two cities, for example Delhi to Mumbai."
  }
  if ((intent === "sector" || intent === "weather") && !focus) {
    missing = intent === "weather" ? "Which airport’s weather?" : "Which airport sector?"
    intent = "unknown"
  }

  const when = `${formatDay(dayIso)}${part === "any" ? "" : ` · ${part}`}`
  const airlineBit = airline ? ` · ${airline.name}` : ""
  let understood = "I didn’t catch an airport or a route."
  if (intent === "route" && origin && destination && !same) {
    understood = `Flights from ${placeLabel(origin)} to ${placeLabel(destination)} · ${when}${airlineBit}${nonstop ? " · nonstop" : ""}`
  } else if (intent === "route" && missing) {
    understood = missing
  } else if (intent === "weather" && focus) {
    understood = `Surface weather at ${placeLabel(focus)}`
  } else if (intent === "sector" && focus) {
    understood = focus.radar
      ? `Terminal sector at ${placeLabel(focus)}`
      : `${placeLabel(focus)} isn’t one of the tracked terminal sectors. I can still list flights.`
  } else if (missing) understood = missing

  const confidence: "high" | "low" =
    (intent === "route" && origin && destination && !same) || ((intent === "sector" || intent === "weather") && focus && !missing)
      ? "high"
      : "low"

  return {
    raw: input.raw,
    intent: missing && intent === "route" ? "route" : intent,
    confidence,
    origin,
    destination,
    via,
    focus,
    dayIso,
    dayLabel: formatDay(dayIso),
    partOfDay: part,
    airline,
    nonstop,
    wantsConnection,
    sort,
    note: notes.length ? notes.join(" ") : null,
    understood,
    missing,
    source: input.source ?? "rules",
  }
}

export function parseQuery(text: string, now = new Date()): ParsedQuery {
  const raw = text.trim()
  const tokens = tokenize(raw)
  const norms = tokens.map((t) => t.norm)
  const mentions = findPlaces(tokens)
  const used = tokens.map(() => false)
  const airline = matchCarrier(norms, used)

  const fromAt = norms.indexOf("from")
  const toAt = norms.indexOf("to")
  const betweenAt = norms.indexOf("between")
  const flightish = ["flight", "flights", "fly", "flying", "nonstop", "direct", "departure", "departures"].some((w) => norms.includes(w))
  const weatherish = ["weather", "metar", "wind", "winds", "visibility", "ceiling", "storm", "rain", "raining", "temperature", "forecast"].some((w) => norms.includes(w))
  const radarish = ["radar", "sector", "airspace", "traffic", "overview", "terminal", "aircraft"].some((w) => norms.includes(w))

  let originHit: { place: Place; at: number } | null = mentions[0] ?? null
  let destHit: { place: Place; at: number } | null = mentions[1] ?? null
  if (fromAt >= 0 && toAt >= 0) {
    originHit = mentions.find((m) => m.at > fromAt && (toAt < fromAt || m.at < toAt)) ?? mentions.find((m) => m.at > fromAt) ?? null
    destHit = mentions.find((m) => m.at > toAt && m !== originHit) ?? null
  } else if (betweenAt >= 0) {
    const andAt = norms.indexOf("and", betweenAt + 1)
    originHit = mentions.find((m) => m.at > betweenAt && (andAt < 0 || m.at < andAt)) ?? null
    destHit = andAt >= 0 ? (mentions.find((m) => m.at > andAt) ?? null) : null
  } else if (toAt >= 0) {
    originHit = mentions.find((m) => m.at < toAt) ?? null
    destHit = mentions.find((m) => m.at > toAt) ?? null
  } else if (fromAt >= 0) {
    originHit = mentions.find((m) => m.at > fromAt) ?? null
    destHit = null
  } else if (!(mentions.length >= 2 && (flightish || norms.includes("between")))) {
    destHit = null
  }

  const origin = originHit?.place ?? null
  const destination = destHit?.place ?? null
  const via = mentions.map((m) => m.place).find((p) => p !== origin && p !== destination) ?? null
  const tz = origin?.tz ?? destination?.tz ?? "UTC"
  const nonstop = norms.includes("nonstop") || norms.includes("direct") || hasPhrase(norms, ["non", "stop"])
  const wantsConnection =
    !nonstop &&
    (norms.includes("via") || norms.includes("connecting") || norms.includes("connection") || norms.includes("stopover") || hasPhrase(norms, ["one", "stop"]))
  const sort: Sort = ["fastest", "shortest", "quickest"].some((w) => norms.includes(w))
    ? "duration"
    : norms.includes("latest")
      ? "depart-desc"
      : "depart"
  const fareAsk = ["cheapest", "cheap", "fare", "fares", "price", "prices"].some((w) => norms.includes(w))

  let intent: Intent = "unknown"
  if (origin && destination) intent = "route"
  else if (weatherish && (origin || destination)) intent = "weather"
  else if ((origin || destination) && flightish && (fromAt >= 0 || toAt >= 0 || betweenAt >= 0)) intent = "route"
  else if (origin || destination) intent = "sector"
  else if (weatherish) intent = "weather"
  else if (flightish) intent = "route"
  else if (radarish) intent = "sector"

  if (radarish && (origin || destination) && !destination && !flightish) intent = "sector"
  if (weatherish && (origin || destination) && !(origin && destination)) intent = "weather"

  return queryFromFields(
    {
      raw,
      intent,
      origin,
      destination: intent === "route" ? destination : destination,
      via: intent === "route" ? via : null,
      dayIso: travelIso(now, tz, norms),
      partOfDay: partOfDay(norms),
      airline,
      nonstop,
      wantsConnection,
      sort,
      extraNote: fareAsk ? "No fare feed is connected, so this can’t be ranked by price." : null,
      source: "rules",
    },
    now,
  )
}

export function applyModel(
  raw: string,
  model: {
    intent?: string
    origin?: string | null
    destination?: string | null
    day?: string | null
    weekday?: string | null
    partOfDay?: string | null
    airline?: string | null
    nonstop?: boolean
    sort?: string | null
  },
  now = new Date(),
): ParsedQuery | null {
  const intent: Intent = model.intent === "route" || model.intent === "sector" || model.intent === "weather" ? model.intent : "unknown"
  if (intent === "unknown") return null
  const origin = model.origin ? (byIata[model.origin.toUpperCase()] ?? null) : null
  const destination = model.destination ? (byIata[model.destination.toUpperCase()] ?? null) : null
  if ((model.origin && !origin) || (model.destination && !destination)) return null
  const part: PartOfDay =
    model.partOfDay === "morning" || model.partOfDay === "afternoon" || model.partOfDay === "evening" || model.partOfDay === "night"
      ? model.partOfDay
      : "any"
  const norms = [model.day === "tomorrow" ? "tomorrow" : "today", model.weekday?.toLowerCase() ?? ""].filter(Boolean)
  const tz = origin?.tz ?? destination?.tz ?? "UTC"
  const sort: Sort = model.sort === "duration" || model.sort === "depart-desc" ? model.sort : "depart"
  return queryFromFields(
    {
      raw,
      intent,
      origin: intent === "sector" || intent === "weather" ? (origin ?? destination) : origin,
      destination: intent === "route" ? destination : null,
      dayIso: travelIso(now, tz, norms),
      partOfDay: part,
      airline: carrierById(model.airline),
      nonstop: Boolean(model.nonstop),
      sort,
      source: "grok",
    },
    now,
  )
}

export const suggestions = [
  "show me flights from Delhi to Mumbai",
  "Bengaluru to Delhi tomorrow morning",
  "nonstop Dubai to London this evening",
  "weather at Heathrow",
  "radar at Tokyo Haneda",
]
