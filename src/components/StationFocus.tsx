'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setSelectedBasin } from '@/lib/store';
import {
  getStatusColor,
  getStatusLabel,
  getStatusAction,
  formatDischarge,
  formatWaterLevel,
  formatPercent,
  Y1C_CHANNEL_CAPACITY,
  ALERT_THRESHOLDS,
  STATION_DEFINITIONS
} from '@/lib/constants';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { StationReading } from '@/lib/types';

const DISTRICT_BASINS: Record<string, string[]> = {
  'MuangPhrae': ['Y.34', 'KY.2', 'Y.1C'],
  'Song': ['KY.1', 'Y.20'],
  'NongMuangKai': ['Y.38'],
  'WangChin': ['KY.3'],
};

// Helper to generate dynamic insights based on station status, trend, and rainfall
function generateInsights(station: StationReading): string[] {
  const insights: string[] = [];
  const rain = station.rainfall ?? 0;
  const trend = station.trendDirection;
  const cap = station.capacityPercent;

  if (station.status === 'safe') {
    if (rain < 5 && trend !== 'rising') {
      insights.push(`Conditions are dry — GFS reports negligible rainfall. River is in natural recession; discharge expected to continue falling or stabilise over the next 6 hours.`);
      insights.push(`No flood risk indicators present. Routine monitoring is sufficient.`);
    } else if (rain < 20) {
      insights.push(`Light rainfall (≈${rain.toFixed(1)} mm/6hr) is contributing to stable baseflow at ${station.stationId}.`);
      insights.push(`Channel utilisation is low (${formatPercent(cap)}%). No immediate action required.`);
    } else {
      insights.push(`Moderate rainfall (≈${rain.toFixed(1)} mm/6hr) is sustaining current flow. Discharge is ${trend} but remains within safe operational limits.`);
      insights.push(`Monitor upstream tributaries. Alert thresholds not yet approached.`);
    }
  } else if (station.status === 'watch') {
    if (rain < 10) {
      insights.push(`Discharge is elevated (${formatPercent(cap)}% capacity) from a prior rain event — GFS now shows minimal rainfall, so a natural recession is expected over the next 6 hours.`);
      insights.push(`Continue monitoring; no immediate escalation expected unless upstream conditions change.`);
    } else {
      insights.push(`Water levels are elevated and GFS reports ≈${rain.toFixed(1)} mm/6hr ongoing rainfall upstream. Based on past events, this often precedes minor agricultural flooding in low-lying areas.`);
      insights.push(`Recommend pre-positioning emergency response teams. Discharge is currently ${trend}.`);
    }
  } else if (station.status === 'warning') {
    insights.push(`ALERT: Channel capacity at ${formatPercent(cap)}% with GFS rainfall of ≈${rain.toFixed(1)} mm/6hr. Historical events with this signature have resulted in moderate urban flooding within 6–12 hours.`);
    insights.push(`Action Required: Prepare local evacuation routes and deploy mobile pumps to identified chokepoints.`);
  } else {
    insights.push(`EMERGENCY: ${station.stationId} has exceeded safe capacity (${formatPercent(cap)}%). GFS confirms ≈${rain.toFixed(1)} mm/6hr ongoing precipitation.`);
    insights.push(`Immediate action required: initiate full evacuation of adjacent zones and activate emergency flood response protocols.`);
  }

  return insights;
}

