'use client';

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { calculateCausalPrediction } from '@/utils/causalEngine';
import { STATION_DEFINITIONS } from '@/lib/constants';

export default function CausalPredictorPanel() {
  const stations = useSelector((s: RootState) => s.dashboard.stations);
  const gfsState = useSelector((s: RootState) => s.gfsForecast);
  const selectedBasin = useSelector((s: RootState) => s.dashboard.selectedBasin);

  const prediction = useMemo(() => {
    return calculateCausalPrediction(stations, gfsState?.data || null, selectedBasin);
  }, [stations, gfsState?.data, selectedBasin]);

  const probabilityColor = prediction?.riskLevel === 'High Risk' ? '#ef4444' : prediction?.riskLevel === 'Moderate Risk' ? '#eab308' : '#22c55e';
  const targetName = selectedBasin ? `${selectedBasin} (${STATION_DEFINITIONS[selectedBasin as keyof typeof STATION_DEFINITIONS]?.name})` : 'None Selected';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ borderBottom: '2px solid #3b82f640', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span style={{ verticalAlign: 'middle' }}>⚡ Causal Flood Predictor</span>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
          🟢 NOAA GFS Forecast Live
        </div>
      </div>
      
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto', padding: '16px' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          Deterministic Wave Engine | Target: <span style={{ color: '#0f172a' }}>{targetName}</span>
        </div>

        {!selectedBasin || !prediction ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '0 20px' }}>
            Please select a River Basin from the Telemetry Panel (Quadrant 2) to view its localized GFS forecast and causal breakdown.
          </div>
        ) : (
          <>
            {/* Live GFS Data */}
            <div style={{ 
              padding: '12px', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ background: '#0284c7', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                GFS FORECAST (6-HR)
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>
                {gfsState?.data ? (
                  selectedBasin === 'Y.20' ? `${gfsState.data.north.toFixed(1)} mm (North)` :
                  (selectedBasin === 'Y.38' || selectedBasin === 'KM.1') ? `${gfsState.data.east.toFixed(1)} mm (East)` :
                  `${gfsState.data.central.toFixed(1)} mm (Central)`
                ) : 'Awaiting Data...'}
              </div>
            </div>

            {/* Main KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kpi-chip" style={{ background: `${probabilityColor}10`, borderColor: `${probabilityColor}40` }}>
                <span className="kpi-label" style={{ color: probabilityColor }}>Risk Level</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: probabilityColor, marginTop: '4px' }}>
                  {prediction.riskLevel}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginTop: '4px' }}>
                  Proj. Q: {prediction.projectedDischarge.toFixed(0)} cms
                </div>
              </div>

              <div className="kpi-chip">
                <span className="kpi-label">Arrival Window</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {prediction.leadTime}
                </div>
              </div>
            </div>

            {/* Causal Breakdown */}
            <div style={{ 
              marginTop: 'auto',
              padding: '16px', 
              background: '#ffffff', 
              borderLeft: `4px solid ${probabilityColor}`, 
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                Causal Breakdown
              </div>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                {prediction.causalBreakdown}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
