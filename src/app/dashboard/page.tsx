'use client';

import dynamic from 'next/dynamic';
import ReduxProvider from '@/components/ReduxProvider';

// Dynamic import Dashboard to avoid SSR issues with Leaflet and Recharts
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a',
        color: '#e2e8f0',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid #2a3a4e',
          borderTopColor: '#3b82f6',
          animation: 'spin 1s linear infinite',
        }}
      />
      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
        Initializing PHARE Flood Warning System...
      </div>
      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
        Loading sensor data and forecasts
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function Home() {
  return (
    <ReduxProvider>
      <Dashboard />
    </ReduxProvider>
  );
}
