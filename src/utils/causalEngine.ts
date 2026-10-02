import { StationReading } from '@/lib/types';
import { GFSForecastData } from '@/services/gfsService';
import { STATION_DEFINITIONS } from '@/lib/constants';

export interface CausalPrediction {
  projectedDischarge: number;
  rainContribution: number;
  upstreamContribution: number;
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'Severe Risk' | 'Extreme Risk';
  targetStatus: 'safe' | 'watch' | 'warning' | 'severe-warning' | 'emergency';
  targetStatusText: string;
  leadTime: string; // Urgency
  causalBreakdown: string;
  y20Status: string;
  ky1Trend: string;
  certainty: string;
  actionProtocol: string;
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
  if (targetBasinId === 'KY.1') {
    if (gfsData && gfsData.north > 0) {
      gfsRain = gfsData.north;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = 0;
    leadTime = 'Immediate (Source Catchment)';
    projectedDischarge = currentBaseflow + rainContribution;
    causalBreakdown = `Localized risk driven by ${gfsRain.toFixed(1)}mm 6-hr GFS predicted rain over Song District (Upper).`;

  } else if (targetBasinId === 'Y.20') {
    if (gfsData && gfsData.north > 0) {
      gfsRain = gfsData.north;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = stations['KY.1']?.discharge || 0;
    const lateralBaseflow = Math.max(0, currentBaseflow - (stations['KY.1']?.discharge || 0));
    leadTime = '~1-2 Hours';
    projectedDischarge = upstreamContribution + rainContribution + lateralBaseflow;
    causalBreakdown = `Risk driven by upstream wave from KY.1 (${upstreamContribution.toFixed(1)} cms), lateral inflow (${lateralBaseflow.toFixed(1)} cms), and localized rain.`;

  } else if (targetBasinId === 'Y.38' || targetBasinId === 'Y.34') {
    if (gfsData && gfsData.central > 0) {
      gfsRain = gfsData.central;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = 0;
    leadTime = 'Localized Flash Risk';
    projectedDischarge = currentBaseflow + rainContribution;
    causalBreakdown = `Risk driven primarily by localized Central rainfall (${gfsRain.toFixed(1)}mm) and current baseflow.`;

  } else if (targetBasinId === 'KY.2') {
    if (gfsData && gfsData.central > 0) {
      gfsRain = gfsData.central;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    const y20 = stations['Y.20']?.discharge || 0;
    const tributaries = (stations['Y.38']?.discharge || 0) + (stations['Y.34']?.discharge || 0);
    upstreamContribution = y20 + tributaries;
    const lateralBaseflow = Math.max(0, currentBaseflow - upstreamContribution);
    leadTime = '~2.5 Hours';
    projectedDischarge = upstreamContribution + rainContribution + lateralBaseflow;
    causalBreakdown = `Risk driven by upstream wave from Y.20 (${y20.toFixed(1)} cms), tributaries (${tributaries.toFixed(1)} cms), and local rain.`;

  } else if (targetBasinId === 'Y.1C') {
    if (gfsData && gfsData.central > 0) {
      gfsRain = gfsData.central;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = stations['KY.2']?.discharge || 0;
    const lateralBaseflow = Math.max(0, currentBaseflow - upstreamContribution);
    leadTime = '~3.5 to 4.5 Hours';
    projectedDischarge = upstreamContribution + rainContribution + lateralBaseflow;
    causalBreakdown = `Risk driven by ${gfsRain.toFixed(1)}mm GFS predicted Central rain, plus upstream wave from KY.2 (${upstreamContribution.toFixed(1)} cms) and lateral inflow.`;

  } else if (targetBasinId === 'KY.3') {
    if (gfsData && gfsData.central > 0) {
      gfsRain = gfsData.central;
      rainContribution = C * (gfsRain / 6) * A * conversionFactor;
    }
    upstreamContribution = stations['Y.1C']?.discharge || 0;
    const lateralBaseflow = Math.max(0, currentBaseflow - upstreamContribution);
    leadTime = '~6.0 to 8.0 Hours';
    projectedDischarge = upstreamContribution + rainContribution + lateralBaseflow;
    causalBreakdown = `Downstream risk driven by Central wave originating from Y.1C (${upstreamContribution.toFixed(1)} cms), lateral inflow, and local rainfall.`;
  }

  // Determine Level based on physical thresholds
  const capacity = stationDef.channelCapacity;
  const targetRatio = capacity > 0 ? projectedDischarge / capacity : (projectedDischarge / 500);
  const y20Discharge = stations['Y.20']?.discharge || 0;
  const y20Ratio = y20Discharge / (STATION_DEFINITIONS['Y.20']?.channelCapacity || 1500);
  const isRising = stations['KY.1']?.trendDirection === 'rising';
  const isImmediate = leadTime.includes('Immediate') || leadTime.includes('1-2') || leadTime.includes('2.5');

  let level: 1|2|3|4|5|6|7 = 1;
  const maxRatio = Math.max(targetRatio, y20Ratio);

  if (maxRatio >= 1.2) {
    if (isRising && isImmediate) level = 7;
    else level = 6;
  } else if (maxRatio >= 1.0 || (isRising && isImmediate)) {
    // Data Contradiction Prevention: Rising + Immediate forces at least Level 4 or 5
    if (isRising && isImmediate) level = 5;
    else if (isRising) level = 4;
    else level = 3;
  } else if (maxRatio >= 0.8) {
    if (isRising) level = 3; // Enforce rising threshold
    else level = 2;
  } else {
    level = 1;
  }

  // Causal Catalog Matrix
  const catalog = {
    1: { y20: 'Safe (<80%)', ky1: 'Stable', targetStatus: 'safe', targetText: 'Safe (<80%)', severity: 'Low Risk', urgency: 'Future', certainty: 'Possible (<50%)', action: 'Routine monitoring' },
    2: { y20: 'Watch (80-100%)', ky1: 'Stable / Slight Rise', targetStatus: 'safe', targetText: 'Safe (<80%)', severity: 'Low Risk', urgency: 'Future', certainty: 'Possible (<50%)', action: 'Increase monitoring, notify technical staff' },
    3: { y20: 'Warning (>100%)', ky1: 'Rising (Not Confirmed)', targetStatus: 'watch', targetText: 'Watch (80-100%)', severity: 'Moderate Risk', urgency: 'Expected (6 hr)', certainty: 'Possible (50-70%)', action: 'Prepare response team, check flood-prone zones' },
    4: { y20: 'Warning (>100%)', ky1: 'Rising Trend Clearly', targetStatus: 'watch', targetText: 'Watch (80-100%)', severity: 'Moderate Risk', urgency: 'Expected (3 hr)', certainty: 'Likely (70-80%)', action: 'Issue preparedness notice, pre-deploy resources' },
    5: { y20: 'Warning (>100%)', ky1: 'Confirmed Flood Wave', targetStatus: 'warning', targetText: 'Near / At Threshold (~100%)', severity: 'Severe Risk', urgency: 'Immediate (<=3 hr)', certainty: 'Likely (>80%)', action: 'Public warning, protect infrastructure, activate field teams' },
    6: { y20: 'Emergency (>120%)', ky1: 'Strong Surge (Peak Moving)', targetStatus: 'warning', targetText: 'Warning (>100%)', severity: 'Severe Risk', urgency: 'Immediate (<=3 hr)', certainty: 'Observed (100%)', action: 'Emergency response, road closure, evacuation readiness' },
    7: { y20: 'Emergency (>120%)', ky1: 'Strong Surge Confirmed', targetStatus: 'emergency', targetText: 'Emergency (>120%)', severity: 'Extreme Risk', urgency: 'Immediate (<=3 hr)', certainty: 'Observed (100%)', action: 'Full evacuation, command center activation' },
  } as const;

  const row = catalog[level];

  // Build station-appropriate upstream status label
  let upstreamStatusText = row.y20;
  let upstreamTrendText = row.ky1;

  if (targetBasinId === 'KY.1') {
    // KY.1 is headwater — upstream is GFS rainfall, no river station above it
    upstreamStatusText = gfsRain > 50 ? `High GFS Rain (${gfsRain.toFixed(1)}mm)` : gfsRain > 20 ? `Moderate Rain (${gfsRain.toFixed(1)}mm)` : `Low Rain (${gfsRain.toFixed(1)}mm)`;
    upstreamTrendText = row.ky1; // KY.1 itself
  } else if (targetBasinId === 'Y.20') {
    upstreamStatusText = 'N/A (Headwater)';
    // KY.1 is direct upstream for Y.20
    const ky1Status = stations['KY.1']?.status || 'safe';
    upstreamTrendText = ky1Status === 'rising' ? 'Rising' : row.ky1;
  } else if (targetBasinId === 'Y.38' || targetBasinId === 'Y.34') {
    upstreamStatusText = gfsRain > 30 ? `Heavy Local Rain (${gfsRain.toFixed(1)}mm)` : `Local Rain (${gfsRain.toFixed(1)}mm)`;
    upstreamTrendText = row.ky1;
  } else if (targetBasinId === 'KY.3') {
    // Upstream of KY.3 is Y.1C
    const y1cDischarge = stations['Y.1C']?.discharge || 0;
    const y1cCap = (y1cDischarge / (STATION_DEFINITIONS['Y.1C']?.channelCapacity || 1042)) * 100;
    upstreamStatusText = y1cCap >= 120 ? `Emergency (>120%)` : y1cCap >= 100 ? `Warning (>100%)` : y1cCap >= 80 ? `Watch (80-100%)` : `Safe (<80%)`;
    const y1cTrend = stations['Y.1C']?.trendDirection || 'stable';
    upstreamTrendText = y1cTrend === 'rising' ? 'Rising Trend' : y1cTrend === 'falling' ? 'Falling / Receding' : 'Stable';
  }

  return {
    projectedDischarge,
    rainContribution,
    upstreamContribution,
    riskLevel: row.severity as any,
    targetStatus: row.targetStatus as any,
    targetStatusText: row.targetText,
    leadTime: row.urgency,
    causalBreakdown: `Determined as Level ${level} based on Causal Catalog Matrix. Projected Flow: ${projectedDischarge.toFixed(1)} cms. Base Breakdown: ${causalBreakdown}`,
    y20Status: upstreamStatusText,
    ky1Trend: upstreamTrendText,
    certainty: row.certainty,
    actionProtocol: row.action,
  };
}
