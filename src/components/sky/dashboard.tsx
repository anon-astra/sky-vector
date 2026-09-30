import { useMemo, useState } from "react"
import { CloudSun, Radar, Search } from "lucide-react"
import { SkyMap } from "@/components/sky/sky-map"
import { interpretWithGrok } from "@/lib/sky/interpret"
import { applyModel, parseQuery, suggestions, type ParsedQuery } from "@/lib/sky/nlp"
import { sampleMetar, sectorFlights } from "@/lib/sky/sector"
import { formatDuration, searchFlights, type Flight } from "@/lib/sky/timetable"

const OPENER = "show me flights from Delhi to Mumbai"

function passengers(n: number) {
  return `${(n / 1_000_000).toFixed(1)}M`
}

export function Dashboard() {
  const [text, setText] = useState(OPENER)
  const [result, setResult] = useState<ParsedQuery>(() => parseQuery(OPENER))
  const [picked, setPicked] = useState<string | null>(null)
  const [sectorId, setSectorId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [aiNote, setAiNote] = useState<string | null>(null)
  const found = useMemo(() => searchFlights(result), [result])
  const selected = found.flights.find((f) => f.id === picked) ?? found.flights[0] ?? null
  const focus = result.focus
  const traffic = focus ? sectorFlights(focus) : []
  const weather = focus ? sampleMetar(focus) : null
  const sectorPick = traffic.find((f) => f.id === sectorId) ?? traffic[0] ?? null

  async function ask(value = text) {
    const local = parseQuery(value)
    if (local.confidence === "high") {
      setResult(local)
      setPicked(null)
      setSectorId(null)
      setAiNote(null)
      return
    }
    setBusy(true)
    try {
      const remote = await interpretWithGrok({ data: { text: value } })
      const applied = remote.ok ? applyModel(value, remote.model) : null
      if (applied && (applied.confidence === "high" || applied.intent !== "unknown")) {
        setResult(applied)
        setAiNote("Read with Grok, then checked against the airport list.")
      } else {
        setResult(local)
        setAiNote(remote.ok ? null : remote.error)
      }
      setPicked(null)
      setSectorId(null)
    } catch {
      setResult(local)
      setAiNote(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <Radar className="size-7 text-mint" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold tracking-widest">SKYVECTOR</div>
            <div className="text-xs tracking-widest text-muted">AIRSPACE INTELLIGENCE</div>
          </div>
        </div>
        <span className="rounded border border-line px-2 py-1 text-xs tracking-wide text-mint">EXPERIMENTAL</span>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-8">
        <section className="flex flex-col gap-3">
          <p className="text-xs tracking-widest text-muted">ASK / PLAIN LANGUAGE</p>
          <h1 className="text-balance text-2xl font-medium tracking-tight md:text-3xl">Ask the airspace</h1>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted">
            Try a route, a terminal sector, or the weather. City names, old names, and airport codes all work.
          </p>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              void ask()
            }}
          >
            <label className="sr-only" htmlFor="ask">
              Ask about flights, weather, or a sector
            </label>
            <input
              id="ask"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="show me flights from Delhi to Mumbai"
              autoComplete="off"
              className="min-h-11 flex-1 rounded-md border border-line bg-inset px-3 text-base text-ink outline-none placeholder:text-muted focus-visible:border-mint"
            />
            <button
              type="submit"
              disabled={busy || text.trim().length < 2}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-mint px-4 font-medium text-bg disabled:opacity-50"
            >
              <Search className="size-4" aria-hidden="true" />
              {busy ? "Reading…" : "Ask"}
            </button>
          </form>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="min-h-11 shrink-0 rounded-full border border-line bg-panel px-3 text-left text-sm text-muted hover:border-mint hover:text-ink"
                onClick={() => {
                  setText(item)
                  void ask(item)
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <p className="text-sm text-mint" aria-live="polite">
          {busy ? "Checking the wording…" : result.understood}
          {result.source === "grok" ? " · Grok" : ""}
        </p>
        {result.note ? <p className="text-sm leading-relaxed text-amber">{result.note}</p> : null}
        {aiNote ? <p className="text-xs text-muted">{aiNote}</p> : null}

        {result.intent === "route" && result.origin && result.destination && !result.missing ? (
          <RouteView
            flights={found.flights}
            caveat={found.caveat}
            selected={selected}
            onSelect={setPicked}
            dayLabel={result.dayLabel}
            part={result.partOfDay}
          />
        ) : null}

        {result.intent === "sector" && focus ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-line bg-panel">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-sm font-medium">{focus.radar ? "Sector radar" : focus.city}</h2>
                <span className="text-xs text-muted">{focus.radar ? "SIMULATED TRACKS" : "NO TERMINAL FEED"}</span>
              </div>
              {focus.radar ? (
                <SkyMap mode="sector" place={focus} flights={traffic} selectedId={sectorPick?.id ?? null} onSelect={setSectorId} />
              ) : (
                <SkyMap mode="pin" place={focus} />
              )}
            </div>
            <div className="rounded-lg border border-line bg-panel p-4">
              <h2 className="text-lg font-medium">{focus.name}</h2>
              <p className="mt-1 font-mono text-sm text-muted">
                {focus.iata} / {focus.icao}
              </p>
              {focus.rank ? (
                <p className="mt-3 text-sm text-muted">
                  #{focus.rank} worldwide · {passengers(focus.passengers ?? 0)} passengers in 2025
                </p>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Live-style terminal radar in this prototype covers the ACI top 20 plus JFK. {focus.city} is in the gazetteer for routes and weather.
                </p>
              )}
              {focus.radar && sectorPick ? (
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted">Callsign</dt>
                    <dd className="font-mono">{sectorPick.callsign}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Altitude</dt>
                    <dd className="font-mono tabular-nums">{sectorPick.altitude.toLocaleString()} ft</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Ground speed</dt>
                    <dd className="font-mono tabular-nums">{sectorPick.speed} kt</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Track</dt>
                    <dd className="font-mono tabular-nums">{sectorPick.heading}°</dd>
                  </div>
                </dl>
              ) : null}
              {weather ? <Metar weather={weather} /> : null}
              {!focus.radar ? (
                <button
                  type="button"
                  className="mt-4 min-h-11 rounded-md border border-line px-3 text-sm hover:border-mint"
                  onClick={() => {
                    const next = `flights from ${focus.city} to Delhi`
                    setText(next)
                    void ask(next)
                  }}
                >
                  Flights from {focus.city} to Delhi
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {result.intent === "weather" && focus && weather ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-line bg-panel">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <CloudSun className="size-4 text-mint" aria-hidden="true" />
                <h2 className="text-sm font-medium">{focus.city} weather</h2>
              </div>
              <SkyMap mode="pin" place={focus} />
            </div>
            <div className="rounded-lg border border-line bg-panel p-4">
              <h2 className="text-lg font-medium">{focus.name}</h2>
              <p className="mt-1 font-mono text-sm text-muted">
                {focus.iata} / {focus.icao}
              </p>
              <Metar weather={weather} />
            </div>
          </section>
        ) : null}

        <footer className="flex flex-col gap-1 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          <span>Illustrative timetables and sample weather. Not live inventory, fares, or a clearance.</span>
          <span>Not for navigation or operational decisions.</span>
        </footer>
      </main>
    </div>
  )
}

function Metar({ weather }: { weather: { raw: string; wind: string; visibility: string; ceiling: string; temperature: string; note: string } }) {
  return (
    <div className="mt-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Wind</dt>
          <dd>{weather.wind}</dd>
        </div>
        <div>
          <dt className="text-muted">Visibility</dt>
          <dd>{weather.visibility}</dd>
        </div>
        <div>
          <dt className="text-muted">Sky</dt>
          <dd>{weather.ceiling}</dd>
        </div>
        <div>
          <dt className="text-muted">Temperature</dt>
          <dd>{weather.temperature}</dd>
        </div>
      </dl>
      <code className="mt-3 block rounded bg-inset p-3 font-mono text-xs leading-relaxed text-muted">{weather.raw}</code>
      <p className="mt-2 text-xs text-muted">{weather.note}</p>
    </div>
  )
}

function RouteView({
  flights,
  caveat,
  selected,
  onSelect,
  dayLabel,
  part,
}: {
  flights: Flight[]
  caveat: string | null
  selected: Flight | null
  onSelect: (id: string) => void
  dayLabel: string
  part: string
}) {
  if (!selected) {
    return <p className="rounded-lg border border-line bg-panel p-4 text-sm text-muted">No illustrated departures in that window. Try the full day.</p>
  }
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium">
            {selected.origin.iata} → {selected.destination.iata}
          </h2>
          <span className="text-xs text-muted">
            {selected.distanceKm.toLocaleString()} km · {formatDuration(selected.durationMin)}
          </span>
        </div>
        <SkyMap mode="route" origin={selected.origin} destination={selected.destination} flight={selected} />
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium">
            {flights.length} flight{flights.length === 1 ? "" : "s"} · {dayLabel}
            {part !== "any" ? ` · ${part}` : ""}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">Illustrative timetable from city-pair patterns. Not bookable inventory.</p>
        </div>
        <ul className="max-h-96 overflow-auto">
          {flights.map((flight) => {
            const active = flight.id === selected.id
            return (
              <li key={flight.id}>
                <button
                  type="button"
                  onClick={() => onSelect(flight.id)}
                  className={`flex w-full min-h-11 flex-col gap-1 border-b border-line px-4 py-3 text-left ${active ? "bg-mint-dim" : "hover:bg-inset"}`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{flight.carrier.name}</span>
                    <span className="font-mono text-sm text-mint">{flight.flight}</span>
                  </span>
                  <span className="flex items-baseline justify-between gap-3 font-mono text-sm tabular-nums">
                    <span>
                      {flight.departLocal}
                      <span className="text-muted"> {flight.tzDepart}</span>
                    </span>
                    <span className="text-muted">{formatDuration(flight.durationMin)}</span>
                    <span>
                      {flight.arriveLocal}
                      {flight.plusDay > 0 ? <span className="text-amber"> +{flight.plusDay}</span> : null}
                      <span className="text-muted"> {flight.tzArrive}</span>
                    </span>
                  </span>
                  <span className="text-xs text-muted">
                    {flight.aircraft} · nonstop
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {caveat ? <p className="px-4 py-3 text-xs leading-relaxed text-amber">{caveat}</p> : null}
      </div>
    </section>
  )
}
