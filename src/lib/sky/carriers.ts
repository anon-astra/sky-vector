export type Carrier = {
  id: string
  name: string
  code: string
  phrases: string[]
  narrow: string[]
  wide: string[]
  home: string[]
}

export const carriers: Carrier[] = [
  { id: "6E", name: "IndiGo", code: "6E", phrases: ["indigo", "6e"], narrow: ["A320neo", "A321neo"], wide: ["A321XLR"], home: ["India"] },
  { id: "AI", name: "Air India", code: "AI", phrases: ["air india"], narrow: ["A320neo", "A321neo"], wide: ["787-8", "777-300ER"], home: ["India"] },
  { id: "IX", name: "Air India Express", code: "IX", phrases: ["air india express", "aiexpress"], narrow: ["737 MAX 8"], wide: ["737 MAX 8"], home: ["India"] },
  { id: "QP", name: "Akasa Air", code: "QP", phrases: ["akasa", "akasa air"], narrow: ["737 MAX 8"], wide: ["737 MAX 8"], home: ["India"] },
  { id: "SG", name: "SpiceJet", code: "SG", phrases: ["spicejet", "spice jet"], narrow: ["737-800"], wide: ["737-800"], home: ["India"] },
  { id: "EK", name: "Emirates", code: "EK", phrases: ["emirates"], narrow: ["777-300ER"], wide: ["A380", "777-300ER"], home: ["United Arab Emirates"] },
  { id: "QR", name: "Qatar Airways", code: "QR", phrases: ["qatar", "qatar airways"], narrow: ["A320neo"], wide: ["A350-900", "777-300ER"], home: ["Qatar"] },
  { id: "EY", name: "Etihad", code: "EY", phrases: ["etihad"], narrow: ["A321neo"], wide: ["787-9", "777-300ER"], home: ["United Arab Emirates"] },
  { id: "BA", name: "British Airways", code: "BA", phrases: ["british airways", "british", "ba"], narrow: ["A320neo"], wide: ["777-200ER", "A350-1000"], home: ["United Kingdom"] },
  { id: "AF", name: "Air France", code: "AF", phrases: ["air france"], narrow: ["A320neo"], wide: ["777-300ER", "A350-900"], home: ["France"] },
  { id: "KL", name: "KLM", code: "KL", phrases: ["klm"], narrow: ["737-800"], wide: ["787-9", "777-300ER"], home: ["Netherlands"] },
  { id: "LH", name: "Lufthansa", code: "LH", phrases: ["lufthansa"], narrow: ["A320neo"], wide: ["A350-900", "747-8"], home: ["Germany"] },
  { id: "TK", name: "Turkish Airlines", code: "TK", phrases: ["turkish", "turkish airlines"], narrow: ["A321neo"], wide: ["787-9", "777-300ER"], home: ["Turkey"] },
  { id: "SQ", name: "Singapore Airlines", code: "SQ", phrases: ["singapore airlines", "sia"], narrow: ["A320neo"], wide: ["A350-900", "777-300ER"], home: ["Singapore"] },
  { id: "CX", name: "Cathay Pacific", code: "CX", phrases: ["cathay", "cathay pacific"], narrow: ["A321neo"], wide: ["A350-900", "777-300ER"], home: ["Hong Kong"] },
  { id: "QF", name: "Qantas", code: "QF", phrases: ["qantas"], narrow: ["737-800"], wide: ["787-9", "A380"], home: ["Australia"] },
  { id: "UA", name: "United", code: "UA", phrases: ["united", "united airlines"], narrow: ["737 MAX 8"], wide: ["787-9", "777-300ER"], home: ["United States"] },
  { id: "DL", name: "Delta", code: "DL", phrases: ["delta", "delta airlines"], narrow: ["A321neo"], wide: ["A350-900", "A330-900"], home: ["United States"] },
  { id: "AA", name: "American", code: "AA", phrases: ["american airlines", "american"], narrow: ["A321neo"], wide: ["777-300ER", "787-9"], home: ["United States"] },
  { id: "TG", name: "Thai Airways", code: "TG", phrases: ["thai airways", "thai"], narrow: ["A320neo"], wide: ["787-8", "A350-900"], home: ["Thailand"] },
  { id: "MH", name: "Malaysia Airlines", code: "MH", phrases: ["malaysia airlines", "malaysia"], narrow: ["737-800"], wide: ["A350-900", "A330-900"], home: ["Malaysia"] },
  { id: "KE", name: "Korean Air", code: "KE", phrases: ["korean air", "korean"], narrow: ["737-800"], wide: ["787-9", "777-300ER"], home: ["South Korea"] },
  { id: "NH", name: "ANA", code: "NH", phrases: ["ana", "all nippon"], narrow: ["787-8"], wide: ["777-300ER", "787-9"], home: ["Japan"] },
  { id: "JL", name: "Japan Airlines", code: "JL", phrases: ["japan airlines", "jal"], narrow: ["787-8"], wide: ["777-300ER", "A350-1000"], home: ["Japan"] },
  { id: "AC", name: "Air Canada", code: "AC", phrases: ["air canada"], narrow: ["A220-300"], wide: ["787-9", "777-300ER"], home: ["Canada"] },
  { id: "LA", name: "LATAM", code: "LA", phrases: ["latam"], narrow: ["A320neo"], wide: ["787-9", "777-300ER"], home: ["Brazil"] },
  { id: "AM", name: "Aeromexico", code: "AM", phrases: ["aeromexico", "aero mexico"], narrow: ["737 MAX 8"], wide: ["787-9"], home: ["Mexico"] },
  { id: "SA", name: "South African", code: "SA", phrases: ["south african"], narrow: ["A320neo"], wide: ["A350-900"], home: ["South Africa"] },
  { id: "MS", name: "EgyptAir", code: "MS", phrases: ["egyptair", "egypt air"], narrow: ["A320neo"], wide: ["787-9", "777-300ER"], home: ["Egypt"] },
  { id: "FZ", name: "flydubai", code: "FZ", phrases: ["flydubai", "fly dubai"], narrow: ["737 MAX 8"], wide: ["737 MAX 8"], home: ["United Arab Emirates"] },
]

const phraseIndex = carriers
  .flatMap((c) => c.phrases.map((phrase) => ({ phrase, carrier: c })))
  .sort((a, b) => b.phrase.split(" ").length - a.phrase.split(" ").length || b.phrase.length - a.phrase.length)

export function matchCarrier(tokens: string[], used: boolean[]): Carrier | null {
  for (let i = 0; i < tokens.length; i++) {
    if (used[i]) continue
    for (const { phrase, carrier } of phraseIndex) {
      const parts = phrase.split(" ")
      if (i + parts.length > tokens.length) continue
      if (parts.every((part, j) => tokens[i + j] === part && !used[i + j])) {
        for (let j = 0; j < parts.length; j++) used[i + j] = true
        return carrier
      }
    }
  }
  return null
}

export function carrierById(id: string | null | undefined) {
  if (!id) return null
  return carriers.find((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase()) ?? null
}
