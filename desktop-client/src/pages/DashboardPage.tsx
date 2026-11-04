import React from 'react';
import { Link } from 'react-router-dom';
import {
  PHASE1_PROVIDERS,
  PHASE1_VULNERABILITIES,
} from '../services/apiClient';
import { SeverityBadge } from '../components/SeverityBadge';
import { DoraRiskBadge, StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const hostingSur = PHASE1_PROVIDERS.find((p) => p.name === 'HostingSur S.L.');
  const vfu0012 = PHASE1_VULNERABILITIES.find(
    (v) => v.internalCode === 'VFU-0012'
  );

  return (
    <section aria-labelledby="dashboard-heading">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 id="dashboard-heading" style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            Panel Ejecutivo de Gobernanza DORA y CVSS
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
            Telemetría defensiva en tiempo real (`GET /api/dashboard/summary`) · Regulación (UE) 2022/2554 (DORA Cap. V)
          </p>
        </div>
        <Link to="/vulnerabilities" className="btn btn-primary">
          Ver Registro Paginado (20 CVEs)
        </Link>
      </div>

      {/* Mandatory Official SGE Case Banner: HostingSur S.L. + API de pagos + VFU-0012 */}
      {hostingSur && vfu0012 && (
        <div
          className="panel panel-alert-dora"
          role="region"
          aria-label="Alerta prioritaria de cumplimiento DORA"
          style={{ marginBottom: '24px' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <DoraRiskBadge riskStatus={hostingSur.doraRiskStatus} />
                <strong className="mono">{hostingSur.providerCode} · {hostingSur.name}</strong>
                <span>| Activo Afectado: <strong>«API de pagos»</strong> (Criticidad ALTA)</span>
              </div>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                Detectada vulnerabilidad activa <strong className="mono">{vfu0012.internalCode}</strong> ({vfu0012.cveId}) con puntuación{' '}
                <strong className="mono">CVSS {vfu0012.cvssScore} (Crítica)</strong> en estado{' '}
                <strong>{vfu0012.status}</strong>. Revisión contractual prevista para{' '}
                <strong className="mono">marzo ({hostingSur.reviewDate})</strong>.
              </p>
            </div>
            <Link to="/providers" className="btn">
              Inspeccionar Informe DORA
            </Link>
          </div>
        </div>
      )}

      {/* Bento KPI Grid */}
      <div className="bento-grid" role="region" aria-label="Indicadores Clave de Rendimiento">
        <article className="panel bento-col-3">
          <p className="kpi-label">Vulnerabilidades Registradas</p>
          <p className="kpi-value">20</p>
          <p className="kpi-footnote mono">Semilla 3NF (VFU-0001 .. VFU-0020)</p>
        </article>

        <article className="panel bento-col-3">
          <p className="kpi-label">Abiertas / En Remediación</p>
          <p className="kpi-value">12</p>
          <p className="kpi-footnote">6 ABIERTA · 6 PENDIENTE DE REMEDIACIÓN</p>
        </article>

        <article className="panel bento-col-3">
          <p className="kpi-label">Críticas Activas (CVSS 9.0–10.0)</p>
          <p className="kpi-value" style={{ color: 'var(--sev-critical-border)' }}>
            5
          </p>
          <p className="kpi-footnote mono">Incluye VFU-0012 (9.8 · API de pagos)</p>
        </article>

        <article className="panel bento-col-3">
          <p className="kpi-label">Proveedores TIC «EN RIESGO»</p>
          <p className="kpi-value">4 / 5</p>
          <p className="kpi-footnote">Regla automática DORA Capítulo V</p>
        </article>

        {/* Top Priority Vulnerabilities Preview */}
        <div className="panel bento-col-8">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>
            Vulnerabilidades Prioritarias por Severidad CVSS Base (v3.1 / v4.0)
          </h2>
          <div className="table-container">
            <table className="data-table" aria-label="Vulnerabilidades prioritarias">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Título / Activo Principal</th>
                  <th scope="col">Severidad CVSS</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {PHASE1_VULNERABILITIES.slice(0, 5).map((v) => (
                  <tr key={v.id}>
                    <td className="mono">
                      <strong>{v.internalCode}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        {v.cveId}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                        Proveedor: {v.primaryProviderName}
                      </div>
                    </td>
                    <td>
                      <SeverityBadge
                        severity={v.severity}
                        score={v.cvssScore}
                        version={v.cvssVersion}
                      />
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lifecycle Breakdown */}
        <div className="panel bento-col-4">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>
            Ciclo de Vida de Remediación
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', marginBottom: '14px' }}>
            Transiciones estrictas auditadas en <code>audit_logs</code>:
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status="ABIERTA" />
              <span className="mono" style={{ fontWeight: 700 }}>6 registros</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status="PENDIENTE DE REMEDIACIÓN" />
              <span className="mono" style={{ fontWeight: 700 }}>6 registros</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status="RESUELTA" />
              <span className="mono" style={{ fontWeight: 700 }}>3 registros</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status="CERRADA" />
              <span className="mono" style={{ fontWeight: 700 }}>5 registros</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
