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
            
            {/* Sensor Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Y20 (Upstream)</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: prediction.y20Status.includes('Safe') ? '#22c55e' : (prediction.y20Status.includes('Watch') ? '#eab308' : '#ef4444') }}>
                  {prediction.y20Status}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>KY1 Trend</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: prediction.ky1Trend === 'Rising' ? '#ef4444' : '#22c55e' }}>
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

            {/* Calculated Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div className="kpi-chip" style={{ background: `${probabilityColor}10`, borderColor: `${probabilityColor}40` }}>
                <span className="kpi-label" style={{ color: probabilityColor }}>Severity Level</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: probabilityColor, marginTop: '4px' }}>
                  {prediction.riskLevel}
                </div>
              </div>

              <div className="kpi-chip">
                <span className="kpi-label">Urgency / Arrival</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px', lineHeight: 1.2 }}>
                  {prediction.leadTime}
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
