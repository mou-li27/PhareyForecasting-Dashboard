'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { getStatusLabel, getStatusColor, getStatusAction } from '@/lib/constants';

export default function Header() {
  const globalStatus = useSelector((s: RootState) => s.dashboard.globalStatus);
  const isConnected = useSelector((s: RootState) => s.dashboard.isConnected);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Bangkok',
        }) + ' ICT'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = getStatusColor(globalStatus);
  const statusLabel = getStatusLabel(globalStatus);
  const statusAction = getStatusAction(globalStatus);

  const showWarningBanner = globalStatus === 'warning' || globalStatus === 'emergency';

  return (
    <header className="header-bar" id="dashboard-header">
      {/* Left: Logo + Title */}
      <div className="header-title">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 800,
            flexShrink: 0,
            border: '2px solid rgba(59, 130, 246, 0.5)',
          }}
        >
          🌊
        </div>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em' }}>
            Phrae Municipality Real-Time Flood Early Warning Dashboard
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400, marginTop: 1 }}>
            PHARE WATER RESOURCES MANAGEMENT CENTER
          </div>
        </div>
      </div>

      {/* Center: Warning Banner (conditional) */}
      {showWarningBanner && (
        <div className="header-warning-banner" id="warning-banner">
          ⚠ {globalStatus.toUpperCase()}: {statusAction.toUpperCase()}
        </div>
      )}

      {/* Right: Time + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Connection indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.7rem',
            color: isConnected ? '#22c55e' : '#ef4444',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#ef4444',
            }}
          />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.04em',
            }}
          >
            {currentTime}
          </span>
        </div>

        {/* Global Status Badge */}
        <div
          className={`badge badge-${globalStatus}`}
          id="global-status-badge"
          style={{ borderColor: `${statusColor}50` }}
        >
          <div className={`status-dot ${globalStatus}`} />
          {statusLabel}
        </div>
      </div>
    </header>
  );
}
