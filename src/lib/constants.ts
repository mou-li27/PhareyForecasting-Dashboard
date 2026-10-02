import { AlertStatus, FlowRoute } from './types';

// ===== ALERT THRESHOLDS FOR Y.1C =====
export const Y1C_CHANNEL_CAPACITY = 1042; // cms baseline

export const ALERT_THRESHOLDS = {
  safe:      { max: 834,  color: '#22c55e', label: 'Safe',           action: 'No impact - Routine monitoring' },
  watch:     { max: 1042, color: '#f97316', label: 'Watch',          action: 'Close monitoring - Increase surveillance' },
  warning:   { max: 1250, color: '#f97316', label: 'Warning',        action: 'Low-lying areas affected - Prepare response' },
  'severe-warning': { max: 1400, color: '#ea580c', label: 'Severe Warning', action: 'Riverside impacted - Mobilize resources' },
  emergency: { max: Infinity, color: '#ef4444', label: 'Emergency',  action: 'Flooding in lowland - Close risky routes' },
} as const;

// ===== STATION DEFINITIONS =====
// Coordinates based on Phrae Province hydrological network
export const STATION_DEFINITIONS = {
  'KY.1': {
    name: 'Nong Chan Bridge, Ban Klang Subdistrict, Song District, Phrae',
    nameThai: 'สะพานหนองจันทร์',
    lat: 18.50833,
    lng: 100.16183,
    channelCapacity: 600,
    type: 'mainstream' as const,
  },
  'Y.20': {
    name: 'Ban Huai Sak, Song, Phrae',
    nameThai: 'บ้านห้วยสัก',
    lat: 18.58611,
    lng: 100.15150,
    channelCapacity: 1104.00,
    type: 'mainstream' as const,
  },
  'Y.38': {
    name: 'Ban Mae Khami Tamnak Tham, Nong Muang Khai, Phrae',
    nameThai: 'ตำหนักธรรม',
    lat: 18.26633,
    lng: 100.23758,
    channelCapacity: 325.00,
    type: 'tributary' as const,
  },
  'Y.34': {
    name: 'Ban Mae Lai, Mueang Phrae, Phrae',
    nameThai: 'ต.แม่ลาย',
    lat: 18.21981,
    lng: 100.20619,
    channelCapacity: 535.00,
    type: 'tributary' as const,
  },
  'KY.2': {
    name: 'Wang Hong Bridge, Tha Kham Subdistrict, Mueang Phrae District, Phrae',
    nameThai: 'สะพานวังหงส์',
    lat: 18.21758,
    lng: 100.17847,
    channelCapacity: 1200,
    type: 'mainstream' as const,
  },
  'Y.1C': {
    name: 'Ban Nam Khong, Mueang Phrae, Phrae',
    nameThai: 'บ้านน้ำโค้ง',
    lat: 18.13406,
    lng: 100.12414,
    channelCapacity: 1042.00,
    type: 'mainstream' as const,
  },
  'KY.3': {
    name: 'Wang Chin Bridge',
    nameThai: 'สะพานวังชิ้น',
    lat: 17.90125,
    lng: 99.60542,
    channelCapacity: 1325.60,
    type: 'mainstream' as const,
  }
} as const;

// ===== FLOW ROUTES =====
export const FLOW_ROUTES: FlowRoute[] = [
  {
    name: 'Yom Mainstream',
    stations: ['Y.20', 'KY.1', 'KY.2', 'Y.1C', 'KY.3'],
    label: 'Y.20 → KY.1 → KY.2 → Y.1C → KY.3',
  },
  {
    name: 'Mae Kham Mi',
    stations: ['Y.38', 'KY.2'],
    label: 'Y.38 → KY.2',
  },
  {
    name: 'Mae Lai',
    stations: ['Y.34', 'KY.2'],
    label: 'Y.34 → KY.2',
  },
];

// ===== MAP CONFIG =====
export const MAP_CENTER: [number, number] = [18.24, 100.15];
export const MAP_ZOOM = 11;

// ===== POLLING INTERVALS =====
export const CRITICAL_POLL_INTERVAL = 60_000;   // 1 minute
export const FORECAST_POLL_INTERVAL = 300_000;  // 5 minutes

// ===== DATA STALENESS THRESHOLD =====
export const STALE_THRESHOLD_MS = 180_000; // 3 minutes

// ===== HELPER: Determine alert status from discharge =====
export function getAlertStatus(discharge: number): AlertStatus {
  if (discharge < 833.60) return 'safe';
  if (discharge <= 1042) return 'warning';
  return 'emergency';
}

export function getStationStatus(stationId: string, waterLevel: number, discharge: number): AlertStatus {
  if (stationId === 'KY.1') {
    if (waterLevel < 7.00) return 'safe';
    if (waterLevel < 8.00) return 'watch';
    if (waterLevel < 9.00) return 'warning';
    if (waterLevel <= 9.40) return 'severe-warning';
    return 'emergency';
  }
  if (stationId === 'KY.2') {
    if (waterLevel < 5.00) return 'safe';
    if (waterLevel < 6.00) return 'watch';
    if (waterLevel < 7.00) return 'warning';
    if (waterLevel <= 8.00) return 'severe-warning';
    return 'emergency';
  }
  
  // For Y stations and KY.3 — capacity-based thresholds
  const def = STATION_DEFINITIONS[stationId as keyof typeof STATION_DEFINITIONS];
  const cap = def?.channelCapacity || 1042;
  const percentage = (discharge / cap) * 100;

  if (percentage < 80)  return 'safe';
  if (percentage < 100) return 'watch';    // 80–100% = Watch (orange)
  if (percentage < 120) return 'warning';  // 100–120% = Warning (orange-red)
  return 'emergency';                      // >120% = Emergency (red)
}

export function getStatusColor(status: AlertStatus): string {
  return ALERT_THRESHOLDS[status].color;
}

export function getStatusLabel(status: AlertStatus): string {
  return ALERT_THRESHOLDS[status].label;
}

export function getStatusAction(status: AlertStatus): string {
  return ALERT_THRESHOLDS[status].action;
}

// ===== FORMAT HELPERS =====
export function formatDischarge(v: number): string {
  return v.toFixed(0);
}

export function formatWaterLevel(v: number): string {
  return v.toFixed(2);
}

export function formatPercent(v: number): string {
  return v.toFixed(1);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
