import React, { useMemo } from 'react';
import type {
  DashboardSummaryResponse,
  VulnerabilitySummaryDTO,
} from '../types/api';

interface DoraPostureHeroProps {
  summary: DashboardSummaryResponse;
  totalProvidersCount: number;
  allVulns: VulnerabilitySummaryDTO[];
  onInspectPriority: (vulnId: number) => void;
}

export function calculateDoraResilienceScore(
  totalVulns: number,
  openAndPending: number,
  criticalOpen: number,
  providersAtRisk: number
): number {
  if (totalVulns === 0) return 100;
  const resolvedClosed = Math.max(0, totalVulns - openAndPending);
  const nonCriticalActive = Math.max(0, openAndPending - criticalOpen);
  const mitigationBonus = Math.round((resolvedClosed / totalVulns) * 14);
  const raw =
    92 -
    criticalOpen * 9 -
    nonCriticalActive * 2.5 -
    providersAtRisk * 7 +
    mitigationBonus;
  return Math.max(8, Math.min(100, Math.round(raw)));
}

export const DoraPostureHero: React.FC<DoraPostureHeroProps> = ({
  summary,
  totalProvidersCount,
  allVulns,
  onInspectPriority,
}) => {
  const totalCount = summary.totalVulnerabilities;
  const openCount = summary.byStatus['ABIERTA'] ?? 0;
  const pendingCount = summary.byStatus['PENDIENTE DE REMEDIACIÓN'] ?? 0;
  const resolvedClosedCount =
    (summary.byStatus['RESUELTA'] ?? 0) + (summary.byStatus['CERRADA'] ?? 0);
  const compliantProvidersCount = Math.max(
    0,
    totalProvidersCount - summary.providersAtRiskCount
  );

  const score = useMemo(
    () =>
      calculateDoraResilienceScore(
        totalCount,
        summary.openAndPendingCount,
        summary.criticalOpenCount,
        summary.providersAtRiskCount
      ),
    [totalCount, summary.openAndPendingCount, summary.criticalOpenCount, summary.providersAtRiskCount]
  );

  // Pick the highest-impact active vulnerability for live What-If simulation
  const topActiveVuln = useMemo(() => {
    const active = allVulns.filter(
      (v) => v.status === 'ABIERTA' || v.status === 'PENDIENTE DE REMEDIACIÓN'
    );
    active.sort((a, b) => b.cvssScore - a.cvssScore);
    return active[0] ?? null;
  }, [allVulns]);

  const simulation = useMemo(() => {
    if (!topActiveVuln) return null;
    const matchedProvider = summary.providersAtRisk.find(
      (p) => p.name === topActiveVuln.primaryProviderName
    );
    const liftsProvider =
      matchedProvider !== undefined &&
      matchedProvider.activeCriticalHighVulnsCount <= 1 &&
      (topActiveVuln.severity === 'CRITICAL' || topActiveVuln.severity === 'HIGH');

    const nextOpen = Math.max(0, summary.openAndPendingCount - 1);
    const nextCrit = Math.max(
      0,
      summary.criticalOpenCount - (topActiveVuln.severity === 'CRITICAL' ? 1 : 0)
    );
    const nextProvidersAtRisk = Math.max(
      0,
      summary.providersAtRiskCount - (liftsProvider ? 1 : 0)
    );
    const projectedScore = calculateDoraResilienceScore(
      totalCount,
      nextOpen,
      nextCrit,
      nextProvidersAtRisk
    );
    return {
      vuln: topActiveVuln,
      projectedScore,
      delta: Math.max(1, projectedScore - score),
      liftsProvider,
      providerName: matchedProvider?.name ?? topActiveVuln.primaryProviderName,
    };
  }, [topActiveVuln, summary, totalCount, score]);

  const scoreTone =
    score >= 75
      ? { color: 'var(--brand-jade)', label: 'Resiliencia óptima' }
      : score >= 50
        ? { color: 'var(--brand-ocean)', label: 'Vigilancia activa' }
        : { color: 'var(--sev-critical-border)', label: 'Exposición crítica' };

  // Semi-circular arc geometry (180 degrees)
  const radius = 64;
  const semiCircumference = Math.PI * radius;
  const dashOffset = semiCircumference * (1 - score / 100);

  const mitigatedPct =
    totalCount > 0 ? Math.round((resolvedClosedCount / totalCount) * 100) : 0;
  const openRatio =
    totalCount > 0 ? Math.round((summary.openAndPendingCount / totalCount) * 100) : 0;
  const critRatio =
    summary.openAndPendingCount > 0
      ? Math.round((summary.criticalOpenCount / summary.openAndPendingCount) * 100)
      : 0;
  const doraComplianceRatio =
    totalProvidersCount > 0
      ? Math.round((compliantProvidersCount / totalProvidersCount) * 100)
      : 100;

  return (
    <div
      className="posture-hero"
      role="region"
      aria-label="Índice de resiliencia DORA y métricas clave"
    >
      {/* Left Focal Posture Gauge + Live What-If Impact */}
      <div className="posture-hero-left">
        <div className="posture-gauge-wrap">
          <svg
            viewBox="0 0 160 94"
            width="168"
            height="98"
            role="img"
            aria-label={`Índice de resiliencia DORA: ${score} sobre 100 (${scoreTone.label})`}
          >
            {/* Background track arc */}
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Calibrated subtle tick arc */}
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="12"
              strokeDasharray="2 10"
            />
            {/* Active value arc */}
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke={scoreTone.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={semiCircumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 550ms cubic-bezier(0.22, 1, 0.36, 1), stroke 300ms ease',
              }}
            />
          </svg>
          <div className="posture-gauge-readout">
            <strong className="mono">{score}</strong>
            <span>/ 100</span>
          </div>
        </div>

        <div className="posture-hero-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="telemetry-label">Índice de resiliencia DORA</span>
            <span
              className="posture-status-pill mono"
              style={{
                color: scoreTone.color,
                borderColor: scoreTone.color,
              }}
            >
              {scoreTone.label}
            </span>
          </div>

          {simulation ? (
            <>
              <p className="posture-impact-text">
                Mitigar <strong className="mono">{simulation.vuln.internalCode}</strong>{' '}
                (CVSS {simulation.vuln.cvssScore.toFixed(1)}) eleva el índice a{' '}
                <strong className="mono" style={{ color: 'var(--brand-jade)' }}>
                  {simulation.projectedScore} / 100 (+{simulation.delta})
                </strong>
                {simulation.liftsProvider && simulation.providerName
                  ? ` y devuelve a ${simulation.providerName} a estado COMPLIANT.`
                  : simulation.providerName
                    ? ` reduciendo la exposición de ${simulation.providerName}.`
                    : '.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-sapphire"
                  onClick={() => onInspectPriority(simulation.vuln.id)}
                >
                  Gestionar {simulation.vuln.internalCode} →
                </button>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                  Actualización en tiempo real al cambiar estado
                </span>
              </div>
            </>
          ) : (
            <p className="posture-impact-text">
              Sin vulnerabilidades activas pendientes. Cartera de activos y proveedores TIC en conformidad DORA Cap. V.
            </p>
          )}
        </div>
      </div>

      {/* Right Integrated 2x2 Machined Telemetry Matrix */}
      <div className="posture-hero-matrix">
        <article className="posture-metric">
          <div className="telemetry-top">
            <span className="telemetry-label">Total CVEs</span>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--brand-jade)' }}>
              {mitigatedPct}% ok
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="posture-metric-num">{totalCount}</span>
            <span className="telemetry-meta">{resolvedClosedCount} mitigadas</span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{
                width: `${Math.max(mitigatedPct > 0 ? 10 : 0, mitigatedPct)}%`,
                backgroundColor: 'var(--brand-jade)',
              }}
            />
          </div>
        </article>

        <article className="posture-metric">
          <div className="telemetry-top">
            <span className="telemetry-label">Cola activa</span>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--brand-ocean)' }}>
              {openRatio}%
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="posture-metric-num" style={{ color: 'var(--brand-ocean)' }}>
              {summary.openAndPendingCount}
            </span>
            <span className="telemetry-meta">
              {openCount} ab · {pendingCount} rem
            </span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{
                width: `${Math.min(100, openRatio)}%`,
                backgroundColor: 'var(--brand-ocean)',
              }}
            />
          </div>
        </article>

        <article className="posture-metric">
          <div className="telemetry-top">
            <span className="telemetry-label">Críticas ≥ 9.0</span>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--sev-critical-border)' }}>
              {critRatio}% cola
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="posture-metric-num" style={{ color: 'var(--sev-critical-border)' }}>
              {summary.criticalOpenCount}
            </span>
            <span className="telemetry-meta">de {summary.bySeverity['CRITICAL'] ?? 0}</span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(summary.criticalOpenCount > 0 ? 12 : 0, critRatio))}%`,
                backgroundColor: 'var(--sev-critical-border)',
              }}
            />
          </div>
        </article>

        <article className="posture-metric">
          <div className="telemetry-top">
            <span className="telemetry-label">Terceros DORA</span>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--brand-jade)' }}>
              {doraComplianceRatio}% ok
            </span>
          </div>
          <div className="telemetry-value-row">
            <span
              className="posture-metric-num"
              style={{
                color:
                  summary.providersAtRiskCount > 0
                    ? 'var(--sev-critical-border)'
                    : 'var(--brand-jade)',
              }}
            >
              {summary.providersAtRiskCount}
            </span>
            <span className="telemetry-meta">
              riesgo · {compliantProvidersCount} OK
            </span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{
                width: `${doraComplianceRatio}%`,
                backgroundColor: 'var(--brand-jade)',
              }}
            />
          </div>
        </article>
      </div>
    </div>
  );
};
