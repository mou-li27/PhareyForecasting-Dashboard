export interface GFSForecastData {
  north: number; // 6-hour cumulative rain in mm
  east: number;
  central: number;
  timestamp: string;
}

export async function fetchGFSForecast(): Promise<GFSForecastData> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=18.47,18.34,18.14&longitude=100.12,100.31,100.14&hourly=precipitation&models=gfs_seamless&timezone=auto';
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch GFS forecast');
    
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
      // Multiple coordinates return an array
      north = parse6Hour(data[0]);
      east = parse6Hour(data[1]);
      central = parse6Hour(data[2]);
    } else {
      // Just in case it returns a single object and we failed to request multiple correctly
      north = parse6Hour(data);
    }

    return {
      north,
      east,
      central,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[gfsService] Error fetching GFS forecast:', error);
    // Return safe fallback
    return {
      north: 0,
      east: 0,
      central: 0,
      timestamp: new Date().toISOString()
    };
  }
}
