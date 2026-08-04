'use client';

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { StationReading } from '@/lib/types';
import { formatPercent } from '@/lib/constants';

interface PredictionResult {
  triggerId: string;
  triggerCapacity: number;
  triggerTrend: string;
  probabilityStr: string;
  probabilityLevel: 'Low' | 'Moderate' | 'High';
  probabilityColor: string;
  leadTime: string;
  ruleDesc: string;
  localRainfall: number;
}

function calculateCausalPrediction(stations: Record<string, StationReading>, targetDistrict: string | null): PredictionResult | null {
  const y20 = stations['Y.20'];
  const y38 = stations['Y.38'];
  
  // Find highest upstream trigger
  let trigger = y20;
  if (!trigger && y38) trigger = y38;
  else if (trigger && y38 && y38.capacityPercent > trigger.capacityPercent) {
    trigger = y38;
  }
  
  if (!trigger) return null;

  const capacity = trigger.capacityPercent;
  const isRising = trigger.trendDirection === 'rising';
  
  // Use Y.1C as the reference for local downstream rainfall, or default to 10
  const y1c = stations['Y.1C'];
  const localRainfall = y1c?.rainfall || 10; 

  let probabilityStr = 'Low (10%–25%)';
  let probabilityLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  let probabilityColor = '#22c55e'; // Green
  let leadTime = 'No Immediate Threat';
  let ruleDesc = `Upstream stations (< 70% capacity) pose no immediate threat to downstream locations.`;
  
  if (capacity >= 85) {
    probabilityLevel = 'High';
    if (localRainfall > 15) {
      probabilityStr = 'High / Severe (85%–95%)';
      probabilityColor = '#ef4444'; // Red
      leadTime = '2 to 3 Hours';
      ruleDesc = `High risk calculated due to upstream peak at ${trigger.stationId} (≥ 85% capacity) combining with intense ${localRainfall.toFixed(1)} mm/hr local rainfall.`;
    } else {
      probabilityStr = 'High (70%–80%)';
      probabilityColor = '#ef4444'; // Red
      leadTime = '3 to 4 Hours';
      ruleDesc = `High risk due to upstream peak at ${trigger.stationId} (≥ 85% capacity), though local rainfall is moderate (${localRainfall.toFixed(1)} mm/hr).`;
    }
  } else if (capacity >= 70 && capacity < 85 && isRising) {
    probabilityStr = 'Moderate (50%–65%)';
    probabilityLevel = 'Moderate';
    probabilityColor = '#eab308'; // Yellow
    leadTime = '~4 Hours';
    ruleDesc = `Moderate risk. Upstream station ${trigger.stationId} has reached Watch status and discharge is actively rising.`;
  }

  return {
    triggerId: trigger.stationId,
    triggerCapacity: capacity,
    triggerTrend: trigger.trendDirection.toUpperCase(),
    probabilityStr,
    probabilityLevel,
    probabilityColor,
    leadTime,
    ruleDesc,
    localRainfall
  };
}

export default function AnalyticalVisualization() {
  const stations = useSelector((s: RootState) => s.dashboard.stations);
  const selectedDistrict = useSelector((s: RootState) => s.dashboard.selectedDistrict);

  const prediction = useMemo(() => {
    return calculateCausalPrediction(stations, selectedDistrict);
  }, [stations, selectedDistrict]);

  const targetName = selectedDistrict ? `${selectedDistrict} District` : 'Y.1C (Mueang Phrae)';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ borderBottom: '2px solid #3b82f640' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span style={{ verticalAlign: 'middle' }}>⚡ Upstream Causal Flood Risk & Lead-Time Predictor</span>
      </div>
      
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto', padding: '16px' }}>
        
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          Deterministic Rule Engine | Target: <span style={{ color: '#0f172a' }}>{targetName}</span>
        </div>

        {!prediction ? (
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Awaiting upstream telemetry...</div>
        ) : (
          <>
            {/* Upstream Cause Indicator */}
            <div style={{ 
              padding: '12px', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ background: '#3b82f6', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                UPSTREAM TRIGGER
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>
                {prediction.triggerId} at {formatPercent(prediction.triggerCapacity)}% Capacity ({prediction.triggerTrend})
              </div>
            </div>

            {/* Main KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Probability */}
              <div className="kpi-chip" style={{ background: `${prediction.probabilityColor}10`, borderColor: `${prediction.probabilityColor}40` }}>
                <span className="kpi-label" style={{ color: prediction.probabilityColor }}>Calculated Flood Probability</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: prediction.probabilityColor, marginTop: '4px' }}>
                  {prediction.probabilityStr}
                </div>
              </div>

              {/* Lead Time */}
              <div className="kpi-chip">
                <span className="kpi-label">Estimated Impact Window</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {prediction.leadTime}
                </div>
              </div>
            </div>

            {/* Rule Explanation Box */}
            <div style={{ 
              marginTop: 'auto',
              padding: '16px', 
              background: '#ffffff', 
              borderLeft: `4px solid ${prediction.probabilityColor}`, 
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                Rule Explanation
              </div>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                {prediction.ruleDesc}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
