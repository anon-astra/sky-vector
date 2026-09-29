# Skyvector — GitHub Pages edition

A dark radar dashboard covering the **2025 top 20 airports by total passenger traffic**, plus JFK. React + Leaflet, browser-local AI, automatic weather/aircraft snapshots, and explicit simulation fallbacks. No paid AI key, Python server or application server is required for this edition.

## Publish

1. Create a **public** repository (suggested name `skyvector`) with a README, using `main` as the default branch.
2. Add the source files in this package, including `.github/workflows/pages.yml`.
3. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
4. Run **Actions → Publish Skyvector and refresh observations → Run workflow** (a push to main also triggers it).
5. Open the URL reported by the deploy job. All paths are relative, so a project URL such as `/skyvector/` works.

No `npm install` is needed. The build only copies static assets. The hosted React and Leaflet distributions, map tiles and AI model need internet access. Keep the repo public for GitHub's public-repository free Pages/standard Actions offering; private-repository plan and Actions limits differ.

## Free AI

Click **Enable free AI**, then **Generate with AI** on a selected flight. Transformers.js 3.8.1 runs **SmolLM2-135M-Instruct** with q8 weights in a dedicated, single-threaded WebAssembly worker. It uses the CPU and does not request WebGPU. The first use downloads approximately 137 MB of model weights plus runtime/tokenizer assets, cached when the browser permits. There is no API key, account requirement or per-token service bill.

Briefings explain weather flags, traffic-score drivers, selected-flight altitude/trend relevance, tailored next checks and data age. This analysis appears immediately without a model download. The optional LLM prioritizes the supplied observations using constrained A/B/C decoding. The app assembles the English briefing exclusively from those observed facts, preventing invented weather, headings or traffic figures. Risk scores remain clearly labeled rule-based screening indices. Download failures, empty output, and timeouts preserve the rule-based briefing. Stop AI terminates the worker and releases its memory.

## Live observations and GitHub Pages limitations

Pages serves files and cannot run FastAPI. The working default loads real OpenSky observations and NOAA METARs from a same-origin JSON file, avoiding browser CORS and unavailable runtime proxies. Data is explicitly labeled as a delayed snapshot, with its observation time; this is not second-by-second live tracking. Failed upstream fetches retain recent valid observations before using clearly labeled simulation.

The Actions workflow fetches one global OpenSky response and a batch of all 21 METAR stations every **5 minutes**, filters aircraft by sector and deploys the new static snapshot. One global call uses 4 OpenSky credits: 288 scheduled runs/day would consume 1,152, before manual runs, retries or shared-IP usage. Anonymous access can still be unavailable/rate-limited. Optional `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` repository secrets enable OAuth; no secrets enter the page or JSON. Schedules can be delayed; this is not guaranteed real-time tracking. GitHub may disable schedules in public repositories after 60 days without activity. Failed upstream requests are visible as independent simulation fallbacks.

The page checks for new data every 60 seconds. Snapshots are labeled **DELAYED SNAPSHOT**, never live; observation times and age are shown. Aircraft snapshots expire at 45 minutes and METARs at 2 hours. A successful empty sector remains empty. Failed sources never invent current observation times. Map centers are approximate airport reference coordinates, not navigation fixes. OpenSky receiver coverage varies significantly worldwide.

## Rankings

ACI World Airport Traffic Dataset 2026, reporting **2025 overall passenger traffic** (not cargo, international-only passengers or aircraft movements):

| Rank | Airport | Passengers |
|---|---|---:|
| 1 | ATL · Atlanta | 106,302,208 |
| 2 | DXB · Dubai | 95,192,160 |
| 3 | HND · Tokyo Haneda | 91,679,814 |
| 4 | DFW · Dallas/Fort Worth | 85,660,127 |
| 5 | PVG · Shanghai Pudong | 84,994,548 |
| 6 | ORD · Chicago O’Hare | 84,856,018 |
| 7 | LHR · London Heathrow | 84,482,126 |
| 8 | IST · Istanbul | 84,437,710 |
| 9 | CAN · Guangzhou | 83,582,952 |
| 10 | DEN · Denver | 82,427,962 |
| 11 | DEL · New Delhi | 78,148,081 |
| 12 | ICN · Incheon | 74,126,912 |
| 13 | LAX · Los Angeles | 73,709,594 |
| 14 | CDG · Paris CDG | 72,029,407 |
| 15 | PEK · Beijing Capital | 70,742,712 |
| 16 | SIN · Singapore | 69,982,000 |
| 17 | AMS · Amsterdam | 68,771,592 |
| 18 | MAD · Madrid | 68,118,754 |
| 19 | SZX · Shenzhen | 66,485,213 |
| 20 | KUL · Kuala Lumpur | 63,409,501 |

JFK is retained as an extra, unranked sector.

## Run locally

Requires Node 22+ and Python 3 (only for a local static file server):

```sh
npm test
npm run refresh
npm run build
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. `npm run refresh` attempts upstream feeds and writes `data/airspace.json`; it produces labeled demo inputs when they cannot be reached. The repository contains no runtime dependencies to install. Serve over HTTP localhost or HTTPS, not `file://`.

## Method and limits

Turbulence baseline: 12 + 3×surface gust spread +35 for TS/CB +12 below 10,000 ft. Traffic proxy: 15 +3×sector aircraft below 10,000 ft. Weather baseline: 12 +40 for visibility below 3 SM, or +22 below 5 SM; +30 for ceiling below 1,000 ft; +30 for TS/CB; +15 for wind over 20 kt. Cap at 100. The optional local AI prioritizes these inputs; it does not replace the heuristic scores.

METAR cannot determine en-route turbulence, runway queues, exact delays or safe flight paths. ADS-B sector density is not a runway queue. This prototype does not use TAF/SIGMET/PIREP/ATC restrictions or validated predictive models. Not for navigation or operational decisions.

## Sources and runtime documentation

- Ranking: https://aci.aero/resources/busiest-airports-in-the-world/
- Aircraft API: https://openskynetwork.github.io/opensky-api/rest.html
- METAR API: https://aviationweather.gov/data/api/
- Transformers.js: https://huggingface.co/docs/transformers.js
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Scheduled Actions: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## Verification

Automated checks cover airport coverage, positioning, units, independent expiry, METAR ceilings, score bounds, and worker error reporting. Non-scheduled deployments also run Chromium with GPU disabled, download the actual CPU model, generate a briefing, and check the stop/retry controls.
