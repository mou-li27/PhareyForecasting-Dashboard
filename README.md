# 🌊 Phrae Municipality Real-Time Flood Early Warning Dashboard

> A high-frequency hydrological monitoring and flood early warning system for **Phrae Municipality, Thailand (Yom River Basin)** — built for local municipal authorities to monitor, predict, and act on flood risk in real time.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-2-764ABC?style=for-the-badge&logo=redux" />
  <img src="https://img.shields.io/badge/Leaflet-GIS_Map-199900?style=for-the-badge&logo=leaflet" />
  <img src="https://img.shields.io/badge/Recharts-Visualization-22b5bf?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Active_Development-orange?style=for-the-badge" />
</p>

---

## 📌 Project Overview

This project is an interactive, web-based municipal flood early warning dashboard designed for **Phrae Province, Northern Thailand**, specifically focused on the **Yom River Basin**. The system provides local emergency authorities with:

- 🗺️ **Live GIS visualization** of 7 hydrological monitoring stations across the Yom River network
- 📡 **Real-time telemetry** — discharge (Q in cms), water stage levels (m MSL), and channel capacity %
- 📊 **Historical flood event analysis** with time-series charts for past severe flooding events
- ⚡ **Physics-based deterministic flood prediction** using river wave propagation and time-lag modeling
- 🌧️ **GFS Precipitation Forecast Integration** (NOAA Global Forecast System) for extended early warning lead time

### ⚠️ Strict No-AI Policy

> **All predictive algorithms MUST rely exclusively on deterministic physical hydrodynamics, water volume propagation rules, and time-lag wave calculations.**
>
> Under no circumstances should any module use Neural Networks, LSTMs, random forests, or any AI/ML black-box forecasting. This is a non-negotiable architectural constraint.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **Build Tooling** | Turbopack, PostCSS, ESLint |
| **UI & Styling** | Custom CSS, dark-mode dashboard framework, Lucide React icons |
| **State Management** | Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) |
| **GIS / Mapping** | Leaflet + OpenTopoMap tile provider, custom SVG heat zones |
| **Charting** | Recharts |
| **Testing** | Jest + `ts-jest` |

---

## 📍 Monitoring Stations — Yom River Basin Network

The dashboard tracks **7 core hydrological monitoring stations** across Phrae Province:

| Station ID | Location | District (Amphoe) | Role in Network |
|:---|:---|:---|:---|
| **Y.1C** ⭐ | Ban Nam Khong | Mueang Phrae | **Primary Chokepoint** — Yom River Mainstream |
| **Y.20** | Ban Huai Sak | Song District | Northern Mainstream Trigger |
| **KY.1** | Tha Kham Bridge | Nong Muang Khai | Mainstream Intermediate Trunk |
| **Y.38** | Mae Kham Mi Upper | Rong Kwang | Mae Kham Mi Tributary |
| **KM.1** | Mae Kham Mi Bridge | Rong Kwang / Mueang | Lower Tributary Confluence |
| **Y.34** | Mae Lai Upper | Mueang Phrae / Rong Kwang | Mae Lai Tributary |
| **KS.1** | Suan Khwoan | Mueang Phrae | Surface Runoff / Environmental Sub-basin |

> ⭐ **Station Y.1C (Ban Nam Khong)** is the critical primary chokepoint. All upstream conditions feed into predictions for Y.1C overflow risk.

---

## 🧩 Dashboard Panels

### 1. 🗺️ Regional Vulnerability Map (`MapPanel.tsx`)
- OpenTopoMap topographic tile base for full terrain context
- Custom **glowing station markers** with dynamic alert status colors (Safe → Watch → Warning → Emergency)
- **SVG radial heat zones** around each station — radius and color intensity scale directly with Channel Capacity %
- **Hover tooltips**: station ID + live capacity on hover
- **Click interaction**: sets global Redux `selectedStationId` state, driving real-time updates across all panels

### 2. 📡 Primary Chokepoint Monitor (`StationFocus.tsx`)
- Focused on **Station Y.1C** — the municipal flood bottleneck
- Tracks: Live Discharge Q (cms), Water Level (m MSL), Channel Capacity %, 24-hour trend area chart
- Color-coded alert thresholds: Safe / Watch / Warning / Emergency

### 3. 📈 Historical Data Repository (`HistoricalData.tsx`)
- Responds to `selectedStationId` from Redux global state
- Logs of severe past flooding events (e.g., September 2023, October 2017)
- Time-series discharge graphs quantifying station vulnerability history

### 4. ⚡ Causal Flood Predictor (`CausalPredictorPanel.tsx`)
- **Deterministic Rule Engine** — no ML/AI, pure physics-based wave propagation
- Models the **3–5 hour time lag** for high discharge from northern station Y.20 to travel south and cause Y.1C overflow
- Integrates upstream station readings across the full N→S river network topology

