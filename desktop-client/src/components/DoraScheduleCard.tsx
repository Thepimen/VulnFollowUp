import React from 'react';
import { Link } from 'react-router-dom';
import type { IctProviderDTO, VulnerabilitySummaryDTO } from '../types/api';

interface DoraScheduleCardProps {
  providersAtRisk: IctProviderDTO[];
  urgentVulns: VulnerabilitySummaryDTO[];
  onInspectVulnerability?: (vulnId: number) => void;
}

interface ScheduleEntry {
  id: string;
  dateIso: string;
  day: string;
  month: string;
  title: string;
  subtitle: string;
  tag: string;
  urgent: boolean;
  to: string;
  vulnId?: number;
}

const MONTHS_ES = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];

function splitDate(iso: string): { day: string; month: string } {
  const parts = iso.split('-');
  const monthIdx = Math.max(0, Math.min(11, Number(parts[1] ?? 1) - 1));
  return {
    day: parts[2] ?? '--',
    month: MONTHS_ES[monthIdx] ?? '---',
  };
}

export const DoraScheduleCard: React.FC<DoraScheduleCardProps> = ({
  providersAtRisk,
  urgentVulns,
  onInspectVulnerability,
}) => {
  const entries: ScheduleEntry[] = [
    ...providersAtRisk.map((p) => {
      const { day, month } = splitDate(p.reviewDate);
      return {
        id: `prov-${p.id}`,
        dateIso: p.reviewDate,
        day,
        month,
        title: `${p.name} · Revisión contractual`,
        subtitle: `${p.providerCode} · ${p.activeCriticalHighVulnsCount} brecha(s) activas`,
        tag: 'DORA',
        urgent: true,
        to: '/providers',
      };
    }),
    ...urgentVulns
      .filter(
        (v) =>
          v.targetRemediationDate &&
          (v.status === 'ABIERTA' || v.status === 'PENDIENTE DE REMEDIACIÓN')
      )
      .slice(0, 3)
      .map((v) => {
        const { day, month } = splitDate(v.targetRemediationDate!);
        return {
          id: `vuln-${v.id}`,
          dateIso: v.targetRemediationDate!,
          day,
          month,
          title: `${v.internalCode} · CVSS ${v.cvssScore.toFixed(1)}`,
          subtitle: v.title,
          tag: 'SLA',
          urgent: v.severity === 'CRITICAL',
          to: `/vulnerabilities?search=${encodeURIComponent(v.internalCode)}`,
          vulnId: v.id,
        };
      }),
  ]
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso))
    .slice(0, 4);

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header-bar">
        <div>
          <h2 className="panel-title">Próximos vencimientos</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
            Revisiones DORA y fechas límite de parcheo
          </p>
        </div>
        <Link to="/providers" className="btn btn-sm">
          Proveedores
        </Link>
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
          Sin vencimientos críticos pendientes.
        </p>
      ) : (
        <ul className="schedule-list">
          {entries.map((item) => {
            const inner = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div className="schedule-date-box mono">
                    <strong>{item.day}</strong>
                    <span>{item.month}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--ink-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                <span
                  className={`badge ${
                    item.urgent ? 'badge-status-open' : 'badge-status-pending'
                  }`}
                >
                  {item.tag}
                </span>
              </>
            );

            return (
              <li key={item.id}>
                {item.vulnId && onInspectVulnerability ? (
                  <button
                    type="button"
                    className="schedule-item"
                    onClick={() => onInspectVulnerability(item.vulnId!)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {inner}
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    className="schedule-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
