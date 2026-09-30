import { useEffect, useRef } from "react"
import { greatCircle, pointAlong } from "@/lib/sky/geo"
import type { Place } from "@/lib/sky/places"
import type { SectorFlight } from "@/lib/sky/sector"
import type { Flight } from "@/lib/sky/timetable"
import "leaflet/dist/leaflet.css"

const plane = `<svg viewBox="0 0 24 24" width="22" height="22" fill="#a6efd4" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>`

type RouteProps = { mode: "route"; origin: Place; destination: Place; flight: Flight | null }
type SectorProps = {
  mode: "sector"
  place: Place
  flights: SectorFlight[]
  selectedId: string | null
  onSelect: (id: string) => void
}
type PinProps = { mode: "pin"; place: Place }

export function SkyMap(props: RouteProps | SectorProps | PinProps) {
  const el = useRef<HTMLDivElement>(null)
  const selectedId = props.mode === "sector" ? props.selectedId : props.mode === "route" ? props.flight?.id : props.place.iata
  const originKey = props.mode === "route" ? props.origin.iata : props.place.iata
  const destKey = props.mode === "route" ? props.destination.iata : ""
  const onSelect = props.mode === "sector" ? props.onSelect : undefined

  useEffect(() => {
    const node = el.current
    if (!node) return
    let alive = true
    let map: import("leaflet").Map | null = null
    void (async () => {
      const L = await import("leaflet")
      if (!alive || !node.isConnected) return
      map = L.map(node, { zoomControl: false, attributionControl: true })
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 16,
      }).addTo(map)
      if (props.mode === "route") {
        const line = greatCircle(props.origin, props.destination)
        L.polyline(line, { color: "#a6efd4", weight: 3, opacity: 0.95 }).addTo(map)
        const ends: [Place, string][] = [
          [props.origin, "#a6efd4"],
          [props.destination, "#f3bc72"],
        ]
        for (const [place, color] of ends) {
          L.circleMarker([place.lat, place.lon], { radius: 6, color, fillColor: color, fillOpacity: 1, weight: 2 })
            .bindTooltip(`${place.iata} · ${place.city}`, { permanent: true, direction: "top", opacity: 0.95 })
            .addTo(map)
        }
        const flight = props.flight
        const now = Date.now()
        if (flight && now >= flight.departUtc && now <= flight.arriveUtc) {
          const fraction = (now - flight.departUtc) / (flight.arriveUtc - flight.departUtc)
          const [lat, lon] = pointAlong(line, fraction)
          L.marker([lat, lon], {
            interactive: false,
            icon: L.divIcon({ className: "sv-marker", html: plane, iconSize: [22, 22], iconAnchor: [11, 11] }),
          }).addTo(map)
        }
        map.fitBounds(L.latLngBounds(line), { padding: [28, 28] })
      } else {
        const place = props.place
        L.circleMarker([place.lat, place.lon], {
          radius: 5,
          color: "#e4ecee",
          fillColor: "#e4ecee",
          fillOpacity: 1,
          weight: 2,
        })
          .bindTooltip(place.icao, { permanent: true, direction: "bottom" })
          .addTo(map)
        if (props.mode === "sector") {
          ;[18520, 37040].forEach((radius) => {
            L.circle([place.lat, place.lon], { radius, color: "#a6efd4", weight: 1, opacity: 0.35, fill: false }).addTo(map!)
          })
          for (const flight of props.flights) {
            const selected = flight.id === props.selectedId
            const icon = L.divIcon({
              className: "sv-marker",
              html: `<div style="transform:rotate(${flight.heading}deg);color:${selected ? "#f3bc72" : "#a6efd4"}">${plane}</div><div style="font:10px ui-monospace,monospace;color:${selected ? "#f3bc72" : "#d5e4ea"};white-space:nowrap">${flight.callsign}</div>`,
              iconSize: [70, 36],
              iconAnchor: [11, 11],
            })
            L.marker([flight.lat, flight.lon], { icon, title: flight.callsign, keyboard: true })
              .on("click", () => onSelect?.(flight.id))
              .addTo(map)
          }
          const bounds = L.latLngBounds(props.flights.map((f) => [f.lat, f.lon] as [number, number]))
          bounds.extend([place.lat, place.lon])
          map.fitBounds(bounds, { padding: [24, 24] })
        } else {
          map.setView([place.lat, place.lon], 8)
        }
      }
    })()
    return () => {
      alive = false
      map?.remove()
    }
    // Selection and route ends are the only inputs. Callback identity is stable enough via id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, selectedId, originKey, destKey, onSelect])

  return <div ref={el} className="h-80 w-full bg-inset md:h-96" />
}
