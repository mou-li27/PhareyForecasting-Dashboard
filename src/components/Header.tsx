'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { getStatusLabel, getStatusColor, getStatusAction } from '@/lib/constants';
import Link from 'next/link';

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

  const showWarningBanner = globalStatus === 'watch' || globalStatus === 'warning' || globalStatus === 'severe-warning' || globalStatus === 'emergency';

  // Banner text is specific to the actual global status — not generic
  const bannerText = globalStatus === 'watch'
    ? '⚠ WATCH: ELEVATED WATER LEVELS — INCREASE MONITORING'
    : `⚠ ${globalStatus.toUpperCase()}: ${statusAction.toUpperCase()}`;

  return (
    <header className="header-bar" id="dashboard-header">
      {/* Left: Logo + Title */}
      <div className="header-title">
        <Link href="/"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M2 12c2-4 6-8 10-8s8 4 10 8" />
            <path d="M2 16c2-4 6-8 10-8s8 4 10 8" />
            <path d="M2 20c2-4 6-8 10-8s8 4 10 8" />
          </svg>
        </Link>
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
          {bannerText}
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
