'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MAP_CENTER, MAP_ZOOM, STATION_DEFINITIONS, getStatusColor } from '@/lib/constants';
import { setSelectedDistrict } from '@/lib/store';
import { RootState } from '@/lib/store';
import phraeData from '@/lib/phrae-districts.json';
import phraeMask from '@/lib/phrae-mask.json';

let L: typeof import('leaflet') | null = null;

// Historical Data Mapping for Phrae Districts
const DISTRICT_HISTORICAL_DATA: Record<string, {
  color: string;
  status: string;
  avgRainfall: number;
  avgWaterLevel: number;
}> = {
  'MuangPhrae': { color: '#ef4444', status: 'High Vulnerability', avgRainfall: 1450, avgWaterLevel: 11.2 },
  'Song': { color: '#ef4444', status: 'High Vulnerability', avgRainfall: 1320, avgWaterLevel: 9.8 },
  'DenChai': { color: '#f97316', status: 'Moderate Vulnerability', avgRainfall: 1150, avgWaterLevel: 7.5 },
  'Long': { color: '#f97316', status: 'Moderate Vulnerability', avgRainfall: 1080, avgWaterLevel: 6.2 },
  'RongKwang': { color: '#f97316', status: 'Moderate Vulnerability', avgRainfall: 1120, avgWaterLevel: 6.8 },
  'SungMen': { color: '#f97316', status: 'Moderate Vulnerability', avgRainfall: 1200, avgWaterLevel: 8.1 },
  'WangChin': { color: '#22c55e', status: 'Safe Zone', avgRainfall: 850, avgWaterLevel: 4.3 },
  'WangChin': { color: '#22c55e', status: 'Safe Zone', avgRainfall: 850, avgWaterLevel: 4.3 },
  'NongMuangKai': { color: '#22c55e', status: 'Safe Zone', avgRainfall: 890, avgWaterLevel: 4.8 },
};

const DISTRICT_BASINS: Record<string, string[]> = {
  'MuangPhrae': ['Y.1C', 'KM.1', 'Y.34', 'KS.1'],
  'Song': ['Y.20'],
  'NongMuangKai': ['KY.1'],
  'RongKwang': ['Y.38', 'KM.1'],
};

export default function MapPanel() {
  const dispatch = useDispatch();
  const stationsData = useSelector((s: RootState) => s.dashboard.stations);
  const selectedDistrict = useSelector((s: RootState) => s.dashboard.selectedDistrict);
  
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initRef.current) return;
    initRef.current = true;

    import('leaflet').then((leaflet) => {
      L = leaflet;

      const container = document.getElementById('map-container');
      if (!container) return;

      const mapInstance = L.map(container, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        minZoom: 9,
        zoomControl: true,
        attributionControl: true,
      });

      // Base map tiles: Original OSM colors
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '© OpenStreetMap',
      }).addTo(mapInstance);

      // Draw the inverted mask to hide the rest of the world
      L.geoJSON(phraeMask as any, {
        style: {
          color: 'transparent',
          fillColor: '#f8fafc',
          fillOpacity: 1,
          weight: 0,
        },
        interactive: false,
      }).addTo(mapInstance);

      // Draw Choropleth (Regional Heatmap) for Districts
      const geoJsonLayer = L.geoJSON(phraeData as any, {
        style: (feature) => {
          const districtName = feature?.properties?.NAME_2;
          const data = DISTRICT_HISTORICAL_DATA[districtName] || { color: '#94a3b8' };
          return {
            color: '#ffffff', // white borders
            weight: 2,
            fillColor: data.color,
            fillOpacity: 0.6,
          };
        },
        onEachFeature: (feature, layer) => {
          const districtName = feature.properties.NAME_2;
          const data = DISTRICT_HISTORICAL_DATA[districtName];
          
          if (!data) return;

          // Create rich HTML Tooltip
          const tooltipContent = `
            <div style="font-family: Inter, sans-serif; min-width: 150px;">
              <div style="font-weight: 700; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                ${districtName} District
              </div>
              <div style="font-size: 0.75rem; display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Risk Level:</span>
                  <strong style="color: ${data.color}">${data.status}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Hist. Rainfall:</span>
                  <strong>${data.avgRainfall} mm</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Avg Peak Water:</span>
                  <strong>${data.avgWaterLevel} m</strong>
                </div>
              </div>
              ${DISTRICT_BASINS[districtName] ? `
              <div style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
                <div style="font-size: 0.7rem; color: #475569; font-weight: 600; margin-bottom: 4px;">RIVER BASINS IN DISTRICT:</div>
                <div style="font-size: 0.7rem; color: #0f172a; display: flex; flex-direction: column; gap: 2px;">
                  ${DISTRICT_BASINS[districtName].map(id => {
                    const st = STATION_DEFINITIONS[id as keyof typeof STATION_DEFINITIONS];
                    return `<div>• ${id} (${st?.name || ''})</div>`;
                  }).join('')}
                </div>
              </div>
              ` : ''}
            </div>
          `;

          layer.bindTooltip(tooltipContent, {
            sticky: true,
            className: 'custom-district-tooltip',
            opacity: 0.95
          });

          // Interactivity: Hover effects
          layer.on({
            mouseover: (e) => {
              const target = e.target;
              target.setStyle({
                weight: 3,
                color: '#1e293b',
                fillOpacity: 0.85,
              });
              target.bringToFront();
            },
            mouseout: (e) => {
              geoJsonLayer.resetStyle(e.target);
            },
            click: (e) => {
              // Dispatch selected district to Redux store
              dispatch(setSelectedDistrict(districtName));
            }
          });
        }
      }).addTo(mapInstance);

      // Add Station Markers
      Object.entries(STATION_DEFINITIONS).forEach(([id, st]) => {
        // Find current status from real-time data if available
        const status = stationsData[id]?.status || 'safe';
        const color = getStatusColor(status);
        
        const marker = L!.circleMarker([st.lat, st.lng], {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(mapInstance);
        
        marker.bindTooltip(`<b>${id}</b><br/>${st.name}`, { className: 'station-tooltip' });
      });

      // Lock map strictly to Phrae province bounds
      const bounds = geoJsonLayer.getBounds();
      mapInstance.setMaxBounds(bounds.pad(0.2));

      mapRef.current = mapInstance;
      setMapReady(true);

      setTimeout(() => {
        mapInstance.invalidateSize();
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      }, 300);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🔥 Regional Vulnerability Map</span>
        {selectedDistrict && (
          <button 
            style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
            onClick={() => dispatch(setSelectedDistrict(null))}
          >
            Clear Selection ({selectedDistrict})
          </button>
        )}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map-container" className="map-container" />
        
        {/* Custom Map Legend */}
        <div className="map-legend" style={{ zIndex: 1000 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '6px', color: '#475569', textTransform: 'uppercase' }}>
            Historical Flood Risk
          </div>
          <div className="map-legend-item">
            <div style={{ width: 14, height: 14, borderRadius: 3, background: '#ef4444', opacity: 0.8 }} />
            <span>High Vulnerability</span>
          </div>
          <div className="map-legend-item">
            <div style={{ width: 14, height: 14, borderRadius: 3, background: '#f97316', opacity: 0.8 }} />
            <span>Moderate</span>
          </div>
          <div className="map-legend-item">
            <div style={{ width: 14, height: 14, borderRadius: 3, background: '#22c55e', opacity: 0.8 }} />
            <span>Safe Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}