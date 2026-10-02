'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateStations, updateForecasts, setConnectionStatus } from '@/lib/store';
import { fetchAllStationData } from '@/lib/api';
import { CRITICAL_POLL_INTERVAL } from '@/lib/constants';
import Header from './Header';
import MapPanel from './MapPanel';
import StationFocus from './StationFocus';
import HistoricalData from './HistoricalData';
import CausalPredictorPanel from './CausalPredictorPanel';
import GfsForecastPanel from './GfsForecastPanel';
import { fetchGFSDataAsync } from '@/lib/gfsForecastSlice';
import { AppDispatch } from '@/lib/store';

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  // ===== DATA POLLING =====
  useEffect(() => {
    async function fetchTelemetry() {
      try {
        // 1. Fetch GFS FIRST — station mock data derives from this
        await dispatch(fetchGFSDataAsync()).unwrap();
        // 2. Now generate station telemetry (uses the freshly-fetched GFS values)
        const { stations, forecasts } = await fetchAllStationData();
        dispatch(updateStations(stations));
        dispatch(updateForecasts(forecasts));
        dispatch(setConnectionStatus(true));
      } catch (error) {
        console.error('[Dashboard] Data poll failed:', error);
        dispatch(setConnectionStatus(false));
      }
    }

    fetchTelemetry(); // initial call
    const interval = setInterval(fetchTelemetry, 60000); // exactly 60 seconds
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      <main style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}>
        {/* TOP SECTION: Map (fixed height) + Historical side-by-side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: '20px',
          height: '48vh',
          minHeight: '360px',
          flexShrink: 0,
        }}>
          <MapPanel />
          <HistoricalData />
        </div>

        {/* BOTTOM SECTION: 3-Column Data & Forecasting Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          minHeight: '360px',
          flexShrink: 0,
        }}>
          <StationFocus />
          <GfsForecastPanel />
          <CausalPredictorPanel />
        </div>
      </main>
    </div>

  );
}
