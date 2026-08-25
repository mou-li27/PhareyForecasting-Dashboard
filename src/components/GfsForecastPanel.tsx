'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { STATION_DEFINITIONS } from '@/lib/constants';

export default function GfsForecastPanel() {
  const gfsState = useSelector((s: RootState) => s.gfsForecast);
  const selectedBasin = useSelector((s: RootState) => s.dashboard.selectedBasin);

  const targetName = selectedBasin ? `${selectedBasin} (${STATION_DEFINITIONS[selectedBasin as keyof typeof STATION_DEFINITIONS]?.name})` : 'None Selected';

  let gfsRain = 0;
  let regionName = '';
  
  if (gfsState?.data && selectedBasin) {
    if (selectedBasin === 'KY.1' || selectedBasin === 'Y.20') {
      gfsRain = gfsState.data.north;
      regionName = 'Northern Catchment';
    } else if (selectedBasin === 'Y.38') {
      gfsRain = gfsState.data.east;
      regionName = 'Eastern Catchment';
    } else {
      gfsRain = gfsState.data.central;
      regionName = 'Central & Southern Catchment';
    }
  }

  // Rainfall based risk warning thresholds (arbitrary based on 6hr accum)
  let rainRisk = 'Low';
  let rainColor = '#22c55e'; // Safe
  if (gfsRain >= 100) {
    rainRisk = 'High';
    rainColor = '#ef4444'; // Emergency
  } else if (gfsRain >= 50) {
    rainRisk = 'Moderate';
    rainColor = '#eab308'; // Watch
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ borderBottom: '2px solid #3b82f640', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M19 18a3.5 3.5 0 0 0 0-7h-1C17.5 7 14.5 5 12 5s-5.5 2-6 6H5a3.5 3.5 0 0 0 0 7" />
            <path d="M13 14v8" />
            <path d="M9 14v8" />
            <path d="M17 14v8" />
          </svg>
          <span style={{ verticalAlign: 'middle' }}>NOAA GFS Forecast</span>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
          LIVE
        </div>
      </div>
      
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto', padding: '16px' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          Meteorological Data | Target: <span style={{ color: '#0f172a' }}>{targetName}</span>
        </div>

        {!selectedBasin ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '0 20px' }}>
            Please select a River Basin from the Map or Telemetry Panel to view its localized GFS forecast.
          </div>
        ) : (
          <>
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              border: `1px solid ${rainColor}40`, 
              borderLeft: `4px solid ${rainColor}`,
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: '#0284c7', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block' }}>
                  6-HR ACCUMULATION
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: rainColor, textTransform: 'uppercase' }}>
                  {rainRisk} Rain Risk
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {gfsState?.data ? gfsRain.toFixed(1) : '--'}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>mm</span>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Projected rainfall across the <strong>{regionName}</strong> over the next 6 hours based on the latest NOAA GFS model run.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
