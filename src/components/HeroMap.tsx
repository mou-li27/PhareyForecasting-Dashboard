'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * Full-bleed hero map for the landing page.
 * Uses free tile providers — no API keys required.
 */

const STATIONS = [
  { id: 'KY.1', lat: 18.50833, lng: 100.16183 },
  { id: 'Y.20', lat: 18.58611, lng: 100.15150 },
  { id: 'Y.38', lat: 18.26633, lng: 100.23758 },
  { id: 'Y.34', lat: 18.21981, lng: 100.20619 },
  { id: 'KY.2', lat: 18.21758, lng: 100.17847 },
  { id: 'Y.1C', lat: 18.13406, lng: 100.12414 },
  { id: 'KY.3', lat: 17.90125, lng: 99.60542 },
];

const PHRAE_CENTER: [number, number] = [18.32, 100.17];

interface HeroMapProps {
  isDark: boolean;
}

export default function HeroMap({ isDark }: HeroMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: PHRAE_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    mapRef.current = map;

    // Station markers
    STATIONS.forEach((st) => {
      L.circleMarker([st.lat, st.lng], {
        radius: 5,
        fillColor: '#3b82f6',
        fillOpacity: 0.85,
        color: '#ffffff',
        weight: 1.5,
      }).addTo(map);
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
    };
  }, []);

  // Switch tiles when theme changes — all free, no API keys
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileRef.current) {
      mapRef.current.removeLayer(tileRef.current);
    }

    // Light: standard OpenStreetMap (always free)
    // Dark: Stadia Alidade Smooth Dark (free for localhost/non-commercial)
    //       with OSM fallback if it fails
    const url = isDark
      ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tile = L.tileLayer(url, { maxZoom: 19 }).addTo(mapRef.current);

    // If dark tiles fail, fallback to OSM
    let hasFailed = false;
    tile.on('tileerror', () => {
      if (!hasFailed && isDark && mapRef.current) {
        hasFailed = true;
        mapRef.current.removeLayer(tile);
        tileRef.current = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { maxZoom: 19 }
        ).addTo(mapRef.current);
      }
    });

    tileRef.current = tile;
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}