export default function StationFocus() {
  const stations = useSelector((s: RootState) => s.dashboard.stations);
  const statusHistory = useSelector((s: RootState) => s.dashboard.statusHistory);
  const selectedDistrict = useSelector((s: RootState) => s.dashboard.selectedDistrict);
  const selectedBasin = useSelector((s: RootState) => s.dashboard.selectedBasin);
  const dispatch = useDispatch();

  const lastChange = statusHistory.length > 0 ? statusHistory[statusHistory.length - 1] : null;

  // Determine which stations to show in the list
  let basinsToDisplay: string[] = [];
  if (selectedDistrict && DISTRICT_BASINS[selectedDistrict]) {
    basinsToDisplay = DISTRICT_BASINS[selectedDistrict];
  } else {
    basinsToDisplay = Object.keys(STATION_DEFINITIONS);
  }

  const stationsToDisplay = basinsToDisplay.map(id => stations[id]).filter(Boolean);
  const activeStation = selectedBasin ? stations[selectedBasin] : null;

  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
        Select a river basin to view real-time metrics and historical insights.
      </div>
      {stationsToDisplay.map(station => {
        const color = getStatusColor(station.status);
        return (
          <div 
            key={station.stationId}
            onClick={() => dispatch(setSelectedBasin(station.stationId))}
            style={{
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#ffffff',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`status-dot ${station.status}`} />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{station.stationId} — {station.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>{station.type}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: color, fontWeight: 700, fontSize: '0.85rem' }}>{getStatusLabel(station.status)}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDischarge(station.discharge)} cms</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDetailView = (station: StationReading) => {
    const statusColor = getStatusColor(station.status);
    const trendColorClass = station.trendDirection === 'rising' ? 'trend-up' :
                            station.trendDirection === 'falling' ? 'trend-down' : 'trend-stable';
    const trendIcon = station.trendDirection === 'rising' ? '↑' :
                      station.trendDirection === 'falling' ? '↓' : '→';
    const insights = generateInsights(station);

    const chartData = station.history?.map((d) => ({
      time: new Date(d.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      discharge: d.value,
    })) || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Detail Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => dispatch(setSelectedBasin(null))}
            style={{ 
              background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '4px 8px',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#475569'
            }}
          >
            ← Back
          </button>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            {station.stationId} — {station.name}
          </div>
        </div>

        {/* Interpretative Module */}
        <div style={{ 
          background: `linear-gradient(145deg, #f8fafc, #f1f5f9)`, 
          borderLeft: `4px solid ${statusColor}`,
          padding: '12px 16px',
          borderRadius: '4px 8px 8px 4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Historical Insight & Analysis
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#1e293b', lineHeight: '1.5' }}>
            {insights.map((text, i) => <li key={i} style={{ marginBottom: '4px' }}>{text}</li>)}
          </ul>
        </div>

        {/* Live Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Discharge */}
          <div className="kpi-chip">
            <span className="kpi-label">River Discharge</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="kpi-value" style={{ color: statusColor, fontSize: '1.6rem' }}>
                {formatDischarge(station.discharge)}
              </span>
              <span className="kpi-unit">cms</span>
            </div>
            <span className={`${trendColorClass}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {trendIcon} Trend {station.trendDirection}
            </span>
          </div>

          {/* Water Level */}
          <div className="kpi-chip">
            <span className="kpi-label">Current Water Level</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="kpi-value" style={{ fontSize: '1.6rem' }}>
                {formatWaterLevel(station.waterLevel)}
              </span>
              <span className="kpi-unit">m MSL</span>
            </div>
            <span className={`${trendColorClass}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Δ {station.trend > 0 ? '+' : ''}{station.trend.toFixed(2)} m/3hr
            </span>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="kpi-label" style={{ margin: 0 }}>Channel Capacity</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: statusColor }}>{formatPercent(station.capacityPercent)}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: '#e2e8f0', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(station.capacityPercent, 100)}%`,
              background: `linear-gradient(90deg, #22c55e, ${statusColor})`,
              transition: 'width 0.5s ease'
            }} />
            {/* Markers */}
            <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: 2, background: '#eab308' }} />
            <div style={{ position: 'absolute', left: '100%', top: 0, bottom: 0, width: 2, background: '#ef4444' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginTop: 6 }}>
            <span>0</span>
            <span style={{ color: '#eab308' }}>Watch (80%)</span>
            <span style={{ color: '#ef4444' }}>Critical (100%)</span>
          </div>
        </div>

        {/* Chart */}
        {station.type !== 'sensor' && (
          <div style={{ height: 140, marginTop: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>24-Hour Discharge Trend</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${station.stationId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={statusColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={statusColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <YAxis domain={['auto', 'auto']} hide />
                <Area
                  type="monotone"
                  dataKey="discharge"
                  stroke={statusColor}
                  fill={`url(#gradient-${station.stationId})`}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card" id="station-focus" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="card-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <span style={{ verticalAlign: 'middle' }}>
          {selectedBasin 
            ? `Real-time Telemetry & Insights` 
            : (selectedDistrict ? `${selectedDistrict} District — River Basins` : 'All Basins Overview')}
        </span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', padding: '16px' }}>
        {stationsToDisplay.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', marginTop: 20 }}>
            No station data available.
          </div>
        ) : (
          selectedBasin && activeStation 
            ? renderDetailView(activeStation) 
            : renderListView()
        )}
      </div>
    </div>
  );
}
