import { StationReading, ForecastHorizon, DataPoint, AlertStatus } from './types';
import { STATION_DEFINITIONS, getAlertStatus, Y1C_CHANNEL_CAPACITY } from './constants';
import { GFSForecastData } from '@/services/gfsService';

// ===== GFS-AWARE MOCK DATA GENERATOR =====
// All telemetry is now derived from real GFS rainfall so both panels stay coherent.

let mockTick = 0;

// Latest GFS data — updated externally before each poll
let latestGFS: GFSForecastData | null = null;

/** Call this with fresh GFS data before generating mock station data */
export function setLatestGFS(gfs: GFSForecastData) {
  latestGFS = gfs;
}

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert 6-hr GFS rainfall (mm) to a discharge multiplier.
 * 0 mm  → 0.55  (recession — river falling after dry spell)
 * 10 mm → 0.72  (stable baseflow)
 * 25 mm → 0.88  (elevated but normal)
 * 50 mm → 1.05  (high flow, Watch territory)
 * 80 mm → 1.25  (Warning territory)
 * 120mm → 1.45  (Emergency / flood scenario)
 */
function rainToFlowFactor(rainMm: number): number {
  if (rainMm <= 0)   return jitter(0.55, 0.04);
  if (rainMm <= 10)  return jitter(0.72, 0.04);
  if (rainMm <= 25)  return jitter(0.88, 0.05);
  if (rainMm <= 50)  return jitter(1.05, 0.06);
  if (rainMm <= 80)  return jitter(1.25, 0.07);
  return jitter(1.45, 0.08);
}

/**
 * Convert 6-hr rainfall to trend direction.
 * Dry  → falling / stable
 * Wet  → stable / rising
 */
function rainToTrend(rainMm: number): { trend: number; direction: 'rising' | 'falling' | 'stable' } {
  if (rainMm <= 3)  {
    const t = jitter(-0.18, 0.12);
    return { trend: t, direction: t < -0.1 ? 'falling' : 'stable' };
  }
  if (rainMm <= 20) {
    const t = jitter(0.02, 0.14);
    return { trend: t, direction: t > 0.1 ? 'rising' : t < -0.1 ? 'falling' : 'stable' };
  }
  if (rainMm <= 50) {
    const t = jitter(0.22, 0.12);
    return { trend: t, direction: 'rising' };
  }
  const t = jitter(0.55, 0.18);
  return { trend: t, direction: 'rising' };
}

// Approximate water level from discharge (simplified Manning stage-discharge)
function valueToWaterLevel(discharge: number): number {
  return 8.0 + Math.pow(discharge / 120, 0.6);
}

// Generate a 24-hr hydrograph consistent with the rainfall direction
function generateHistory(currentValue: number, rainMm: number, points = 48): DataPoint[] {
  const history: DataPoint[] = [];
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / points;

  if (rainMm <= 5) {
    // Recession curve — started higher, now coming down
    const peakValue = currentValue * jitter(1.35, 0.1);
    for (let i = 0; i < points; i++) {
      const time = new Date(now - (points - i) * interval).toISOString();
      const progress = i / points;
      // Exponential recession
      const value = peakValue * Math.exp(-2.5 * progress) + currentValue * (1 - Math.exp(-2.5 * progress));
      history.push({
        time,
        value: Math.round(jitter(value, value * 0.02) * 10) / 10,
        waterLevel: Math.round(valueToWaterLevel(value) * 100) / 100,
      });
    }
  } else if (rainMm <= 30) {
    // Stable — small fluctuations around current value
    for (let i = 0; i < points; i++) {
      const time = new Date(now - (points - i) * interval).toISOString();
      const value = jitter(currentValue, currentValue * 0.08);
      history.push({
        time,
        value: Math.round(Math.max(0, value) * 10) / 10,
        waterLevel: Math.round(valueToWaterLevel(Math.max(0, value)) * 100) / 100,
      });
    }
  } else {
    // Rising hydrograph — sigmoid rise to current value
    const baseValue = currentValue * 0.55;
    const riseStart = Math.floor(points * 0.35);
    for (let i = 0; i < points; i++) {
      const time = new Date(now - (points - i) * interval).toISOString();
      let value: number;
      if (i < riseStart) {
        value = jitter(baseValue, baseValue * 0.05);
      } else {
        const progress = (i - riseStart) / (points - riseStart);
        const sigmoid = 1 / (1 + Math.exp(-8 * (progress - 0.5)));
        value = baseValue + (currentValue - baseValue) * sigmoid;
        value = jitter(value, currentValue * 0.03);
      }
      history.push({
        time,
        value: Math.round(Math.max(0, value) * 10) / 10,
        waterLevel: Math.round(valueToWaterLevel(Math.max(0, value)) * 100) / 100,
      });
    }
  }

  return history;
}

// Per-station GFS zone assignment
function getStationRain(stationId: string, gfs: GFSForecastData | null): number {
  if (!gfs) return 5; // default small rain
  switch (stationId) {
    case 'KY.1':
    case 'Y.20':
      return gfs.north;
    case 'Y.38':
      return gfs.east;
    case 'Y.34':
    case 'KY.2':
    case 'Y.1C':
      return gfs.central;
    case 'KY.3':
      // Downstream of everything — weighted average of all zones
      return (gfs.north * 0.3 + gfs.central * 0.5 + gfs.east * 0.2);
    default:
      return gfs.central;
  }
}

