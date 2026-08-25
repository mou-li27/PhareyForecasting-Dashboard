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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstLoad = useRef(true);

  // ===== DATA POLLING =====
  const pollData = useCallback(async () => {
    try {
      const { stations, forecasts } = await fetchAllStationData();
      dispatch(updateStations(stations));
      dispatch(updateForecasts(forecasts));
      dispatch(fetchGFSDataAsync());
      dispatch(setConnectionStatus(true));
    } catch (error) {
      console.error('[Dashboard] Data poll failed:', error);
      dispatch(setConnectionStatus(false));
    }
  }, [dispatch]);

  useEffect(() => {
    // Initial load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      pollData();
    }

    // Set up polling interval
    intervalRef.current = setInterval(pollData, CRITICAL_POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollData]);

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
