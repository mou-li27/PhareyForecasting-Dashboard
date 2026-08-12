import { StationReading } from '@/lib/types';
import { GFSForecastData } from '@/services/gfsService';
import { STATION_DEFINITIONS } from '@/lib/constants';

export interface CausalPrediction {
  projectedDischarge: number;
  rainContribution: number;
  upstreamContribution: number;
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  leadTime: string;
  causalBreakdown: string;
}

export function calculateCausalPrediction(
  stations: Record<string, StationReading>,
  gfsData: GFSForecastData | null,
  targetBasinId: string | null
): CausalPrediction | null {
  if (!targetBasinId) return null;

  const stationDef = STATION_DEFINITIONS[targetBasinId as keyof typeof STATION_DEFINITIONS];
  if (!stationDef) return null;

  const C = 0.75; 
  const A = 1000; 
  const conversionFactor = 0.2778; 
  
  let rainContribution = 0;
  let gfsRain = 0;
  let upstreamContribution = 0;
  let leadTime = 'No Immediate Threat';
  let causalBreakdown = '';
  
  const currentBaseflow = stations[targetBasinId]?.discharge || 0;
  let projectedDischarge = 0;

  // Determine which GFS region and upstream logic to apply based on targetBasinId
  if (targetBasinId === 'Y.20') {
    // North Region
    if (gfsData && gfsData.north > 0) {
      gfsRain = gfsData.north;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = 0; 
    leadTime = 'Immediate (Source Catchment)';
    projectedDischarge = currentBaseflow + rainContribution;
    causalBreakdown = `Localized risk driven by ${gfsRain.toFixed(1)}mm 6-hr GFS predicted rain over Song District combining with current baseflow (${currentBaseflow.toFixed(1)} cms).`;

  } else if (targetBasinId === 'Y.38' || targetBasinId === 'KM.1') {
    // East Region
    if (gfsData && gfsData.east > 0) {
      gfsRain = gfsData.east;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = targetBasinId === 'KM.1' ? (stations['Y.38']?.discharge || 0) : 0;
    leadTime = targetBasinId === 'KM.1' ? '~2.5 Hours' : 'Immediate (Source Catchment)';
    projectedDischarge = (targetBasinId === 'KM.1' ? upstreamContribution : currentBaseflow) + rainContribution;
    causalBreakdown = `Risk driven by ${gfsRain.toFixed(1)}mm 6-hr GFS predicted rain over Rong Kwang combining with upstream flow.`;

  } else if (targetBasinId === 'Y.1C') {
    // Central Region
    if (gfsData && gfsData.central > 0) {
      gfsRain = gfsData.central;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    const y20 = stations['Y.20']?.discharge || 0;
    const tributaries = (stations['Y.38']?.discharge || 0) + (stations['KM.1']?.discharge || 0);
    upstreamContribution = y20 + tributaries;
    leadTime = '~3.5 to 4.5 Hours';
    projectedDischarge = upstreamContribution + rainContribution;
    causalBreakdown = `Risk driven by ${gfsRain.toFixed(1)}mm 6-hr GFS predicted Central rain, plus upstream wave from Y.20 (${y20.toFixed(1)} cms) and eastern tributaries (${tributaries.toFixed(1)} cms).`;

  } else if (targetBasinId === 'KY.1') {
    if (gfsData && gfsData.central > 0) {
      gfsRain = gfsData.central;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = stations['Y.20']?.discharge || 0;
    leadTime = '~2.5 Hours';
    projectedDischarge = upstreamContribution + rainContribution;
    causalBreakdown = `Risk driven by upstream wave from Y.20 (${upstreamContribution.toFixed(1)} cms) and localized rain.`;

  } else {
    // Others (Y.34, KL.1, KS.1)
    if (gfsData && gfsData.central > 0) {
      gfsRain = gfsData.central;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = targetBasinId === 'KL.1' ? (stations['Y.34']?.discharge || 0) : 0;
    leadTime = 'Localized Flash Risk';
    projectedDischarge = (targetBasinId === 'KL.1' ? upstreamContribution : currentBaseflow) + rainContribution;
    causalBreakdown = `Risk driven primarily by localized Central rainfall (${gfsRain.toFixed(1)}mm) and current baseflow.`;
  }

  // Dynamic Risk Level Assessment
  let riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
  const capacity = stationDef.channelCapacity;
  
  if (capacity > 0) {
    if (projectedDischarge >= capacity) {
      riskLevel = 'High Risk';
      causalBreakdown = `HIGH RISK (Exceeds ${capacity} cms capacity). ` + causalBreakdown;
    } else if (projectedDischarge >= capacity * 0.8) {
      riskLevel = 'Moderate Risk';
      causalBreakdown = `MODERATE RISK (>80% of ${capacity} cms capacity). ` + causalBreakdown;
    }
  } else {
    // Fallback for sensors with 0 capacity mapped
    if (projectedDischarge >= 500) riskLevel = 'High Risk';
    else if (projectedDischarge >= 300) riskLevel = 'Moderate Risk';
  }

  // If safe
  if (riskLevel === 'Low Risk') {
    causalBreakdown = `Low risk. Projected flow (${projectedDischarge.toFixed(1)} cms) remains well within ${capacity > 0 ? capacity : 'safe limits'} cms capacity.`;
  }

  return {
    projectedDischarge,
    rainContribution,
    upstreamContribution,
    riskLevel,
    leadTime,
    causalBreakdown,
  };
}