// Baseline discharge per station (at normal conditions)
const BASE_DISCHARGE: Record<string, number> = {
  'KY.1':  420,
  'Y.20':  590,
  'Y.38':  155,
  'Y.34':  130,
  'KY.2':  780,
  'Y.1C':  870,
  'KY.3': 1050,
};

function generateStationReading(stationId: string): StationReading {
  const def = STATION_DEFINITIONS[stationId as keyof typeof STATION_DEFINITIONS];
  if (!def) throw new Error(`Unknown station: ${stationId}`);

  const rain = getStationRain(stationId, latestGFS);
  const flowFactor = rainToFlowFactor(rain);
  const { trend, direction } = rainToTrend(rain);

  const phase = mockTick * 0.02;
  const base = BASE_DISCHARGE[stationId] ?? 500;
  const amplitude = base * 0.08;

  let discharge = jitter(base * flowFactor + Math.sin(phase) * amplitude, base * 0.02);
  discharge = Math.max(0, discharge);

  const capacityPercent = def.channelCapacity > 0
    ? (discharge / def.channelCapacity) * 100
    : 0;

  const waterLevel = valueToWaterLevel(discharge);

  // Status derived from discharge (same thresholds as before)
  const status = getAlertStatus(discharge * (Y1C_CHANNEL_CAPACITY / (def.channelCapacity || 1042)));

  const history = generateHistory(discharge, rain);

  // Rainfall shown in telemetry should match GFS zone (not random)
  const rainfallDisplay = rain > 0 ? jitter(rain, rain * 0.15) : jitter(0.5, 0.5);

  return {
    stationId,
    name: def.name,
    nameThai: def.nameThai,
    lat: def.lat,
    lng: def.lng,
    waterLevel: Math.round(waterLevel * 100) / 100,
    discharge: Math.round(discharge * 10) / 10,
    channelCapacity: def.channelCapacity,
    capacityPercent: Math.round(capacityPercent * 10) / 10,
    trend: Math.round(trend * 100) / 100,
    trendDirection: direction,
    status,
    timestamp: new Date().toISOString(),
    type: def.type,
    rainfall: Math.round(Math.max(0, rainfallDisplay) * 10) / 10,
    soilMoisture: rain > 30 ? jitter(88, 6) : rain > 10 ? jitter(72, 8) : jitter(55, 8),
    windSpeed: jitter(3.5, 3),
    history,
  };
}

// Generate internal forecasts consistent with GFS
function generateForecasts(currentDischarge: number): ForecastHorizon[] {
  const rain = latestGFS
    ? (latestGFS.north + latestGFS.central + latestGFS.east) / 3
    : 5;

  // Growth rate: dry = slight decline, wet = growth
  const growthPerHour = rain <= 5  ? -0.008
    : rain <= 25 ?  0.015
    : rain <= 60 ?  0.04
    :               0.07;

  const horizons = [
    { horizon: '1h', hours: 1 },
    { horizon: '3h', hours: 3 },
    { horizon: '6h', hours: 6 },
  ];

  return horizons.map(({ horizon, hours }) => {
    const growthRate = 1 + growthPerHour * hours;
    const predictedDischarge = clamp(
      jitter(currentDischarge * growthRate, currentDischarge * 0.02),
      0, 2000
    );
    const predictedWaterLevel = valueToWaterLevel(predictedDischarge);
    const forecastCapacityPercent = (predictedDischarge / Y1C_CHANNEL_CAPACITY) * 100;
    const uncertaintyPercent = 3 + hours * 2.5;

    const trend: DataPoint[] = [];
    for (let i = 0; i <= hours * 4; i++) {
      const t = new Date(Date.now() + i * 15 * 60 * 1000).toISOString();
      const progress = i / (hours * 4);
      const v = currentDischarge + (predictedDischarge - currentDischarge) * progress;
      trend.push({
        time: t,
        value: Math.round(jitter(v, v * 0.02) * 10) / 10,
        waterLevel: Math.round(valueToWaterLevel(v) * 100) / 100,
      });
    }

    return {
      horizon,
      hours,
      predictedDischarge: Math.round(predictedDischarge * 10) / 10,
      predictedWaterLevel: Math.round(predictedWaterLevel * 100) / 100,
      forecastCapacityPercent: Math.round(forecastCapacityPercent * 10) / 10,
      confidenceUpper: Math.round(predictedDischarge * (1 + uncertaintyPercent / 100) * 10) / 10,
      confidenceLower: Math.round(predictedDischarge * (1 - uncertaintyPercent / 100) * 10) / 10,
      uncertaintyPercent: Math.round(uncertaintyPercent * 10) / 10,
      status: getAlertStatus(predictedDischarge),
      trend,
      timestamp: new Date().toISOString(),
    };
  });
}

// ===== MAIN EXPORT =====
export function generateMockData(): {
  stations: Record<string, StationReading>;
  forecasts: ForecastHorizon[];
} {
  mockTick++;

  const stationIds = Object.keys(STATION_DEFINITIONS);
  const stations: Record<string, StationReading> = {};
  for (const id of stationIds) {
    stations[id] = generateStationReading(id);
  }

  const y1cDischarge = stations['Y.1C']?.discharge ?? 870;
  const forecasts = generateForecasts(y1cDischarge);

  return { stations, forecasts };
}

export function getInitialMockData() {
  return generateMockData();
}
