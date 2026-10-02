export interface GFSForecastData {
  north: number; // 6-hour cumulative rain in mm
  east: number;
  central: number;
  timestamp: string;
}

let cachedGfsData: GFSForecastData | null = null;
let lastGfsFetch = 0;
let pendingGfsRequest: Promise<GFSForecastData> | null = null;

export async function fetchGFSForecast(): Promise<GFSForecastData> {
  const now = Date.now();
  if (cachedGfsData && (now - lastGfsFetch < 60000)) {
    return cachedGfsData;
  }

  // Deduplicate concurrent requests
  if (pendingGfsRequest) {
    return pendingGfsRequest;
  }

  const url = 'https://api.open-meteo.com/v1/forecast?latitude=18.47,18.34,18.14&longitude=100.12,100.31,100.14&hourly=precipitation&models=gfs_seamless&timezone=auto';
  
  pendingGfsRequest = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch GFS forecast (Status: ${res.status})`);
      
      const data = await res.json();
      
      // Helper to extract first 6 hours of precipitation
      const parse6Hour = (locationData: any) => {
        if (locationData && locationData.hourly && locationData.hourly.precipitation) {
          const first6 = locationData.hourly.precipitation.slice(0, 6);
          return first6.reduce((sum: number, val: number) => sum + (val || 0), 0);
        }
        return 0;
      };

      let north = 0, east = 0, central = 0;

      if (Array.isArray(data)) {
        north = parse6Hour(data[0]);
        east = parse6Hour(data[1]);
        central = parse6Hour(data[2]);
      } else {
        north = parse6Hour(data);
      }

      const result = {
        north,
        east,
        central,
        timestamp: new Date().toISOString()
      };
      
      cachedGfsData = result;
      lastGfsFetch = now;
      return result;
      
    } catch (error) {
      console.warn('[gfsService] Error fetching GFS forecast:', error);
      // Return safe fallback
      return {
        north: 0,
        east: 0,
        central: 0,
        timestamp: new Date().toISOString()
      };
    } finally {
      pendingGfsRequest = null;
    }
  })();

  return pendingGfsRequest;
}
