import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DashboardState,
  StationReading,
  ForecastHorizon,
  StatusChange,
  AlertStatus,
} from './types';
import { getAlertStatus, STALE_THRESHOLD_MS } from './constants';
import gfsForecastReducer from './gfsForecastSlice';

// ===== INITIAL STATE =====
const initialState: DashboardState = {
  stations: {},
  forecasts: [],
  globalStatus: 'safe',
  statusHistory: [],
  dataFreshness: {},
  lastUpdateTime: new Date().toISOString(),
  isConnected: true,
  error: null,
  selectedDistrict: null,
  selectedBasin: null,
};

// ===== DASHBOARD SLICE =====
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateStations(state, action: PayloadAction<Record<string, StationReading>>) {
      const newStations = action.payload;

      // Check for status changes on Y.1C (audit trail)
      const y1c = newStations['Y.1C'];
      if (y1c) {
        const oldY1c = state.stations['Y.1C'];
        if (oldY1c && oldY1c.status !== y1c.status) {
          const change: StatusChange = {
            stationId: 'Y.1C',
            previousStatus: oldY1c.status,
            newStatus: y1c.status,
            timestamp: new Date().toISOString(),
            discharge: y1c.discharge,
          };
          state.statusHistory.push(change);
          // Keep last 50 changes
          if (state.statusHistory.length > 50) {
            state.statusHistory = state.statusHistory.slice(-50);
          }
        }
      }

      state.stations = newStations;
      state.lastUpdateTime = new Date().toISOString();

      // Compute global status from Y.1C
      if (y1c) {
        state.globalStatus = getAlertStatus(y1c.discharge);
      }

      // Update data freshness
      for (const [id, station] of Object.entries(newStations)) {
        const now = Date.now();
        const lastUpdate = new Date(station.timestamp).getTime();
        const staleDuration = now - lastUpdate;
        state.dataFreshness[id] = {
          source: `Station ${id}`,
          lastUpdate: station.timestamp,
          isStale: staleDuration > STALE_THRESHOLD_MS,
          staleDurationMs: staleDuration,
        };
      }
    },

    updateForecasts(state, action: PayloadAction<ForecastHorizon[]>) {
      state.forecasts = action.payload;
    },

    setGlobalStatus(state, action: PayloadAction<AlertStatus>) {
      state.globalStatus = action.payload;
    },

    setConnectionStatus(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    
    setSelectedDistrict(state, action: PayloadAction<string | null>) {
      state.selectedDistrict = action.payload;
      state.selectedBasin = null; // Reset basin on district change
    },
    
    setSelectedBasin(state, action: PayloadAction<string | null>) {
      state.selectedBasin = action.payload;
    },
  },
});

export const {
  updateStations,
  updateForecasts,
  setGlobalStatus,
  setConnectionStatus,
  setError,
  setSelectedDistrict,
  setSelectedBasin,
} = dashboardSlice.actions;

// ===== STORE =====
export const store = configureStore({
  reducer: {
    dashboard: dashboardSlice.reducer,
    gfsForecast: gfsForecastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
