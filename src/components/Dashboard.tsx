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
import AnalyticalVisualization from './AnalyticalVisualization';

export default function Dashboard() {
  const dispatch = useDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstLoad = useRef(true);

  // ===== DATA POLLING =====
  const pollData = useCallback(async () => {
    try {
      const { stations, forecasts } = await fetchAllStationData();
      dispatch(updateStations(stations));
      dispatch(updateForecasts(forecasts));
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

      <main className="dashboard-grid">
        {/* QUADRANT 1: Spatial Vulnerability (Map) - Spans full width */}
        <div style={{ gridColumn: '1 / -1', minHeight: 0, height: '100%' }}>
          <MapPanel />
        </div>

        {/* QUADRANT 2: Current Operations (Telemetry Focus) */}
        <div style={{ minHeight: 0, height: '100%' }}>
          <StationFocus />
        </div>

        {/* QUADRANT 3: Historical Data Repository */}
        <div style={{ minHeight: 0, height: '100%' }}>
          <HistoricalData />
        </div>

        {/* QUADRANT 4: Analytical Visualization */}
        <div style={{ minHeight: 0, height: '100%' }}>
          <AnalyticalVisualization />
        </div>
      </main>
    </div>
  );
}