### 5. 🌧️ GFS Forecast Panel (`GfsForecastPanel.tsx`)
- Integrates **NOAA Global Forecast System (GFS)** open precipitation data via Open-Meteo API
- Fetches live 6–24 hour hourly precipitation forecasts (mm/hr) over northern catchment coordinates
- Converts GFS forecasted rainfall → projected runoff volume Q_rain → extended downstream Y.1C warning lead time
- Extends early warning window *before* upstream physical sensor spikes register

### 6. 📊 Analytical Visualization (`AnalyticalVisualization.tsx`)
- Multi-station comparative discharge graphs
- Time-series and cross-correlation analysis across the Yom River network

---

## 📁 Project Structure

```
Pharey-Dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout, metadata, font loading
│   │   ├── page.tsx                 # Entry point
│   │   └── globals.css              # Global dark-mode dashboard styles
│   ├── components/
│   │   ├── Header.tsx               # Top nav, live ICT clock, alert indicators
│   │   ├── Dashboard.tsx            # Main grid container layout
│   │   ├── MapPanel.tsx             # Leaflet GIS map, SVG heat zones, markers
│   │   ├── StationFocus.tsx         # Y.1C chokepoint telemetry & trend chart
│   │   ├── CausalPredictorPanel.tsx # Physics-based wave propagation predictor
│   │   ├── GfsForecastPanel.tsx     # NOAA GFS rainfall → runoff integration
│   │   ├── HistoricalData.tsx       # Historical flood event log & charts
│   │   ├── ForecastTimeline.tsx     # Upstream network topology & timeline
│   │   ├── AnalyticalVisualization.tsx # Multi-station comparative charts
│   │   ├── UpstreamStatus.tsx       # Station quick-status grid cards
│   │   └── ReduxProvider.tsx        # Global Redux state wrapper
│   ├── lib/
│   │   ├── store.ts                 # Redux store configuration
│   │   ├── constants.ts             # Map coordinates, thresholds, color codes
│   │   ├── types.ts                 # TypeScript interfaces for stations/alerts
│   │   ├── api.ts                   # Telemetry API fetching layer
│   │   ├── mockData.ts              # Simulated realtime telemetry data
│   │   └── phrae-districts.json     # District GeoJSON spatial boundary data
│   └── utils/
│       └── causalEngine.ts          # Deterministic flood wave propagation engine
├── public/                          # Static assets
├── generate_mask.js                 # District mask overlay utility
├── package.json
├── next.config.ts
├── tsconfig.json
├── jest.config.js
└── .gitignore
```

---

## 🔄 Data Architecture

### Currently Active
- **River telemetry**: Simulated via `mockData.ts`, structured around real historical Yom River boundary values and station thresholds

### Live Integration (GFS)
- **NOAA GFS via Open-Meteo API**: Live 6–24 hour precipitation forecasts over catchment coordinates
- Rainfall → Runoff conversion using deterministic hydrological equations in `causalEngine.ts`

### Alert Level Thresholds (Y.1C Reference)

| Level | Channel Capacity | Action |
|---|---|---|
| 🟢 Safe | < 60% | Normal monitoring |
| 🟡 Watch | 60–80% | Heightened monitoring, advisory issued |
| 🔴 Warning | 80–95% | Active alert, evacuation preparation |
| 🚨 Emergency | > 95% | Immediate emergency response |

---

## 🛠️ Known Issues Resolved

| Issue | Fix Applied |
|---|---|
| TypeScript build error `Cannot find module '@/lib/phrae-districts.json'` | Renamed file from double-extension `phrae-districts.json.json` |
| 340+ untracked files in Source Control | Standardized `.gitignore` to exclude `node_modules/`, `.next/`, build artifacts |
| Leaflet SSR crash — `window is not defined` in Next.js | Wrapped Leaflet imports in `useEffect` dynamic imports with `initRef` guards |
| Duplicate map initialization on hot reloads | `initRef` safety flag prevents double-mount in dev mode |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/mou-li27/PhareyForecasting-Dashboard.git
cd PhareyForecasting-Dashboard

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Run Tests

```bash
npx jest
```

---

## 🤝 Collaborators

| GitHub | Role |
|---|---|
| [@mou-li27](https://github.com/mou-li27) | Project Lead |
| [@AdiRatnam](https://github.com/AdiRatnam) | Collaborator |

---

## 📜 License

This project is private and intended for use by Phrae Municipality emergency management authorities.

---

> Built with ❤️ for flood-resilient communities in Northern Thailand.
