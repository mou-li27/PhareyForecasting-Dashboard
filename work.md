Here is a comprehensive breakdown of your entire Phrae Municipality Real-Time Flood Early Warning Dashboard project from start to finish.
You can copy and paste this exact summary directly to Anti Gravity or your collaborators so everyone is 100% caught up on the architecture, stack, state management, and recent fixes.
🌊 Executive Project Overview
	Project Name: Phrae Municipality Real-Time Flood Early Warning Dashboard
	Primary Objective: A high-frequency hydrological monitoring system for Phrae, Thailand that integrates multi-source sensor telemetry, river catchment network topology, and AI-driven predictive discharge forecasting.
	Tech Stack:
	Framework: Next.js (App Router, TypeScript)
	Build Tooling: Turbopack, PostCSS, ESLint
	UI & Styling: Custom CSS, Lucide React icons, Responsive dark-mode dashboard framework
	State Management: Redux Toolkit (@reduxjs/toolkit, react-redux)
	Mapping & GIS: Leaflet (leaflet), OpenTopoMap tile provider, custom SVG/GeoJSON rendering
	Testing: Jest framework (jest.config.js)
🏗️ Core Architecture & Component Breakdown
The application layout consists of a grid-based real-time dashboard divided into key analytical modules:
1. Interactive Hydrological Network Map (MapPanel.tsx)
	Purpose: Live GIS visualization of the Phrae hydrological station network along the Yom River basin.
	Key Features:
	Tile Layer: Integrated OpenTopoMap for topographic context (river basins, mountains, roads).
	Station Overlay: Custom glowing markers indicating station alert statuses (Safe, Watch, Warning, Emergency).
	Heatmap / Vulnerability Aura: Native SVG radial heat zones surrounding each station. The radius and opacity dynamically scale based on the station's Channel Capacity Percentage (1.5" km"→4" km" ).
	Interactive Tooltips: Real-time popups showing station IDs and current channel capacities on hover.
2. Primary Chokepoint & Water Level Monitor
	Focus Station: Station Y.1C — BAN NAM KHONG (Primary critical bottleneck in Phrae).
	Metrics Tracked:
	Live Discharge (Q in "cms" ).
	Water Level (m" MSL" ).
	Channel Capacity Percentage (% of 1042" cms"  max capacity).
	24-Hour Discharge Trend Area Chart.
3. Upstream Network & AI Forecast Panel
	Network Topology: Tracks river flow progression along Mainstream (Y.20→KY.1→Y.1C) and key tributaries (Mae Kham Mi: Y.38→KM.1; Mae Lai: Y.34→KL.1).
	Sub-station Grid: Quick-glance status cards for surrounding upstream stations (Y.20, KY.1, Y.38, KM.1, Y.34, KS.1).
	AI Multi-Horizon Predictive Forecast: Multi-input LSTM model output rendering predicted discharge (Q_y1c (t+h)) for 1-hour and multi-hour horizons based on rainfall, soil moisture, and upstream flow derivatives.
📁 Key File Structure & Data Layer
Plaintext
Pharey-Dashboard/
├── src/
│   ├── app/                    # Next.js App Router entry points
│   ├── components/
│   │   ├── Header.tsx          # Top nav, live ICT clock, alert indicators
│   │   ├── Dashboard.tsx       # Main grid container layout
│   │   ├── MapPanel.tsx        # Leaflet map, spatial GIS, heat zones
│   │   ├── StationFocus.tsx    # Chokepoint (Y.1C) telemetry details
│   │   ├── ForecastTimeline.tsx# Upstream network & LSTM prediction models
│   │   ├── UpstreamStatus.tsx  # Station grid metrics
│   │   └── ReduxProvider.tsx   # Global state wrapper
│   └── lib/
│       ├── store.ts            # Redux store setup
│       ├── constants.ts        # Map coordinates, color codes, thresholds
│       ├── types.ts            # TypeScript interfaces for stations/alerts
│       ├── api.ts              # Telemetry API fetching
│       ├── mockData.ts         # Mock data generators for realtime simulation
│       └── phrae-districts.json# District spatial boundary data
├── public/                     # Static public assets
├── package.json                # Project dependencies & scripts
└── .gitignore                  # Git exclusions
🛠️ Issues Resolved & Recent Technical Progress
	Module Resolution & File Path Fixes:
	Problem: TypeScript build error ts(2307): Cannot find module '@/lib/phrae-districts.json'.
	Fix: Corrected a file naming glitch where the boundary file in src/lib/ was named phrae-districts.json.json. Renamed to phrae-districts.json.
	Git Repository & Build Cleanup:
	Problem: Source Control blowing up with 340+ pending untracked files.
	Fix: Standardized .gitignore rules to exclude node_modules/, .next/, build/, and OS system files (.DS_Store).
	Leaflet Next.js / SSR Compatibility:
	Problem: Server-Side Rendering (SSR) crashes (window is not defined) when importing Leaflet directly in Next.js.
	Fix: Wrapped Leaflet imports inside client-side useEffect dynamic imports (import('leaflet')) with safety flags (initRef) to prevent duplicate map initialization errors on hot reloads.
	Map Visualization & Heatmap Optimization:
	Evolution: Shifted from static GeoJSON administrative district outlines to dynamic hydrological risk rendering.
	Current State: Implemented high-contrast SVG radial heat zones on top of OpenTopoMap tiles. Radial size and color intensity map directly to real-time station capacity thresholds, ensuring critical flood risks stand out clearly.

