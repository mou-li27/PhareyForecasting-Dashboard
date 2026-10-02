import { StationReading, ForecastHorizon } from './types';
import { generateMockData, setLatestGFS } from './mockData';
import { fetchGFSForecast } from '@/services/gfsService';

// ===== API CONFIGURATION =====
const API_CONFIG = {
  thaiwater: {
    baseUrl: process.env.NEXT_PUBLIC_THAIWATER_API_URL || 'https://api-v3.thaiwater.net/api/v1',
    apiKey: process.env.NEXT_PUBLIC_THAIWATER_API_KEY || '',
  },
  rika: {
    baseUrl: process.env.NEXT_PUBLIC_RIKA_API_URL || 'https://cloud.rika.hk/api/v1',
    apiKey: process.env.NEXT_PUBLIC_RIKA_API_KEY || '',
  },
  haiwell: {
    baseUrl: process.env.NEXT_PUBLIC_HAIWELL_API_URL || 'https://cloud.haiwell.com/api',
    apiKey: process.env.NEXT_PUBLIC_HAIWELL_API_KEY || '',
  },
};

// ===== RATE LIMITING =====
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // minimum 5 seconds between requests per endpoint

function isRateLimited(endpoint: string): boolean {
  const lastCall = rateLimitMap.get(endpoint);
  if (lastCall && Date.now() - lastCall < RATE_LIMIT_MS) return true;
  rateLimitMap.set(endpoint, Date.now());
  return false;
}

// ===== CACHED VALUES =====
let cachedStations: Record<string, StationReading> | null = null;
let cachedForecasts: ForecastHorizon[] | null = null;

// ===== THAIWATER API SERVICE =====
async function fetchThaiWaterData(): Promise<Record<string, StationReading> | null> {
  const endpoint = 'thaiwater/water-level';
  if (isRateLimited(endpoint)) return cachedStations;
  if (!API_CONFIG.thaiwater.apiKey) return null;

  try {
    const response = await fetch(
      `${API_CONFIG.thaiwater.baseUrl}/thaiwater/water_level`,
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.thaiwater.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) throw new Error(`ThaiWater API error: ${response.status}`);
    const data = await response.json();
    // Transform API response to StationReading format
    return transformThaiWaterResponse(data);
  } catch (error) {
    console.warn('[API] ThaiWater fetch failed, using cached data:', error);
    return cachedStations;
  }
}

// ===== RIKA CLOUD API SERVICE =====
async function fetchRikaCloudData(): Promise<any | null> {
  const endpoint = 'rika/sensors';
  if (isRateLimited(endpoint)) return null;

  try {
    console.trace('[API] Firing fetch to /api/rika. Rate limit bypassed?');
    const response = await fetch('/api/rika', {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`RIKA API error: ${response.status}`);
    const data = await response.json();
    
    // If backend caught a network error and returned graceful fallback
    if (data?.fallback) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('[API] RIKA Cloud fetch failed:', error);
    return null;
  }
}

// ===== TRANSFORM FUNCTIONS =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformThaiWaterResponse(_data: any): Record<string, StationReading> | null {
  // Production: transform real API response to StationReading format
  // This is a placeholder for actual API response mapping
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRikaResponse(_data: any): Partial<StationReading> | null {
  // Production: transform RIKA sensor data
  return null;
}

// ===== UNIFIED DATA FETCH WITH MOCK FALLBACK =====
export async function fetchAllStationData(): Promise<{
  stations: Record<string, StationReading>;
  forecasts: ForecastHorizon[];
  source: 'live' | 'mock';
}> {
  // Try live APIs first
  const liveData = await fetchThaiWaterData();
  const rikaPayload = await fetchRikaCloudData();

  let parsedRika: Record<string, any> | null = null;
  if (rikaPayload && rikaPayload.device) {
    const data: Record<string, any> = {};
    rikaPayload.device.forEach((s: any) => {
      if (s.agri_name === 'rainfall') data.rainfall = s.value;
      if (s.agri_name === 'soli_humi') data.soilMoisture = s.value;
      if (s.agri_name === 'wind speed') data.windSpeed = s.value;
    });
    parsedRika = data;
  }

  if (liveData && Object.keys(liveData).length > 0) {
    cachedStations = liveData;
    // Generate forecasts based on live Y.1C data
    const mockForecasts = generateMockData(parsedRika).forecasts;
    cachedForecasts = mockForecasts;
    return { stations: liveData, forecasts: mockForecasts, source: 'live' };
  }

  // Fallback to deterministic data — sync GFS first
  try {
    const gfs = await fetchGFSForecast();
    setLatestGFS(gfs);
  } catch (_) {
    // GFS unavailable
  }
  
  // Inject real RIKA telemetry into the deterministic pipeline
  const pipelineData = generateMockData(parsedRika);
  cachedStations = pipelineData.stations;
  cachedForecasts = pipelineData.forecasts;
  return { stations: pipelineData.stations, forecasts: pipelineData.forecasts, source: parsedRika ? 'live' : 'mock' };
}

// ===== INDIVIDUAL STATION FETCH =====
export async function fetchStationById(stationId: string): Promise<StationReading | null> {
  const { stations } = await fetchAllStationData();
  return stations[stationId] || null;
}
