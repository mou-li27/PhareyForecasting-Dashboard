// ===== ALERT STATUS TYPES =====
export type AlertStatus = 'safe' | 'watch' | 'warning' | 'emergency';

// ===== STATION DATA =====
export interface StationReading {
  stationId: string;
  name: string;
  nameThai?: string;
  lat: number;
  lng: number;
  waterLevel: number;       // meters
  discharge: number;        // cms (cubic meters per second)
  channelCapacity: number;  // cms
  capacityPercent: number;  // percentage
  trend: number;            // Δm/3hr
  trendDirection: 'rising' | 'falling' | 'stable';
  status: AlertStatus;
  timestamp: string;
  type: 'mainstream' | 'tributary' | 'sensor';
  rainfall?: number;        // mm/hr
  soilMoisture?: number;    // percentage
  windSpeed?: number;       // m/s
  history: DataPoint[];     // 24-hour historical data
}

export interface DataPoint {
  time: string;
  value: number;
  waterLevel?: number;
}

// ===== FORECAST DATA =====
export interface ForecastHorizon {
  horizon: string;           // '1h', '3h', '6h'
  hours: number;
  predictedDischarge: number;
  predictedWaterLevel: number;
  forecastCapacityPercent: number;
  confidenceUpper: number;
  confidenceLower: number;
  uncertaintyPercent: number;
  status: AlertStatus;
  trend: DataPoint[];
  timestamp: string;
}

// ===== UPSTREAM ROUTING =====
export interface FlowRoute {
  name: string;
  stations: string[];       // station IDs in flow order
  label: string;            // e.g. "Y.20 → KY.1 → Y.1C"
}

// ===== STATE CHANGE AUDIT =====
export interface StatusChange {
  stationId: string;
  previousStatus: AlertStatus;
  newStatus: AlertStatus;
  timestamp: string;
  discharge: number;
}

// ===== DATA FRESHNESS =====
export interface DataFreshness {
  source: string;
  lastUpdate: string;
  isStale: boolean;
  staleDurationMs: number;
}

// ===== DASHBOARD STATE =====
export interface DashboardState {
  stations: Record<string, StationReading>;
  forecasts: ForecastHorizon[];
  globalStatus: AlertStatus;
  statusHistory: StatusChange[];
  dataFreshness: Record<string, DataFreshness>;
  lastUpdateTime: string;
  isConnected: boolean;
  error: string | null;
  selectedDistrict: string | null;
  selectedBasin: string | null;
}
