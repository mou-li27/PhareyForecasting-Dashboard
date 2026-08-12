# 🌊 Phrae Municipality Real-Time Flood Early Warning System
> **Project Status & Architecture Handover Document**

---

## 📌 Project Overview & Intent
This project is an interactive, web-based municipal flood early warning dashboard built for **Phrae Municipality, Thailand (Yom River Basin)**. 

The core goal is to provide local authorities with clear spatial visualization, real-time telemetry monitoring, historical flood analysis, and a **physics-based early warning predictor** for urban choke points—specifically **Station Y.1C (Ban Nam Khong)** in Mueang Phrae.

### ⚠️ Strict Architectural Constraint
* **STRICT NO-AI / NO-MACHINE LEARNING POLICY:** Under no circumstances should any module use Neural Networks, LSTMs, random forests, or AI black-box forecasting. All predictive algorithms MUST rely on deterministic physical hydrodynamics, water volume propagation rules, and time-lag wave calculations.

---

## 🏗️ Technical Architecture & Stack
* **Framework:** Next.js (App Router, TypeScript)
* **State Management:** Redux Toolkit (`@reduxjs/toolkit`)
* **Mapping Engine:** Leaflet / React-Leaflet with custom GeoJSON district boundaries
* **Styling:** Tailwind CSS

---

## 📍 Geographical Domain & Station Mapping

The dashboard tracks **7 core hydrological monitoring stations** across the Yom River basin network in Phrae Province:

| Station ID | Location | District (Amphoe) | Basin / Role |
| :--- | :--- | :--- | :--- |
| **Y.1C** | Ban Nam Khong | Mueang Phrae | Yom River Mainstream (Primary Chokepoint) |
| **Y.20** | Ban Huai Sak | Song District | Mainstream Upper Trunk (Northern Trigger) |
| **KY.1** | Tha Kham Bridge | Nong Muang Khai | Mainstream Intermediate Trunk |
| **Y.38** | Mae Kham Mi Upper | Rong Kwang | Mae Kham Mi Tributary |
| **KM.1** | Mae Kham Mi Bridge | Rong Kwang / Mueang Phrae | Lower Tributary Confluence |
| **Y.34** | Mae Lai Upper | Mueang Phrae / Rong Kwang | Mae Lai Tributary |
| **KS.1** | Suan Khwoan | Mueang Phrae | Surface Runoff / Environmental Sub-basin |

---

## 🧩 Current Dashboard Layout & State

The dashboard layout consists of four primary interface panels:

### 1. Regional Vulnerability Map (Top Panel)
* Displays colored district polygons (Risk levels: Red/Orange/Green).
* Displays station markers on river channels.
* **Hover Interaction:** Displays district name and contained station details.
* **Click Interaction:** Sets global state `selectedStationId` in Redux, dynamically driving data updates across all lower panels.

### 2. Multi-Station Telemetry Panel (Bottom-Left)
* Listens to `selectedStationId`.
* Displays real-time discharge ($Q$ in cms), water stage level ($m\text{ MSL}$), capacity percentage, and status (Safe/Watch/Warning).

### 3. Historical Data Repository (Bottom-Middle)
* Listens to `selectedStationId`.
* Displays severe past flooding event logs (e.g., Sep 2023, Oct 2017) and time-series discharge graphs quantifying historical vulnerability.

### 4. Causal Flood Predictor (Bottom-Right)
* Uses a **Deterministic Rule Engine** calculating North-to-South river wave propagation.
* Models the time lag ($\sim 3\text{ to }5\text{ hours}$) required for high discharge in northern stations (`Y.20`) to travel south and cause channel overflow at `Y.1C`.

---

## 🔄 Hybrid Data Architecture (Current vs. Next Phase)

### Currently Implemented:
* **River Sensors & Stage Heights:** Powered by simulated telemetry (`mockData.ts`) structured around historical Yom River boundary values.

### Next Step To Implement (NOAA GFS Integration):
* **Predictive Rainfall Source:** Integration of **real-world NOAA Global Forecast System (GFS)** open data.
* **Method:** Ingest live 6-to-24 hour hourly precipitation forecasts ($R_{\text{forecast}}$ in mm/hr) over northern catchment coordinates (Song & Rong Kwang).
* **Predictive Enhancement:** Instead of waiting for northern river stage height at `Y.20` to rise reactively, the Causal Rule Engine converts GFS forecasted rainfall into projected runoff volume ($Q_{\text{rain}}$), extending the downstream warning lead-time window prior to upstream physical sensor spikes.

---

## 🎯 Next Tasks for Anti Gravity
1. Create `gfsService.ts` to fetch GFS precipitation forecast JSON from Open-Meteo GFS endpoint for Phrae catchment coordinates.
2. Store GFS forecast state in Redux.
3. Update `causalEngine.ts` to compute incoming runoff volume from GFS rainfall predictions combined with $Y.20$ upstream discharge.
4. Update UI in `CausalPredictorPanel.tsx` to display live GFS status, forecasted rainfall values, and calculated downstream lead-time arrival windows.