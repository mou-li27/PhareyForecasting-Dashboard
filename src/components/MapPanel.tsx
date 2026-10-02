'use client';

import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { STATION_DEFINITIONS, getStatusColor } from '@/lib/constants';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

import { setSelectedDistrict, setSelectedBasin } from '@/lib/store';
import { RootState } from '@/lib/store';
import phraeData from '@/lib/phrae-districts.json';
import { calculateCausalPrediction } from '@/utils/causalEngine';

// ── Phrae province lat/lng bounding box (from GeoJSON) ──────────────────────
const BOUNDS = { minLng: 99.38, maxLng: 100.56, minLat: 17.68, maxLat: 18.89 };

// SVG canvas size – aspect ratio matches the bounding box
const SVG_W = 800;
const SVG_H = 950;

// Build path function removed as Leaflet natively handles GeoJSON projection

const DISTRICT_BASINS: Record<string, string[]> = {
  MuangPhrae: ['Y.34', 'KY.2', 'Y.1C'],
  Song: ['KY.1', 'Y.20'],
  NongMuangKai: ['Y.38'],
  WangChin: ['KY.3'],
};

export default function MapPanel() {
  const dispatch = useDispatch();
  const stationsData = useSelector((s: RootState) => s.dashboard.stations);
  const gfsState = useSelector((s: RootState) => s.gfsForecast);
  const selectedDistrict = useSelector((s: RootState) => s.dashboard.selectedDistrict);

  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  // ── Compute district risk colours ───────────────────────────────────────────
  const districtRisk = useMemo(() => {
    const result: Record<string, { color: string; riskLevel: string; gfsRain: number; maxFlow: number }> = {};
    const features = (phraeData as any).features as any[];
    features.forEach((f) => {
      const name: string = f.properties.NAME_2;
      const basins = DISTRICT_BASINS[name];
      if (!basins) {
        result[name] = { color: '#22c55e', riskLevel: 'Safe Zone', gfsRain: 0, maxFlow: 0 };
        return;
      }
      let gfsRain = 0;
      const gfs = gfsState.data;
      if (gfs) {
        if (name === 'Song') gfsRain = gfs.north;
        else if (name === 'NongMuangKai') gfsRain = gfs.east;
        else gfsRain = gfs.central;
      }
      let isRed = gfsRain >= 100;
      let isAmber = !isRed && gfsRain >= 50;
      let maxFlow = 0;
      basins.forEach((bid) => {
        const st = stationsData[bid];
        if (st?.status === 'emergency' || st?.status === 'severe-warning') isRed = true;
        else if (st?.status === 'warning' || st?.status === 'watch') isAmber = true;

        const pred = calculateCausalPrediction(stationsData, gfs, bid);
        if (pred) {
          if (['Severe Risk', 'Extreme Risk'].includes(pred.riskLevel)) isRed = true;
          else if (pred.riskLevel === 'Moderate Risk') isAmber = true;
          maxFlow = Math.max(maxFlow, pred.projectedDischarge);
        }
      });
      const color = isRed ? '#ef4444' : isAmber ? '#f97316' : '#22c55e';
      const riskLevel = isRed ? 'High Risk' : isAmber ? 'Moderate Risk' : 'Safe Zone';
      result[name] = { color, riskLevel, gfsRain, maxFlow };
    });
    return result;
  }, [stationsData, gfsState.data]); // depend on .data only, not loading/error booleans

  // SVG Paths pre-computation removed - handled by Leaflet natively

  // ── Station Marker Data ───────────────────────────────────────────────────────
  const stationMarkers = useMemo(() => {
    return Object.entries(STATION_DEFINITIONS).map(([id, st]) => {
      const status = stationsData[id]?.status || 'safe';
      const color = getStatusColor(status);
      return { id, lat: st.lat, lng: st.lng, color, name: st.name, status };
    });
  }, [stationsData]);

  const handleDistrictClick = (name: string) => {
    dispatch(setSelectedDistrict(name === selectedDistrict ? null : name));
  };

  const handleStationClick = (id: string) => {
    dispatch(setSelectedBasin(id));
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}
      >
        <span>🔥 Regional Vulnerability Map</span>
        {selectedDistrict && (
          <button
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
            }}
            onClick={() => dispatch(setSelectedDistrict(null))}
          >
            Clear Selection ({selectedDistrict})
          </button>
        )}
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', background: '#f8fafc' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 1.0 }}>
          <LeafletMap 
            bounds={[[BOUNDS.minLat, BOUNDS.minLng], [BOUNDS.maxLat, BOUNDS.maxLng]]}
            districtRisk={districtRisk}
            stationMarkers={stationMarkers}
            selectedDistrict={selectedDistrict}
            onDistrictClick={handleDistrictClick}
            onStationClick={handleStationClick}
          />
        </div>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.7rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 5, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Synthesized Risk
          </div>
          {[
            { color: '#ef4444', label: 'High Risk' },
            { color: '#f97316', label: 'Moderate Risk' },
            { color: '#22c55e', label: 'Safe Zone' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 0', color: '#475569', fontWeight: 500 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color, opacity: 0.85, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}