import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  CvssSeverity,
  IctProviderDTO,
  VulnerabilitySummaryDTO,
} from '../types/api';

type AnalyticsMode = 'severity' | 'providers' | 'trend';

interface DashboardAnalyticsCardProps {
  total: number;
  openAndPending: number;
  bySeverity: Record<CvssSeverity, number>;
  providers: IctProviderDTO[];
  allVulns: VulnerabilitySummaryDTO[];
  onSelectSeverity: (severity: CvssSeverity) => void;
}

const SEGMENTS: Array<{ key: CvssSeverity; label: string; color: string }> = [
  { key: 'CRITICAL', label: 'Críticas', color: '#FB7185' },
  { key: 'HIGH', label: 'Altas', color: '#FB923C' },
  { key: 'MEDIUM', label: 'Medias', color: '#00D3FB' },
  { key: 'LOW', label: 'Bajas', color: '#83FD80' },
  { key: 'NONE', label: 'Informativas', color: '#64748B' },
];

export const DashboardAnalyticsCard: React.FC<DashboardAnalyticsCardProps> = ({
  total,
  openAndPending,
  bySeverity,
  providers,
  allVulns,
  onSelectSeverity,
}) => {
  const [mode, setMode] = useState<AnalyticsMode>('severity');
  const [hoveredSev, setHoveredSev] = useState<CvssSeverity | null>(null);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // 1. Donut slices
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;
  const activeSlices = SEGMENTS.map((seg) => {
    const count = bySeverity[seg.key] ?? 0;
    const fraction = total > 0 ? count / total : 0;
    const length = fraction * circumference;
    const slice = {
      ...seg,
      count,
      pct: Math.round(fraction * 100),
      length,
      offset: cumulativeOffset,
    };
    cumulativeOffset += length;
    return slice;
  });
  const hoveredSlice = hoveredSev
    ? activeSlices.find((s) => s.key === hoveredSev)
    : null;

  // 2. Provider exposure sorted by risk descending
  const sortedProviders = useMemo(() => {
    return [...providers].sort((a, b) => {
      if (b.activeCriticalHighVulnsCount !== a.activeCriticalHighVulnsCount) {
        return b.activeCriticalHighVulnsCount - a.activeCriticalHighVulnsCount;
      }
      return b.managedAssetsCount - a.managedAssetsCount;
    });
  }, [providers]);

  const maxProviderBreaches = Math.max(
    1,
    ...sortedProviders.map((p) => p.activeCriticalHighVulnsCount)
  );

  // 3. Real cumulative timeline from discoveredAt + status
  const trendPoints = useMemo(() => {
    const uniqueDates = Array.from(
      new Set(allVulns.map((v) => v.discoveredAt).filter(Boolean))
    ).sort();

    if (uniqueDates.length === 0) {
      return [{ date: 'Hoy', label: 'Hoy', total: 0, active: 0, mitigated: 0 }];
    }

    let cumTotal = 0;
    let cumMitigated = 0;
    return uniqueDates.map((d) => {
      const onDate = allVulns.filter((v) => v.discoveredAt === d);
      cumTotal += onDate.length;
      cumMitigated += onDate.filter(
        (v) => v.status === 'RESUELTA' || v.status === 'CERRADA'
      ).length;
      const parts = d.split('-');
      const shortLabel = `${parts[2] ?? ''}/${parts[1] ?? ''}`;
      return {
        date: d,
        label: shortLabel,
        total: cumTotal,
        active: Math.max(0, cumTotal - cumMitigated),
        mitigated: cumMitigated,
      };
    });
  }, [allVulns]);

  const chartW = 380;
  const chartH = 152;
  const padX = 18;
  const padTop = 16;
  const padBottom = 24;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padTop - padBottom;
  const maxTrendY = Math.max(2, ...trendPoints.map((p) => p.total));

  const coords = trendPoints.map((pt, idx) => {
    const x =
      trendPoints.length > 1
        ? padX + (idx / (trendPoints.length - 1)) * plotW
        : padX + plotW / 2;
    const yTotal = padTop + plotH - (pt.total / maxTrendY) * plotH;
    const yMitigated = padTop + plotH - (pt.mitigated / maxTrendY) * plotH;
    return { ...pt, x, yTotal, yMitigated };
  });

  const buildPolyline = (key: 'yTotal' | 'yMitigated') =>
    coords.map((c) => `${c.x.toFixed(1)},${c[key].toFixed(1)}`).join(' ');

  const buildAreaPath = (key: 'yTotal' | 'yMitigated') => {
    if (coords.length === 0) return '';
    const baseY = padTop + plotH;
    const first = coords[0];
    const last = coords[coords.length - 1];
    const segments = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c[key].toFixed(1)}`)
      .join(' ');
    return `${segments} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;
  };

  const activePoint =
    hoveredPointIdx !== null
      ? coords[hoveredPointIdx]
      : coords[coords.length - 1] ?? null;

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="panel-header-bar" style={{ marginBottom: '14px' }}>
        <div>
          <h2 className="panel-title">
            {mode === 'severity'
              ? 'Severidad CVSS'
              : mode === 'providers'
                ? 'Exposición por proveedor TIC'
                : 'Evolución de remediación'}
          </h2>
          <p style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
            {mode === 'severity'
              ? `${openAndPending} activas · clic para filtrar`
              : mode === 'providers'
                ? 'Brechas HIGH/CRITICAL frente a SLA DORA'
                : 'Acumulado detectado vs. mitigado'}
          </p>
        </div>

        {/* Segmented Precision Mode Switcher */}
        <div className="segmented-pill" role="tablist" aria-label="Tipo de visualización analítica">
          {(
            [
              { id: 'severity', label: 'CVSS' },
              { id: 'providers', label: 'Proveedores' },
              { id: 'trend', label: 'Tendencia' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              className={`segmented-btn ${mode === tab.id ? 'segmented-btn-active' : ''}`}
              onClick={() => setMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: CVSS Donut */}
      {mode === 'severity' && (
        <div className="donut-layout">
          <div className="donut-ring-box">
            <svg
              viewBox="0 0 176 176"
              width="170"
              height="170"
              role="img"
              aria-label={`Distribución CVSS con ${total} vulnerabilidades registradas`}
            >
              <circle
                cx="88"
                cy="88"
                r={radius}
                fill="none"
                stroke="var(--bg-elevated)"
                strokeWidth="16"
              />
              {activeSlices.map((slice) => {
                if (slice.count === 0) return null;
                const isFocused = hoveredSev === slice.key;
                return (
                  <circle
                    key={slice.key}
                    cx="88"
                    cy="88"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isFocused ? 20 : 16}
                    strokeDasharray={`${Math.max(0, slice.length - 3)} ${circumference}`}
                    strokeDashoffset={-slice.offset}
                    transform="rotate(-90 88 88)"
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 180ms ease, opacity 180ms ease',
                      opacity: hoveredSev && !isFocused ? 0.42 : 1,
                    }}
                    onMouseEnter={() => setHoveredSev(slice.key)}
                    onMouseLeave={() => setHoveredSev(null)}
                    onClick={() => onSelectSeverity(slice.key)}
                  />
                );
              })}
            </svg>

            <div className="donut-center-label">
              <strong className="mono">
                {hoveredSlice ? hoveredSlice.count : total}
              </strong>
              <span>
                {hoveredSlice
                  ? `${hoveredSlice.label} · ${hoveredSlice.pct}%`
                  : 'Total'}
              </span>
            </div>
          </div>

          <div>
            <div className="pill-legend-grid">
              {activeSlices
                .filter((s) => s.key !== 'NONE' || s.count > 0)
                .map((slice) => (
                  <button
                    key={slice.key}
                    type="button"
                    className="pill-legend-btn"
                    onMouseEnter={() => setHoveredSev(slice.key)}
                    onMouseLeave={() => setHoveredSev(null)}
                    onClick={() => onSelectSeverity(slice.key)}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        backgroundColor: slice.color,
                        display: 'inline-block',
                      }}
                    />
                    <span>{slice.label}</span>
                    <strong className="mono">{slice.count}</strong>
                  </button>
                ))}
            </div>

            <div
              style={{
                marginTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.76rem',
                color: 'var(--ink-muted)',
              }}
            >
              <span>Concentración crítica + alta</span>
              <strong className="mono" style={{ color: 'var(--ink-primary)' }}>
                {total > 0
                  ? `${Math.round((((bySeverity.CRITICAL ?? 0) + (bySeverity.HIGH ?? 0)) / total) * 100)}%`
                  : '0%'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Provider Exposure Bars */}
      {mode === 'providers' && (
        <div className="provider-bars-list">
          {sortedProviders.map((prov) => {
            const isRisk = prov.doraRiskStatus === 'AT_RISK';
            const fillPct = isRisk
              ? Math.max(18, Math.round((prov.activeCriticalHighVulnsCount / maxProviderBreaches) * 100))
              : 100;
            return (
              <Link
                key={prov.id}
                to="/providers"
                className="provider-bar-row"
              >
                <div className="provider-bar-head">
                  <span className="provider-bar-name">
                    <span className="mono" style={{ color: 'var(--ink-muted)', fontSize: '0.72rem' }}>
                      {prov.providerCode}
                    </span>{' '}
                    {prov.name}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: isRisk ? 'var(--sev-critical-border)' : 'var(--brand-jade)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isRisk
                      ? `${prov.activeCriticalHighVulnsCount} brecha(s)`
                      : `COMPLIANT · ${prov.slaAvailabilityPct}%`}
                  </span>
                </div>
                <div className="provider-bar-track" aria-hidden="true">
                  <div
                    className="provider-bar-fill"
                    style={{
                      width: `${fillPct}%`,
                      backgroundColor: isRisk
                        ? prov.activeCriticalHighVulnsCount >= 2
                          ? 'var(--sev-critical-border)'
                          : 'var(--sev-high-border)'
                        : 'var(--brand-jade)',
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Mode 3: Fintech Smooth Area Remediation Curve */}
      {mode === 'trend' && (
        <div className="trend-chart-wrap">
          {activePoint && (
            <div className="trend-readout-bar">
              <span className="mono" style={{ color: 'var(--ink-muted)', fontSize: '0.74rem' }}>
                Corte {activePoint.date}
              </span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem' }}>
                <span className="mono" style={{ color: 'var(--brand-ocean)', fontWeight: 700 }}>
                  ● Detectadas: {activePoint.total}
                </span>
                <span className="mono" style={{ color: 'var(--brand-jade)', fontWeight: 700 }}>
                  ● Mitigadas: {activePoint.mitigated}
                </span>
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            width="100%"
            height="156"
            role="img"
            aria-label="Curva acumulada de vulnerabilidades detectadas frente a mitigadas"
          >
            <defs>
              <linearGradient id="trendOceanFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D3FB" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#00D3FB" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="trendJadeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#83FD80" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#83FD80" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal hairline grid */}
            {[0, 0.5, 1].map((frac) => {
              const y = padTop + plotH * frac;
              return (
                <line
                  key={frac}
                  x1={padX}
                  y1={y}
                  x2={chartW - padX}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 4"
                />
              );
            })}

            {/* Area fills */}
            <path d={buildAreaPath('yTotal')} fill="url(#trendOceanFill)" />
            <path d={buildAreaPath('yMitigated')} fill="url(#trendJadeFill)" />

            {/* Lines */}
            <polyline
              fill="none"
              stroke="#00D3FB"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolyline('yTotal')}
            />
            <polyline
              fill="none"
              stroke="#83FD80"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolyline('yMitigated')}
            />

            {/* Interactive hover points & X axis labels */}
            {coords.map((pt, idx) => {
              const isFocused = hoveredPointIdx === idx;
              return (
                <g
                  key={pt.date}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPointIdx(idx)}
                  onMouseLeave={() => setHoveredPointIdx(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.yTotal}
                    r={isFocused ? 5 : 3.2}
                    fill="#00D3FB"
                    stroke="var(--bg-surface)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.yMitigated}
                    r={isFocused ? 5 : 3.2}
                    fill="#83FD80"
                    stroke="var(--bg-surface)"
                    strokeWidth="1.5"
                  />
                  {(idx === 0 ||
                    idx === coords.length - 1 ||
                    idx === Math.floor(coords.length / 2)) && (
                    <text
                      x={pt.x}
                      y={chartH - 6}
                      textAnchor="middle"
                      fill="var(--ink-muted)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
