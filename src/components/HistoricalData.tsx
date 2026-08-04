'use client';

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { STATION_DEFINITIONS } from '@/lib/constants';

const DISTRICT_BASINS: Record<string, string[]> = {
  'MuangPhrae': ['Y.1C', 'KM.1', 'Y.34', 'KS.1'],
  'Song': ['Y.20'],
  'NongMuangKai': ['KY.1'],
  'RongKwang': ['Y.38', 'KM.1'],
};

const ALL_HISTORICAL_EVENTS = [
  { date: 'Aug 2024', loc: 'Y.1C', sev: 'Critical', q: '1240', color: '#ef4444', severityValue: 100 },
  { date: 'Sep 2023', loc: 'KM.1', sev: 'Warning', q: '380', color: '#f97316', severityValue: 80 },
  { date: 'Sep 2022', loc: 'Y.20', sev: 'Warning', q: '1250', color: '#f97316', severityValue: 90 },
  { date: 'Aug 2021', loc: 'KS.1', sev: 'Watch', q: 'N/A', color: '#eab308', severityValue: 50 },
  { date: 'Aug 2020', loc: 'Y.1C', sev: 'Warning', q: '1010', color: '#f97316', severityValue: 85 },
  { date: 'Oct 2019', loc: 'Y.34', sev: 'Watch', q: '250', color: '#eab308', severityValue: 60 },
  { date: 'Sep 2018', loc: 'KY.1', sev: 'Warning', q: '1100', color: '#f97316', severityValue: 95 },
  { date: 'Oct 2017', loc: 'Y.38', sev: 'Watch', q: '320', color: '#eab308', severityValue: 75 },
  { date: 'Sep 2011', loc: 'Y.1C', sev: 'Critical', q: '1450', color: '#ef4444', severityValue: 100 },
];

export default function HistoricalData() {
  const selectedDistrict = useSelector((s: RootState) => s.dashboard.selectedDistrict);

  // Filter events based on selected district
  const filteredEvents = useMemo(() => {
    if (!selectedDistrict || !DISTRICT_BASINS[selectedDistrict]) {
      return ALL_HISTORICAL_EVENTS;
    }
    const targetBasins = DISTRICT_BASINS[selectedDistrict];
    return ALL_HISTORICAL_EVENTS.filter(e => targetBasins.includes(e.loc));
  }, [selectedDistrict]);

  // Chart heights (normalize to some bars for the placeholder)
  const chartBars = filteredEvents.slice(0, 10).map(e => ({
    height: e.severityValue,
    color: e.color
  }));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span style={{ verticalAlign: 'middle' }}>Historical Data Repository</span>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto', padding: '12px' }}>
        
        {/* Time-Series Graph Placeholder */}
        <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
            {selectedDistrict ? `${selectedDistrict} Flood Frequency` : 'All Basins Flood Frequency'}
          </div>
          <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            {chartBars.length > 0 ? chartBars.map((bar, i) => (
              <div 
                key={i} 
                style={{ 
                  flex: 1, 
                  height: `${bar.height}%`, 
                  background: bar.color, 
                  opacity: 0.8,
                  borderRadius: '2px 2px 0 0',
                  transition: 'height 0.5s ease'
                }} 
              />
            )) : (
              <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', paddingBottom: '20px' }}>
                No historical events recorded for this district.
              </div>
            )}
          </div>
        </div>

        {/* Tabular Logs */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
            Severe Event Logs {selectedDistrict ? `(${selectedDistrict})` : ''}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px' }}>Date</th>
                <th style={{ padding: '8px 4px' }}>Basin</th>
                <th style={{ padding: '8px 4px' }}>Severity</th>
                <th style={{ padding: '8px 4px' }}>Peak Q (cms)</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((row, i) => {
                const st = STATION_DEFINITIONS[row.loc as keyof typeof STATION_DEFINITIONS];
                const locName = st ? st.name : '';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>{row.date}</td>
                    <td style={{ padding: '8px 4px', fontWeight: 500 }} title={locName}>{row.loc}</td>
                    <td style={{ padding: '8px 4px', color: row.color, fontWeight: 700 }}>{row.sev}</td>
                    <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{row.q}</td>
                  </tr>
                );
              })}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}
