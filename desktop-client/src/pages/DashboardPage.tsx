import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService, triggerFileDownload } from '../services/apiClient';
import { demoStore } from '../services/demoStore';
import type {
  AssetDTO,
  CvssAssessmentCreateRequest,
  CvssSeverity,
  DashboardSummaryResponse,
  IctProviderDTO,
  ReportFormat,
  StatusTransitionRequest,
  VulnerabilityCreateRequest,
  VulnerabilityDetailDTO,
  VulnerabilityStatus,
  VulnerabilitySummaryDTO,
} from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DoraPostureHero } from '../components/DoraPostureHero';
import { DoraBlastRadiusCard } from '../components/DoraBlastRadiusCard';
import { DashboardAnalyticsCard } from '../components/DashboardAnalyticsCard';
import { DoraScheduleCard } from '../components/DoraScheduleCard';
import { CreateVulnerabilityModal } from '../components/modals/CreateVulnerabilityModal';
import {
  VulnerabilityDetailModal,
  type DetailTab,
} from '../components/modals/VulnerabilityDetailModal';

interface RecentAuditItem {
  id: number;
  vulnerabilityId: number;
  internalCode: string;
  username: string;
  actionType: string;
  newStatus: VulnerabilityStatus;
  createdAt: string;
}

const LIFECYCLE_SEGMENTS: Array<{
  status: VulnerabilityStatus;
  short: string;
  color: string;
}> = [
  { status: 'ABIERTA', short: 'Abierta', color: '#FB7185' },
  { status: 'PENDIENTE DE REMEDIACIÓN', short: 'Remediación', color: '#FACC15' },
  { status: 'RESUELTA', short: 'Resuelta', color: '#00D3FB' },
  { status: 'CERRADA', short: 'Cerrada', color: '#83FD80' },
];

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function computeSlaBadge(
  targetIso: string | null,
  status: VulnerabilityStatus
): { label: string; tone: 'ok' | 'overdue' | 'urgent' | 'calm' } {
  if (status === 'RESUELTA' || status === 'CERRADA') {
    return { label: 'Mitigada', tone: 'ok' };
  }
  if (!targetIso) {
    return { label: 'Sin SLA', tone: 'calm' };
  }
  const targetMs = Date.parse(`${targetIso}T23:59:59Z`);
  if (Number.isNaN(targetMs)) {
    return { label: targetIso, tone: 'calm' };
  }
  const diffDays = Math.ceil((targetMs - Date.now()) / 86_400_000);
  const parts = targetIso.split('-');
  const shortDate = `${parts[2] ?? '--'} ${MONTHS_SHORT[Math.max(0, Math.min(11, Number(parts[1] ?? 1) - 1))] ?? ''}`;

  if (diffDays < 0) {
    return {
      label: Math.abs(diffDays) <= 60 ? `Vencido -${Math.abs(diffDays)}d` : `Vencido · ${shortDate}`,
      tone: 'overdue',
    };
  }
  if (diffDays === 0) {
    return { label: 'Vence hoy', tone: 'overdue' };
  }
  if (diffDays <= 7) {
    return { label: `En ${diffDays}d`, tone: 'urgent' };
  }
  return { label: shortDate, tone: 'calm' };
}

