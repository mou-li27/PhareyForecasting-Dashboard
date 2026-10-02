'use client';

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { calculateCausalPrediction } from '@/utils/causalEngine';
import { STATION_DEFINITIONS, getStatusColor, getStatusLabel } from '@/lib/constants';

export default function CausalPredictorPanel() {
  const stations = useSelector((s: RootState) => s.dashboard.stations);
  const gfsState = useSelector((s: RootState) => s.gfsForecast);
  const selectedBasin = useSelector((s: RootState) => s.dashboard.selectedBasin);

  const prediction = useMemo(() => {
    return calculateCausalPrediction(stations, gfsState?.data || null, selectedBasin);
  }, [stations, gfsState?.data, selectedBasin]);

  const probabilityColor = (prediction?.riskLevel === 'Severe Risk' || prediction?.riskLevel === 'Extreme Risk' || prediction?.riskLevel === 'High Risk' as any) ? '#ef4444' : prediction?.riskLevel === 'Moderate Risk' ? '#eab308' : '#22c55e';
  const targetName = selectedBasin ? `${selectedBasin} (${STATION_DEFINITIONS[selectedBasin as keyof typeof STATION_DEFINITIONS]?.name})` : 'None Selected';

  const targetStatus = prediction ? prediction.targetStatus : (selectedBasin ? stations[selectedBasin]?.status || 'safe' : 'safe');
  const targetStatusColor = getStatusColor(targetStatus);
  const targetStatusLabel = getStatusLabel(targetStatus);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ borderBottom: '2px solid #3b82f640', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span style={{ verticalAlign: 'middle' }}>Causal River Routing Model</span>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: '4px' }}>
          ENGINE ACTIVE
        </div>
      </div>
      
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto', padding: '16px' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          Hydrological Routing | Target: <span style={{ color: '#0f172a' }}>{targetName}</span>
        </div>

        {!selectedBasin || !prediction ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '0 20px' }}>
            Please select a River Basin from the Map or Telemetry Panel to view its localized causal routing matrix.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Prominent Lead Time & Risk Indicator */}
            {(() => {
              const isSafe = prediction.riskLevel === 'Low Risk';
              const isAmber = prediction.riskLevel === 'Moderate Risk';
              
              if (isSafe) {
                return (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                         <polyline points="22 4 12 14.01 9 11.01" />
                       </svg>
                       <div>
                         <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>NO FLOOD SURGE PROJECTED</div>
                         <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>CHANNEL WITHIN CAPACITY</div>
                       </div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Severity</div>
                       <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22c55e' }}>{prediction.riskLevel}</div>
                     </div>
                  </div>
                );
              }

              return (
                <div style={{ background: isAmber ? '#fef3c7' : '#fee2e2', border: `1px solid ${probabilityColor}`, borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: `0 4px 12px ${probabilityColor}30` }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={probabilityColor} strokeWidth="2.5" style={{ animation: 'blink-alert 2s infinite' }}>
                       <circle cx="12" cy="12" r="10" />
                       <polyline points="12 6 12 12 16 14" />
                     </svg>
                     <div>
                       <div style={{ fontSize: '0.95rem', fontWeight: 800, color: probabilityColor, textShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>ESTIMATED FLOOD ARRIVAL:</div>
                       <div style={{ fontSize: '1.15rem', color: '#0f172a', marginTop: '2px', fontWeight: 800, letterSpacing: '-0.02em' }}>{prediction.leadTime.toUpperCase()}</div>
                     </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Severity</div>
                     <div style={{ fontSize: '1.05rem', fontWeight: 800, color: probabilityColor }}>{prediction.riskLevel.toUpperCase()}</div>
                   </div>
                </div>
              );
            })()}

            {/* Sensor Matrix — dynamic upstream labels per station */}
            {(() => {
              // Define upstream reference station per target
              const upstreamMap: Record<string, { label: string; key: string }> = {
                'KY.1': { label: 'GFS North Rain', key: 'gfs' },
                'Y.20': { label: 'KY.1 (Upstream)', key: 'ky1' },
                'Y.38': { label: 'GFS Central Rain', key: 'gfs' },
                'Y.34': { label: 'GFS Central Rain', key: 'gfs' },
                'KY.2': { label: 'Y.20 (Upstream)', key: 'y20' },
                'Y.1C': { label: 'Y.20 (Upstream)', key: 'y20' },
                'KY.3': { label: 'Y.1C (Upstream)', key: 'y1c' },
              };
              const upstreamInfo = selectedBasin ? (upstreamMap[selectedBasin] || { label: 'Y20 (Upstream)', key: 'y20' }) : { label: 'Y20 (Upstream)', key: 'y20' };
              const upstreamStatusColor = prediction.y20Status.includes('Safe') ? '#22c55e' : prediction.y20Status.includes('Watch') ? '#f97316' : '#ef4444';
              // KY1 trend label: depends on target — for KY.1 itself, show GFS; for others show KY.1
              const trendLabel = selectedBasin === 'KY.1' ? 'GFS Rainfall' : 'KY.1 Trend';
              const trendColor = (prediction.ky1Trend.includes('Rising') || prediction.ky1Trend.includes('Surge') || prediction.ky1Trend.includes('Confirmed')) ? '#ef4444' : '#22c55e';
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{upstreamInfo.label}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: upstreamStatusColor }}>
                      {prediction.y20Status}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{trendLabel}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: trendColor }}>
                      {prediction.ky1Trend}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: `1px solid ${targetStatusColor}40` }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{selectedBasin} (Target)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: targetStatusColor }}>
                      {targetStatusLabel}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Flow Contribution Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div className="kpi-chip">
                <span className="kpi-label">Projected Peak Flow</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {prediction.projectedDischarge.toFixed(0)} <span className="kpi-unit">cms</span>
                </div>
              </div>

              <div className="kpi-chip">
                <span className="kpi-label">Flow Origin Breakdown</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  {prediction.upstreamContribution.toFixed(0)} <span className="kpi-unit">base</span> + {prediction.rainContribution.toFixed(0)} <span className="kpi-unit">rain</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Certainty</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: prediction.certainty.includes('High') ? '#ef4444' : '#0f172a' }}>{prediction.certainty}</span>
            </div>

            {/* Action Protocol */}
            <div style={{ 
              marginTop: 'auto',
              padding: '12px 16px', 
              background: '#ffffff', 
              borderLeft: `4px solid ${probabilityColor}`, 
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                Recommended Action Protocol
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: probabilityColor }}>
                {prediction.actionProtocol}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
