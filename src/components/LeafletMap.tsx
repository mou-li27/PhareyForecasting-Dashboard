'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import phraeData from '@/lib/phrae-districts.json';

interface LeafletMapProps {
  bounds: [[number, number], [number, number]];
  districtRisk: Record<string, { color: string; riskLevel: string; gfsRain: number }>;
  stationMarkers: Array<{ id: string; lat: number; lng: number; color: string; name: string; status: string }>;
  selectedDistrict: string | null;
  onDistrictClick: (name: string) => void;
  onStationClick: (id: string) => void;
}

function BoundsFitter({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [15, 15] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]); // intentionally omit bounds so it only runs on mount
  return null;
}

export default function LeafletMap({ 
  bounds, 
  districtRisk, 
  stationMarkers, 
  selectedDistrict, 
  onDistrictClick, 
  onStationClick 
}: LeafletMapProps) {
  
  // Style function for GeoJSON features
  const getStyle = (feature: any) => {
    const name = feature.properties.NAME_2;
    const risk = districtRisk[name];
    const isSelected = selectedDistrict === name;
    
    return {
      fillColor: risk ? risk.color : '#22c55e',
      fillOpacity: isSelected ? 0.75 : 0.45,
      weight: isSelected ? 3 : 1.5,
      color: isSelected ? '#1e293b' : '#ffffff',
    };
  };

  // Grid texture style for the overlay layer
  const getGridStyle = (feature: any) => {
    return {
      fillColor: 'url(#grid-pattern)',
      fillOpacity: 1,
      weight: 0,
      color: 'transparent',
      interactive: false,
    };
  };

  // Event handlers for GeoJSON features
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const name = feature.properties.NAME_2;
    const risk = districtRisk[name];
    
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.65, weight: 2.5 });
        l.bringToFront();
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getStyle(feature));
      },
      click: () => {
        onDistrictClick(name);
      }
    });

    if (risk) {
      layer.bindTooltip(
        `<b>${name}</b><br/>${risk.riskLevel}<br/>Rain: ${risk.gfsRain.toFixed(1)} mm`,
        { sticky: true, className: 'custom-tooltip' }
      );
    }
  };

  return (
    <>
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <pattern id="grid-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
          </pattern>
        </defs>
      </svg>
      <MapContainer
        bounds={bounds}
        zoomSnap={0.5}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
        keyboard={true}
        attributionControl={true}
        style={{ width: '100%', height: '100%', background: '#f8fafc' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Base Colored Polygons */}
        <GeoJSON 
          data={phraeData as any} 
          style={getStyle}
          onEachFeature={onEachFeature}
        />

        {/* Grid Texture Overlay */}
        <GeoJSON 
          data={phraeData as any} 
          style={getGridStyle}
          interactive={false}
        />

        {/* Station Markers */}
        {stationMarkers.map((st) => (
          <CircleMarker
            key={st.id}
            center={[st.lat, st.lng]}
            radius={7}
            pathOptions={{ fillColor: st.color, color: '#ffffff', weight: 2, fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onStationClick(st.id) }}
          >
            <Tooltip 
              permanent 
              direction="right" 
              offset={[8, 0]} 
              className="station-label-tooltip"
            >
              {st.id}
            </Tooltip>
          </CircleMarker>
        ))}

        <BoundsFitter bounds={bounds} />
      </MapContainer>
    </>
  );
}