export const DashboardPage: React.FC = () => {
  const { user, activeRole, dataMode } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [allVulns, setAllVulns] = useState<VulnerabilitySummaryDTO[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AssetDTO[]>([]);
  const [providers, setProviders] = useState<IctProviderDTO[]>([]);
  const [recentAudits, setRecentAudits] = useState<RecentAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<ReportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Direct Slide-Over Inspector & Quick Create modal right on Dashboard
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<DetailTab>('overview');
  const [selectedDetail, setSelectedDetail] = useState<VulnerabilityDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const canWrite = activeRole === 'ADMIN' || activeRole === 'ANALYST';

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (dataMode === 'live') {
        const [summaryRes, vulnsRes, assetsRes, providersRes] = await Promise.all([
          apiService.getDashboardSummary(),
          apiService.getVulnerabilities({
            page: 0,
            size: 50,
            sort: 'cvssScore,desc',
          }),
          apiService.getAssets({ page: 0, size: 100 }),
          apiService.getProviders(),
        ]);
        setSummary(summaryRes);
        setAllVulns(vulnsRes.content);
        setAvailableAssets(assetsRes.content);
        setProviders(providersRes);
        setRecentAudits(
          vulnsRes.content.slice(0, 4).map((v, idx) => ({
            id: v.id * 100 + idx,
            vulnerabilityId: v.id,
            internalCode: v.internalCode,
            username: v.assignedUsername ?? 'analyst_soc',
            actionType: 'TRACKED',
            newStatus: v.status,
            createdAt: `${v.discoveredAt}T09:15:00Z`,
          }))
        );
      } else {
        setSummary(demoStore.getDashboardSummary());
        setAllVulns(
          demoStore.getVulnerabilities({
            page: 0,
            size: 50,
            sort: 'cvssScore,desc',
          }).content
        );
        setAvailableAssets(demoStore.getAssets({ page: 0, size: 100 }).content);
        setProviders(demoStore.getProviders());
        setRecentAudits(demoStore.getRecentAuditEvents(4));
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al consultar el panel DORA.';
      setError(msg);
      notify('Error cargando el panel', msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [dataMode, notify]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const openInspector = async (vulnId: number, tab: DetailTab = 'overview') => {
    setDetailInitialTab(tab);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const detail =
        dataMode === 'live'
          ? await apiService.getVulnerabilityById(vulnId)
          : demoStore.getVulnerabilityById(vulnId);
      setSelectedDetail(detail);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo cargar el detalle.';
      notify('Error cargando detalle', msg, 'error');
      setDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateVulnerability = async (payload: VulnerabilityCreateRequest) => {
    const created =
      dataMode === 'live'
        ? await apiService.createVulnerability(payload)
        : demoStore.createVulnerability(payload, user);

    notify(
      'Vulnerabilidad registrada',
      `${created.internalCode} guardada con CVSS v${created.cvssVersion} (${created.cvssScore.toFixed(1)} · ${created.severity}).`,
      'success'
    );
    await loadDashboard();
  };

  const handleTransitionStatus = async (
    id: number,
    payload: StatusTransitionRequest
  ) => {
    const updated =
      dataMode === 'live'
        ? await apiService.updateVulnerabilityStatus(id, payload)
        : demoStore.updateVulnerabilityStatus(id, payload, user);

    setSelectedDetail(updated);
    notify(
      'Estado actualizado',
      `${updated.internalCode} pasó a ${updated.status}. Índice DORA recalculado.`,
      'success'
    );
    await loadDashboard();
  };

  const handleReassessCvss = async (
    id: number,
    payload: CvssAssessmentCreateRequest
  ) => {
    if (dataMode === 'live') {
      await apiService.addCvssAssessment(id, payload);
      setSelectedDetail(await apiService.getVulnerabilityById(id));
    } else {
      demoStore.addCvssAssessment(id, payload, user);
      setSelectedDetail(demoStore.getVulnerabilityById(id));
    }
    notify(
      'Evaluación CVSS actualizada',
      `Nueva nota CVSS v${payload.cvssVersion} (${payload.cvssScore.toFixed(1)} · ${payload.severity}).`,
      'success'
    );
    await loadDashboard();
  };

  const handleDeleteVulnerability = async (id: number) => {
    if (dataMode === 'live') {
      await apiService.deleteVulnerability(id);
    } else {
      demoStore.deleteVulnerability(id, user);
    }
    notify(
      'Registro eliminado',
      `La vulnerabilidad #${id} se ha eliminado del inventario.`,
      'warning'
    );
    await loadDashboard();
  };

  const handleQuickExport = async (format: ReportFormat) => {
    setExportingFormat(format);
    try {
      const content =
        dataMode === 'live'
          ? await apiService.exportReport({ format })
          : demoStore.exportReport({ format }, user);
      const stamp = new Date().toISOString().slice(0, 10);
      const ext = format === 'HTML' ? 'html' : 'csv';
      const mime = format === 'HTML' ? 'text/html' : 'text/csv';
      triggerFileDownload(content, `vulnfollowup-dora-snapshot-${stamp}.${ext}`, mime);
      notify(
        `Snapshot ${format} exportado`,
        dataMode === 'live'
          ? `Generado mediante ProcessBuilder (GET /api/reports/export?format=${format}).`
          : `Informe ejecutivo ${format} descargado desde el entorno local.`,
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `No se pudo exportar el informe ${format}.`;
      notify('Error al exportar', msg, 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleSeverityJump = (severity: CvssSeverity) => {
    navigate(`/vulnerabilities?severity=${severity}`);
  };

  const topVulns = allVulns.slice(0, 5);
  const totalCount = summary?.totalVulnerabilities ?? 0;

  return (
    <section aria-labelledby="dashboard-heading">
      <div className="page-header">
        <div>
          <h1 id="dashboard-heading" className="page-title">
            Panel DORA
          </h1>
          <p className="page-subtitle">
            {dataMode === 'live' ? 'Spring Boot + PostgreSQL' : 'Entorno interactivo local'} ·{' '}
            <span className="mono">{totalCount}</span> CVEs y{' '}
            <span className="mono">{providers.length}</span> proveedores TIC
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-sm"
            disabled={!canWrite || exportingFormat !== null}
            onClick={() => void handleQuickExport('CSV')}
            title={
              !canWrite
                ? 'Rol VIEWER: exportación bloqueada (403 Forbidden)'
                : 'Descargar informe ejecutivo CSV (ProcessBuilder)'
            }
          >
            {exportingFormat === 'CSV' ? 'CSV...' : 'CSV'}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={!canWrite || exportingFormat !== null}
            onClick={() => void handleQuickExport('HTML')}
            title={
              !canWrite
                ? 'Rol VIEWER: exportación bloqueada (403 Forbidden)'
                : 'Descargar informe ejecutivo HTML (ProcessBuilder)'
            }
          >
            {exportingFormat === 'HTML' ? 'HTML...' : 'HTML'}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void loadDashboard()}
            disabled={loading}
          >
            {loading ? 'Sincronizando...' : 'Actualizar'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canWrite}
            onClick={() => setIsCreateOpen(true)}
            title={
              !canWrite
                ? 'Rol VIEWER: solo lectura (403 Forbidden)'
                : 'Registrar nueva vulnerabilidad CVSS v3.1 o v4.0'
            }
          >
            + Registrar CVE
          </button>
        </div>
      </div>

      {error && (
        <div
          className="inline-alert inline-alert-error"
          role="alert"
          style={{ marginBottom: '18px' }}
        >
          <strong>Error de conexión:</strong> {error}
        </div>
      )}

      {loading || !summary ? (
        <div className="panel skeleton-stack" aria-busy="true">
          <div className="skeleton-line" style={{ width: '36%' }} />
          <div className="skeleton-line" style={{ width: '100%' }} />
          <div className="skeleton-line" style={{ width: '80%' }} />
        </div>
      ) : (
        <>
          {/* Row 1: Asymmetric DORA Posture Hero (Resilience Gauge + What-If + 2x2 Matrix) */}
          <DoraPostureHero
            summary={summary}
            totalProvidersCount={providers.length}
            allVulns={allVulns}
            onInspectPriority={(vulnId) => void openInspector(vulnId, 'lifecycle')}
          />

          {/* Row 2: Multi-Provider Interactive DORA Blast-Radius Switcher */}
          <DoraBlastRadiusCard
            providersAtRisk={summary.providersAtRisk}
            allAssets={availableAssets}
            allVulns={allVulns}
            onInspectVulnerability={(vulnId) => void openInspector(vulnId, 'overview')}
          />

          {/* Row 3: Tri-Mode Analytics Card (CVSS Donut | Providers | Trend) + Upcoming Schedule */}
          <div className="bento-grid">
            <div className="bento-col-6">
              <DashboardAnalyticsCard
                total={summary.totalVulnerabilities}
                openAndPending={summary.openAndPendingCount}
                bySeverity={summary.bySeverity}
                providers={providers}
                allVulns={allVulns}
                onSelectSeverity={handleSeverityJump}
              />
            </div>

            <div className="bento-col-6">
              <DoraScheduleCard
                providersAtRisk={summary.providersAtRisk}
                urgentVulns={topVulns}
                onInspectVulnerability={(id) => void openInspector(id, 'overview')}
              />
            </div>
          </div>

          {/* Row 4: Operational Priority Table (SLA Countdown + Quick Triage) + Lifecycle & Audit Feed */}
          <div className="bento-grid">
            <div className="panel bento-col-8">
              <div className="panel-header-bar">
                <div>
                  <h2 className="panel-title">Prioritarias por CVSS</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                    Top 5 con control SLA · clic para inspeccionar o avanzar estado
                  </p>
                </div>
                <Link to="/vulnerabilities" className="btn btn-sm">
                  Ver todas ({summary.totalVulnerabilities})
                </Link>
              </div>

              <div className="table-container" style={{ boxShadow: 'none' }}>
                <table className="data-table" aria-label="Vulnerabilidades prioritarias con plazo SLA">
                  <thead>
                    <tr>
                      <th scope="col">Código / SLA</th>
                      <th scope="col">Vulnerabilidad</th>
                      <th scope="col">CVSS / Estado</th>
                      <th scope="col">Triaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVulns.map((v) => {
                      const sla = computeSlaBadge(v.targetRemediationDate, v.status);
                      return (
                        <tr
                          key={v.id}
                          className="row-clickable"
                          onClick={() => void openInspector(v.id, 'overview')}
                        >
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div className="mono" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                              {v.internalCode}
                            </div>
                            <div style={{ marginTop: '5px' }}>
                              <span className={`sla-pill sla-pill-${sla.tone} mono`}>
                                {sla.label}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.title}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                              {v.primaryProviderName ?? 'Sin proveedor'} · {v.affectedAssetsCount}{' '}
                              activo(s)
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                              <SeverityBadge
                                severity={v.severity}
                                score={v.cvssScore}
                                version={v.cvssVersion}
                              />
                              <StatusBadge status={v.status} />
                            </div>
                          </td>
                          <td
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="btn btn-sm btn-triage"
                              disabled={!canWrite || v.status === 'CERRADA'}
                              onClick={() => void openInspector(v.id, 'lifecycle')}
                              title={
                                v.status === 'CERRADA'
                                  ? 'Registro cerrado definitivamente'
                                  : !canWrite
                                    ? 'Solo ADMIN y ANALYST pueden transicionar estados'
                                    : `Avanzar estado de ${v.internalCode}`
                              }
                            >
                              Avanzar →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel bento-col-4">
              <div className="panel-header-bar" style={{ marginBottom: '12px' }}>
                <h2 className="panel-title">Ciclo de vida y auditoría</h2>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                  audit_logs
                </span>
              </div>

              <div className="lifecycle-stack-bar" aria-label="Distribución de estados del ciclo de vida">
                {LIFECYCLE_SEGMENTS.map((seg) => {
                  const count = summary.byStatus[seg.status] ?? 0;
                  const widthPct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  if (widthPct <= 0) return null;
                  return (
                    <div
                      key={seg.status}
                      title={`${seg.short}: ${count}`}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: seg.color,
                      }}
                    />
                  );
                })}
              </div>

              <div className="lifecycle-mini-grid">
                {LIFECYCLE_SEGMENTS.map((seg) => {
                  const count = summary.byStatus[seg.status] ?? 0;
                  return (
                    <div key={seg.status} className="lifecycle-mini-item">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '999px',
                            backgroundColor: seg.color,
                          }}
                        />
                        <span style={{ color: 'var(--ink-secondary)' }}>{seg.short}</span>
                      </span>
                      <strong className="mono">{count}</strong>
                    </div>
                  );
                })}
              </div>

              <h3
                className="telemetry-label"
                style={{ marginBottom: '8px', display: 'block' }}
              >
                Actividad reciente
              </h3>

              <ul className="audit-feed-list">
                {recentAudits.map((evt) => (
                  <li key={evt.id}>
                    <button
                      type="button"
                      className="audit-feed-btn"
                      onClick={() => void openInspector(evt.vulnerabilityId, 'lifecycle')}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <strong className="mono" style={{ fontSize: '0.78rem' }}>
                          {evt.internalCode}
                        </strong>
                        <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>
                          {evt.createdAt.slice(0, 10)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                        <span className="mono" style={{ color: 'var(--brand-ocean)' }}>
                          {evt.username}
                        </span>{' '}
                        → {evt.newStatus}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <CreateVulnerabilityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        availableAssets={availableAssets}
        onSubmit={handleCreateVulnerability}
      />

      <VulnerabilityDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        detail={selectedDetail}
        loading={loadingDetail}
        initialTab={detailInitialTab}
        activeRole={activeRole}
        onTransitionStatus={handleTransitionStatus}
        onReassessCvss={handleReassessCvss}
        onDelete={handleDeleteVulnerability}
      />
    </section>
  );
};
