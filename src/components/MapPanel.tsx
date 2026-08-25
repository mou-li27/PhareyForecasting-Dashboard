'use client';

import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { STATION_DEFINITIONS, getStatusColor } from '@/lib/constants';
import { setSelectedDistrict, setSelectedBasin } from '@/lib/store';
import { RootState } from '@/lib/store';
import phraeData from '@/lib/phrae-districts.json';
import { calculateCausalPrediction } from '@/utils/causalEngine';

// ── Phrae province lat/lng bounding box (from GeoJSON) ──────────────────────
const BOUNDS = { minLng: 99.38, maxLng: 100.56, minLat: 17.68, maxLat: 18.89 };

// SVG canvas size – aspect ratio matches the bounding box
const SVG_W = 800;
const SVG_H = 950;

// Project [lng, lat] → [svgX, svgY]
function project(lng: number, lat: number): [number, number] {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * SVG_W;
  // Lat is inverted in SVG (Y grows downward)
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * SVG_H;
  return [x, y];
}

// Convert a GeoJSON polygon ring to an SVG path 'd' string
function ringToPath(ring: number[][]): string {
  return ring
    .map(([lng, lat], i) => {
      const [x, y] = project(lng, lat);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ') + ' Z';
}

// Build path for a feature (handles Polygon + MultiPolygon)
function featureToPath(geometry: any): string {
  if (geometry.type === 'Polygon') {
    return ringToPath(geometry.coordinates[0]);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly: number[][][]) => ringToPath(poly[0])).join(' ');
  }
  return '';
}

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
        if (st?.status === 'emergency' || st?.status === 'warning') isRed = true;
        if (st?.status === 'watch') isAmber = true;
        const pred = calculateCausalPrediction(stationsData, gfs, bid);
        if (pred) {
          if (['Severe Risk', 'Extreme Risk', 'High Risk'].includes(pred.riskLevel)) isRed = true;
          if (pred.riskLevel === 'Moderate Risk') isAmber = true;
          maxFlow = Math.max(maxFlow, pred.projectedDischarge);
        }
      });
      const color = isRed ? '#ef4444' : isAmber ? '#f97316' : '#22c55e';
      const riskLevel = isRed ? 'High Risk' : isAmber ? 'Moderate Risk' : 'Safe Zone';
      result[name] = { color, riskLevel, gfsRain, maxFlow };
    });
    return result;
  }, [stationsData, gfsState]);

  // ── Pre-compute SVG paths ────────────────────────────────────────────────────
  const districtPaths = useMemo(() => {
    return (phraeData as any).features.map((f: any) => ({
      name: f.properties.NAME_2,
      path: featureToPath(f.geometry),
    }));
  }, []);

  // ── Station SVG coords ───────────────────────────────────────────────────────
  const stationMarkers = useMemo(() => {
    return Object.entries(STATION_DEFINITIONS).map(([id, st]) => {
      const [x, y] = project(st.lng, st.lat);
      const status = stationsData[id]?.status || 'safe';
      const color = getStatusColor(status);
      return { id, x, y, color, name: st.name, status };
    });
  }, [stationsData]);

  const handleDistrictClick = (name: string) => {
    dispatch(setSelectedDistrict(name === selectedDistrict ? null : name));
  };

  const handleDistrictMouseMove = (e: React.MouseEvent<SVGPathElement>, name: string) => {
    const risk = districtRisk[name];
    setTooltip({
      x: e.nativeEvent.offsetX + 12,
      y: e.nativeEvent.offsetY + 12,
      content: `${name}\n${risk?.riskLevel ?? '—'}\nRain: ${risk?.gfsRain?.toFixed(1) ?? 0} mm`,
    });
  };

  const handleStationMouseMove = (e: React.MouseEvent<SVGCircleElement>, id: string) => {
    const st = STATION_DEFINITIONS[id as keyof typeof STATION_DEFINITIONS];
    const flow = stationsData[id]?.discharge?.toFixed(0) ?? '—';
    setTooltip({
      x: e.nativeEvent.offsetX + 12,
      y: e.nativeEvent.offsetY + 12,
      content: `${id}\n${st?.name}\nFlow: ${flow} cms`,
    });
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
      <div
        style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', background: '#f1f5f9' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* District fills */}
          {districtPaths.map(({ name, path }: { name: string; path: string }) => {
            const risk = districtRisk[name] ?? { color: '#22c55e' };
            const isSelected = selectedDistrict === name;
            const isHovered = hoveredDistrict === name;
            return (
              <path
                key={name}
                d={path}
                fill={risk.color}
                fillOpacity={isSelected ? 0.85 : isHovered ? 0.75 : 0.6}
                stroke={isSelected ? '#1e293b' : '#ffffff'}
                strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
                onClick={() => handleDistrictClick(name)}
                onMouseEnter={() => setHoveredDistrict(name)}
                onMouseLeave={() => { setHoveredDistrict(null); setTooltip(null); }}
                onMouseMove={(e) => handleDistrictMouseMove(e, name)}
              />
            );
          })}

          {/* Station markers */}
          {stationMarkers.map(({ id, x, y, color, name, status }) => (
            <g key={id} style={{ cursor: 'pointer' }} onClick={() => dispatch(setSelectedBasin(id))}>
              <circle
                cx={x}
                cy={y}
                r={hoveredStation === id ? 9 : 7}
                fill={color}
                stroke="#ffffff"
                strokeWidth={2}
                fillOpacity={0.95}
                style={{ transition: 'r 0.15s' }}
                onMouseEnter={() => setHoveredStation(id)}
                onMouseLeave={() => { setHoveredStation(null); setTooltip(null); }}
                onMouseMove={(e) => handleStationMouseMove(e, id)}
              />
              <text
                x={x + 11}
                y={y + 4}
                fontSize={11}
                fontWeight={700}
                fill="#1e293b"
                stroke="#f1f5f9"
                strokeWidth={3}
                paintOrder="stroke"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {id}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              background: 'rgba(15,23,42,0.92)',
              color: '#f8fafc',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: 500,
              pointerEvents: 'none',
              whiteSpace: 'pre',
              lineHeight: 1.6,
              zIndex: 99,
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              maxWidth: 200,
            }}
          >
            {tooltip.content}
          </div>
        )}

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