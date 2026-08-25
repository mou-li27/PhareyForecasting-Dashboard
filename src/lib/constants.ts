import { AlertStatus, FlowRoute } from './types';

// ===== ALERT THRESHOLDS FOR Y.1C =====
export const Y1C_CHANNEL_CAPACITY = 1042; // cms baseline

export const ALERT_THRESHOLDS = {
  safe:      { max: 834,  color: '#22c55e', label: 'Safe',      action: 'No alert' },
  watch:     { max: 1042, color: '#eab308', label: 'Watch',     action: 'Monitor closely' },
  warning:   { max: 1250, color: '#f97316', label: 'Warning',   action: 'Alert authorities' },
  emergency: { max: Infinity, color: '#ef4444', label: 'Emergency', action: 'Activate emergency protocols' },
} as const;

// ===== STATION DEFINITIONS =====
// Coordinates based on Phrae Province hydrological network
export const STATION_DEFINITIONS = {
  'KY.1': {
    name: 'Nong Chan Bridge, Ban Klang',
    nameThai: 'สะพานหนองจันทร์',
    lat: 18.50833,
    lng: 100.16183,
    channelCapacity: 600,
    type: 'mainstream' as const,
  },
  'Y.20': {
    name: 'Ban Huai Sak (Above Mae Yom Weir)',
    nameThai: 'บ้านห้วยสัก',
    lat: 18.58611,
    lng: 100.15150,
    channelCapacity: 1500,
    type: 'mainstream' as const,
  },
  'Y.38': {
    name: 'Tamnak Tham (Mae Kham Mi)',
    nameThai: 'ตำหนักธรรม',
    lat: 18.26633,
    lng: 100.23758,
    channelCapacity: 350,
    type: 'tributary' as const,
  },
  'Y.34': {
    name: 'Mae Lai Subdistrict (Mae Lai)',
    nameThai: 'ต.แม่ลาย',
    lat: 18.21981,
    lng: 100.20619,
    channelCapacity: 300,
    type: 'tributary' as const,
  },
  'KY.2': {
    name: 'Wang Hong Bridge, Tha Kham',
    nameThai: 'สะพานวังหงส์',
    lat: 18.21758,
    lng: 100.17847,
    channelCapacity: 1200,
    type: 'mainstream' as const,
  },
  'Y.1C': {
    name: 'Ban Nam Khong',
    nameThai: 'บ้านน้ำโค้ง',
    lat: 18.13406,
    lng: 100.12414,
    channelCapacity: 1042,
    type: 'mainstream' as const,
  },
  'KY.3': {
    name: 'Wang Chin Bridge',
    nameThai: 'สะพานวังชิ้น',
    lat: 17.90125,
    lng: 99.60542,
    channelCapacity: 1800,
    type: 'mainstream' as const,
  }
} as const;

// ===== FLOW ROUTES =====
export const FLOW_ROUTES: FlowRoute[] = [
  {
    name: 'Yom Mainstream',
    stations: ['KY.1', 'Y.20', 'KY.2', 'Y.1C', 'KY.3'],
    label: 'KY.1 → Y.20 → KY.2 → Y.1C → KY.3',
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
  if (discharge < 834) return 'safe';
  if (discharge <= 1042) return 'watch';
  if (discharge <= 1250) return 'warning';
  return 'emergency';
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
