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

Click **Enable free AI**, then **Generate with AI** on a selected flight. WebLLM 0.2.85 runs **Llama 3.2 1B Instruct** in a dedicated browser worker. It downloads a large model the first time and requires WebGPU and approximately 1.2 GB GPU memory. The download is cached when the browser permits. There is no API key, account requirement or per-token service bill. Data download, device resources and electricity still apply. Mobile/in-app browsers may not support it; a supported desktop Chrome/Edge browser is the best starting point.

The app validates the model's JSON and 1–100 score ranges. Missing WebGPU, model download failures, invalid output and timeouts leave clearly labeled rule-based briefings available. Cancellation stops the worker. The model is not automatically downloaded or invoked on each refresh. Its small size limits reasoning quality; all scores are unvalidated screening indices, never probabilities.

## Live observations and GitHub Pages limitations

Pages serves files and cannot run FastAPI or hide API keys. The app first tries OpenSky's anonymous live API for the selected sector. Browser CORS, quota and network failures fall back to the most recent published observation snapshot, then to clearly labeled demo data.

The Actions workflow fetches one global OpenSky response and a batch of all 21 METAR stations every **15 minutes** (minutes 7, 22, 37, 52), filters aircraft by sector and deploys the new static snapshot. One global call uses 4 OpenSky credits: 96 scheduled runs/day would consume 384, before manual runs, retries or shared-IP usage. Anonymous access can still be unavailable/rate-limited. Optional `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` repository secrets enable OAuth; no secrets enter the page or JSON. Schedules can be delayed; this is not guaranteed real-time tracking. GitHub may disable schedules in public repositories after 60 days without activity. Failed upstream requests are visible as independent simulation fallbacks.

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

Turbulence baseline: 12 + 3×surface gust spread +35 for TS/CB +12 below 10,000 ft. Traffic proxy: 15 +3×sector aircraft below 10,000 ft. Weather baseline: 12 +40 for visibility below 3 SM, or +22 below 5 SM; +30 for ceiling below 1,000 ft; +30 for TS/CB; +15 for wind over 20 kt. Cap at 100. The optional local AI returns its own labeled screening indices using these inputs.

METAR cannot determine en-route turbulence, runway queues, exact delays or safe flight paths. ADS-B sector density is not a runway queue. This prototype does not use TAF/SIGMET/PIREP/ATC restrictions or validated predictive models. Not for navigation or operational decisions.

## Sources and runtime documentation

- Ranking: https://aci.aero/resources/busiest-airports-in-the-world/
- Aircraft API: https://openskynetwork.github.io/opensky-api/rest.html
- METAR API: https://aviationweather.gov/data/api/
- WebLLM: https://webllm.mlc.ai/docs/user/get_started.html
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Scheduled Actions: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## Verification

Eight automated checks cover airport coverage, sector positioning, units, empty live sectors, independent expiry, METAR ceilings, score bounds and AI output validation. JavaScript syntax and static packaging are checked. Actual local-model inference requires a WebGPU device and model download and has not been exercised in the build environment.
