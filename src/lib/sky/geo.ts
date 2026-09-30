export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = 6371
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const dφ = ((b.lat - a.lat) * Math.PI) / 180
  const dλ = ((b.lon - a.lon) * Math.PI) / 180
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function greatCircle(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  steps = 72,
): [number, number][] {
  const φ1 = (a.lat * Math.PI) / 180
  const λ1 = (a.lon * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const λ2 = (b.lon * Math.PI) / 180
  const d = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2))
  if (d < 1e-6) return [[a.lat, a.lon]]
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)
    const φ = Math.atan2(z, Math.sqrt(x * x + y * y))
    const λ = Math.atan2(y, x)
    points.push([(φ * 180) / Math.PI, (λ * 180) / Math.PI])
  }
  return points
}

export function pointAlong(points: [number, number][], fraction: number): [number, number] {
  if (points.length === 0) return [0, 0]
  const f = Math.min(1, Math.max(0, fraction))
  const index = f * (points.length - 1)
  const i = Math.floor(index)
  const j = Math.min(points.length - 1, i + 1)
  const t = index - i
  const a = points[i] ?? points[0]!
  const b = points[j] ?? a
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

export function zonedParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  })
  const bag: Record<string, string> = {}
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    weekday: bag.weekday ?? "",
    iso: `${bag.year}-${bag.month}-${bag.day}`,
  }
}

export function tzAbbr(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(date)
  return parts.find((p) => p.type === "timeZoneName")?.value ?? ""
}

/** Local civil time in `tz` → UTC. One correction pass; fine away from DST folds. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string) {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const got = zonedParts(new Date(guess), tz)
  const asUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute)
  return new Date(guess - (asUtc - guess))
}

export function addIsoDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function formatDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1))
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(dt)
}
