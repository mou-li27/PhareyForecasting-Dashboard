'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const HeroMap = dynamic(() => import('@/components/HeroMap'), { ssr: false });

/* ------------------------------------------------------------------ */
/*  Phrae Flood Early Warning System — Landing Page                   */
/*  Full-bleed map hero with overlaid content                         */
/* ------------------------------------------------------------------ */

const LIGHT = {
  bg: '#ffffff',
  bgAlt: '#f8fafc',
  text: '#0f172a',
  textSec: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  accent: '#2563eb',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  iconBg1: '#dbeafe',
  iconBg2: '#cffafe',
  iconBg3: '#d1fae5',
  iconBg4: '#e0e7ff',
};


export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const t = LIGHT;
  const isDark = false; // Hardcode false to satisfy the HeroMap prop

  return (
    <div style={{
      minHeight: '100vh',
      background: t.bg,
      color: t.text,
      fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 0.3s, color 0.3s',
    }}>

      {/* ========== HERO: FULL-BLEED MAP BACKGROUND ========== */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Map fills entire hero */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <HeroMap isDark={isDark} />
        </div>

        {/* Gradient overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: isDark
            ? 'linear-gradient(135deg, rgba(11,17,32,0.92) 0%, rgba(11,17,32,0.7) 50%, rgba(11,17,32,0.4) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.3) 100%)',
        }} />

        {/* ── NAVBAR (inside hero) ── */}
        <nav style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 12c2-4 6-8 10-8s8 4 10 8" />
                <path d="M2 16c2-4 6-8 10-8s8 4 10 8" />
                <path d="M2 20c2-4 6-8 10-8s8 4 10 8" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>PHRAE</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: t.accent, textTransform: 'uppercase' as const }}>
                Flood Early Warning
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            <Link href="/dashboard" style={{
              padding: '9px 20px',
              background: t.accent,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 9,
              textDecoration: 'none',
              letterSpacing: '0.02em',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}>
              Open Dashboard →
            </Link>
          </div>
        </nav>

        {/* ── HERO CONTENT (overlaid on map) ── */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px',
          width: '100%',
        }}>
          <div style={{ maxWidth: 560 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 999,
              border: `1px solid ${isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.25)'}`,
              background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
              marginBottom: 28,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase' as const }}>
                System Operational
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}>
              Phrae Basin{' '}
              <span style={{
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Flood Monitoring
              </span>
              {' '}& Early Warning
            </h2>

            <p style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: t.textSec,
              maxWidth: 460,
              marginBottom: 36,
            }}>
              Real-time hydrological intelligence across the Yom River basin — integrating live sensor telemetry, NOAA GFS weather forecasts, and causal river routing models.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
              <Link href="/dashboard" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 28px',
                background: isDark ? '#ffffff' : '#0f172a',
                color: isDark ? '#0f172a' : '#ffffff',
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: isDark ? '0 4px 16px rgba(255,255,255,0.1)' : '0 4px 16px rgba(0,0,0,0.15)',
              }}>
                Explore Dashboard
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            {/* Inline stats */}
            <div style={{
              display: 'flex',
              gap: 24,
              marginTop: 48,
              flexWrap: 'wrap' as const,
            }}>
              {[
                { value: '7', label: 'Stations' },
                { value: '3', label: 'Catchments' },
                { value: '6h', label: 'Forecast' },
                { value: '60s', label: 'Refresh' },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center' as const,
          paddingBottom: 28,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ animation: 'bounce 2s infinite' }}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ========== CAPABILITIES ========== */}
      <section style={{
        background: t.bgAlt,
        borderTop: `1px solid ${t.border}`,
        padding: '80px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: 52 }}>
            <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
              Core Capabilities
            </h3>
            <p style={{ color: t.textSec, fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
              The integrated systems powering Phrae&apos;s municipal flood response.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {[
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M12 2v6l3 3"/><circle cx="12" cy="14" r="8"/></svg>,
                iconBg: t.iconBg1,
                title: 'NOAA GFS Forecast',
                desc: 'Live 6-hour rainfall accumulation from US weather satellites across three Phrae catchment zones.',
                num: '01',
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2"><path d="M2 12c2-4 6-8 10-8s8 4 10 8"/><path d="M2 20c2-4 6-8 10-8s8 4 10 8"/></svg>,
                iconBg: t.iconBg2,
                title: 'Causal River Routing',
                desc: 'Hydrodynamic engine computing upstream wave propagation and downstream surge along the Yom River.',
                num: '02',
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
                iconBg: t.iconBg3,
                title: 'RIKA IoT Telemetry',
                desc: 'Cloud integration with field sensors for real-time soil moisture and localized precipitation data.',
                num: '03',
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
                iconBg: t.iconBg4,
                title: 'Geospatial Mapping',
                desc: 'Interactive Leaflet map with district risk heatmap and color-coded station severity overlays.',
                num: '04',
              },
            ].map((cap, i) => (
              <div key={i} style={{
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 16,
                padding: 28,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: cap.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}>
                  {cap.icon}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700 }}>{cap.title}</h4>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted }}>{cap.num}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: t.textSec }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{
        borderTop: `1px solid ${t.border}`,
        padding: '28px 32px',
        background: t.bg,
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap' as const,
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 12c2-4 6-8 10-8s8 4 10 8" />
                <path d="M2 16c2-4 6-8 10-8s8 4 10 8" />
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 12, color: t.textMuted }}>
              © 2026 Phrae Water Resources Management Center
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['7 Stations', 'NOAA GFS', 'RIKA IoT', 'Live'].map((tag) => (
              <span key={tag} style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 999,
                background: t.bgAlt,
                border: `1px solid ${t.border}`,
                color: t.textMuted,
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
