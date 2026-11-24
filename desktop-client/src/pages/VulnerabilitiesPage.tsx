import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService, triggerFileDownload } from '../services/apiClient';
import { demoStore } from '../services/demoStore';
import type {
  AssetDTO,
  BatchImportResultDTO,
  CvssAssessmentCreateRequest,
  CvssSeverity,
  PaginatedResponse,
  ReportFormat,
  StatusTransitionRequest,
  VulnerabilityCreateRequest,
  VulnerabilityDetailDTO,
  VulnerabilityStatus,
  VulnerabilitySummaryDTO,
} from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CreateVulnerabilityModal } from '../components/modals/CreateVulnerabilityModal';
import {
  VulnerabilityDetailModal,
  type DetailTab,
} from '../components/modals/VulnerabilityDetailModal';
import { BatchImportModal } from '../components/modals/BatchImportModal';

const VALID_SEVERITIES: CvssSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];

type QuickPresetKey = 'ALL' | 'CRITICAL' | 'HIGH' | 'PENDING' | 'OPEN' | 'HOSTINGSUR';

export const VulnerabilitiesPage: React.FC = () => {
  const { user, activeRole, dataMode } = useAuth();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSeverityParam = searchParams.get('severity') as CvssSeverity | null;
  const initialSearchParam = searchParams.get('search') ?? '';

  const [severityFilter, setSeverityFilter] = useState<CvssSeverity | ''>(
    initialSeverityParam && VALID_SEVERITIES.includes(initialSeverityParam)
      ? initialSeverityParam
      : ''
  );
  const [statusFilter, setStatusFilter] = useState<VulnerabilityStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState(initialSearchParam);
  const [sortOrder, setSortOrder] = useState('cvssScore,desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const [pageData, setPageData] = useState<
    PaginatedResponse<VulnerabilitySummaryDTO>
  >({
    content: [],
    page: 0,
    size: 5,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });
  const [availableAssets, setAvailableAssets] = useState<AssetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ReportFormat | null>(null);

  // Modals & Slide-Over Drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<DetailTab>('overview');
  const [selectedDetail, setSelectedDetail] = useState<VulnerabilityDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const canWrite = activeRole === 'ADMIN' || activeRole === 'ANALYST';
  const hasActiveFilters = Boolean(severityFilter || statusFilter || searchQuery.trim());

  // React to deep-link URL params (?action=new | ?action=import | ?search= | ?severity=)
  useEffect(() => {
    const action = searchParams.get('action');
    const urlSearch = searchParams.get('search');
    const urlSev = searchParams.get('severity') as CvssSeverity | null;

    if (urlSearch !== null) {
      setSearchQuery(urlSearch);
      setPage(0);
    }
    if (urlSev && VALID_SEVERITIES.includes(urlSev)) {
      setSeverityFilter(urlSev);
      setPage(0);
    }
    if (action === 'new' && canWrite) {
      setIsCreateOpen(true);
      setSearchParams({});
    } else if (action === 'import' && canWrite) {
      setIsImportOpen(true);
      setSearchParams({});
    }
  }, [searchParams, canWrite, setSearchParams]);

  const loadVulnerabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      severity: severityFilter || undefined,
      status: statusFilter || undefined,
      search: searchQuery.trim() || undefined,
      page,
      size: pageSize,
      sort: sortOrder,
    };

    try {
      if (dataMode === 'live') {
        const res = await apiService.getVulnerabilities(params);
        setPageData(res);
      } else {
        setPageData(demoStore.getVulnerabilities(params));
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al consultar el listado paginado de vulnerabilidades.';
      setError(msg);
      notify('Error en vulnerabilidades', msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, searchQuery, page, pageSize, sortOrder, dataMode, notify]);

  const loadAssetsForModal = useCallback(async () => {
    try {
      if (dataMode === 'live') {
        const res = await apiService.getAssets({ page: 0, size: 100 });
        setAvailableAssets(res.content);
      } else {
        setAvailableAssets(demoStore.getAssets({ page: 0, size: 100 }).content);
      }
    } catch {
      setAvailableAssets(demoStore.getAssets({ page: 0, size: 100 }).content);
    }
  }, [dataMode]);

  useEffect(() => {
    void loadVulnerabilities();
  }, [loadVulnerabilities]);

  useEffect(() => {
    void loadAssetsForModal();
  }, [loadAssetsForModal]);

  const applyQuickPreset = (preset: QuickPresetKey) => {
    setPage(0);
    if (searchParams.toString()) setSearchParams({});
    switch (preset) {
      case 'ALL':
        setSeverityFilter('');
        setStatusFilter('');
        setSearchQuery('');
        break;
      case 'CRITICAL':
        setSeverityFilter('CRITICAL');
        setStatusFilter('');
        setSearchQuery('');
        break;
      case 'HIGH':
        setSeverityFilter('HIGH');
        setStatusFilter('');
        setSearchQuery('');
        break;
      case 'PENDING':
        setSeverityFilter('');
        setStatusFilter('PENDIENTE DE REMEDIACIÓN');
        setSearchQuery('');
        break;
      case 'OPEN':
        setSeverityFilter('');
        setStatusFilter('ABIERTA');
        setSearchQuery('');
        break;
      case 'HOSTINGSUR':
        setSeverityFilter('');
        setStatusFilter('');
        setSearchQuery('HostingSur');
        break;
    }
  };

  const activeQuickPreset: QuickPresetKey | null =
    !severityFilter && !statusFilter && !searchQuery.trim()
      ? 'ALL'
      : severityFilter === 'CRITICAL' && !statusFilter && !searchQuery.trim()
        ? 'CRITICAL'
        : severityFilter === 'HIGH' && !statusFilter && !searchQuery.trim()
          ? 'HIGH'
          : statusFilter === 'PENDIENTE DE REMEDIACIÓN' && !severityFilter && !searchQuery.trim()
            ? 'PENDING'
            : statusFilter === 'ABIERTA' && !severityFilter && !searchQuery.trim()
              ? 'OPEN'
              : searchQuery.trim().toLowerCase() === 'hostingsur' && !severityFilter && !statusFilter
                ? 'HOSTINGSUR'
                : null;

  const openDetailModal = async (id: number, tab: DetailTab = 'overview') => {
    setDetailInitialTab(tab);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const detail =
        dataMode === 'live'
          ? await apiService.getVulnerabilityById(id)
          : demoStore.getVulnerabilityById(id);
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
    setPage(0);
    await loadVulnerabilities();
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
      'Estado actualizado con auditoría',
      `${updated.internalCode} pasó a ${updated.status} y quedó trazado en audit_logs.`,
      'success'
    );
    await loadVulnerabilities();
  };

  const handleReassessCvss = async (
    id: number,
    payload: CvssAssessmentCreateRequest
  ) => {
    if (dataMode === 'live') {
      await apiService.addCvssAssessment(id, payload);
      const refreshed = await apiService.getVulnerabilityById(id);
      setSelectedDetail(refreshed);
    } else {
      demoStore.addCvssAssessment(id, payload, user);
      setSelectedDetail(demoStore.getVulnerabilityById(id));
    }
    notify(
      'Evaluación CVSS actualizada',
      `Nueva calificación CVSS v${payload.cvssVersion} (${payload.cvssScore.toFixed(1)} · ${payload.severity}).`,
      'success'
    );
    await loadVulnerabilities();
  };

  const handleDeleteVulnerability = async (id: number) => {
    if (dataMode === 'live') {
      await apiService.deleteVulnerability(id);
    } else {
      demoStore.deleteVulnerability(id, user);
    }
    notify(
      'Vulnerabilidad eliminada',
      `El registro #${id} ha sido eliminado correctamente.`,
      'warning'
    );
    await loadVulnerabilities();
  };

  const handleBatchImport = async (rawJson: string): Promise<BatchImportResultDTO> => {
    const res =
      dataMode === 'live'
        ? await apiService.importVulnerabilitiesBatch(rawJson)
        : demoStore.importBatch(rawJson, user);

    notify(
      'Importación masiva completada',
      `Se insertaron ${res.insertedCount} vulnerabilidades en ${res.executionTimeMs} ms.`,
      'success'
    );
    setPage(0);
    await loadVulnerabilities();
    return res;
  };

  const handleExportReport = async (format: ReportFormat) => {
    setExportingFormat(format);
    try {
      const params = {
        format,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
      };
      const content =
        dataMode === 'live'
          ? await apiService.exportReport(params)
          : demoStore.exportReport(params, user);

      const dateStamp = new Date().toISOString().slice(0, 10);
      const ext = format === 'HTML' ? 'html' : 'csv';
      const mime = format === 'HTML' ? 'text/html' : 'text/csv';
      triggerFileDownload(content, `vulnfollowup-dora-report-${dateStamp}.${ext}`, mime);

      notify(
        `Informe ${format} descargado`,
        dataMode === 'live'
          ? `Generado en servidor mediante ProcessBuilder (GET /api/reports/export?format=${format}).`
          : `Archivo ${format} generado en Modo Demo Offline.`,
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `Error exportando informe ${format}.`;
      notify('Error en exportación', msg, 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const totalPages = Math.max(1, pageData.totalPages);

  return (
    <section aria-labelledby="vulns-heading">
      <div className="page-header">
        <div>
          <h1 id="vulns-heading" className="page-title">
            Vulnerabilidades
          </h1>
          <p className="page-subtitle">
            Seguimiento CVSS v3.1 y v4.0 · selecciona cualquier fila para abrir el inspector
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-sapphire"
            disabled={!canWrite}
            onClick={() => setIsImportOpen(true)}
            title={
              !canWrite
                ? 'Operación bloqueada para rol VIEWER (403 Forbidden)'
                : 'Importar lote JSON con transacción atómica (ROLLBACK)'
            }
          >
            Importar JSON (ACID)
          </button>

          <button
            type="button"
            className="btn"
            disabled={!canWrite || exportingFormat !== null}
            onClick={() => void handleExportReport('CSV')}
          >
            {exportingFormat === 'CSV' ? 'Generando...' : 'CSV'}
          </button>

          <button
            type="button"
            className="btn"
            disabled={!canWrite || exportingFormat !== null}
            onClick={() => void handleExportReport('HTML')}
          >
            {exportingFormat === 'HTML' ? 'Generando...' : 'HTML'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!canWrite}
            onClick={() => setIsCreateOpen(true)}
          >
            + Registrar CVE
          </button>
        </div>
      </div>

      {/* One-Click Quick Filter Chips */}
      <div className="quick-chip-bar" role="group" aria-label="Filtros rápidos en un clic">
        {(
          [
            { key: 'ALL', label: 'Todas' },
            { key: 'CRITICAL', label: 'Críticas' },
            { key: 'HIGH', label: 'Altas' },
            { key: 'PENDING', label: 'Pendientes SLA' },
            { key: 'OPEN', label: 'Abiertas' },
            { key: 'HOSTINGSUR', label: 'HostingSur S.L.' },
          ] as Array<{ key: QuickPresetKey; label: string }>
        ).map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`quick-chip ${activeQuickPreset === chip.key ? 'quick-chip-active' : ''}`}
            onClick={() => applyQuickPreset(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="inline-alert inline-alert-error"
          role="alert"
          style={{ marginBottom: '16px' }}
        >
          {error}
        </div>
      )}

      {/* Search & Multi-Criteria Filter Dock */}
      <form
        className="filter-dock"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filtros avanzados de vulnerabilidades"
      >
        <div className="filter-grid">
          <div className="form-field">
            <label htmlFor="filter-search" className="form-label">
              Buscar (VFU, CVE o título)
            </label>
            <input
              id="filter-search"
              type="search"
              className="form-input"
              placeholder="Ej. VFU-0012, HostingSur..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div className="form-field">
            <label htmlFor="filter-severity" className="form-label">
              Severidad CVSS
            </label>
            <select
              id="filter-severity"
              className="form-select"
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as CvssSeverity | '');
                setPage(0);
              }}
            >
              <option value="">Todas las severidades</option>
              <option value="CRITICAL">CRITICAL (9.0 - 10.0)</option>
              <option value="HIGH">HIGH (7.0 - 8.9)</option>
              <option value="MEDIUM">MEDIUM (4.0 - 6.9)</option>
              <option value="LOW">LOW (0.1 - 3.9)</option>
              <option value="NONE">NONE (0.0)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="filter-status" className="form-label">
              Estado
            </label>
            <select
              id="filter-status"
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as VulnerabilityStatus | '');
                setPage(0);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="ABIERTA">ABIERTA</option>
              <option value="PENDIENTE DE REMEDIACIÓN">PENDIENTE DE REMEDIACIÓN</option>
              <option value="RESUELTA">RESUELTA</option>
              <option value="CERRADA">CERRADA</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="filter-sort" className="form-label">
              Ordenación
            </label>
            <select
              id="filter-sort"
              className="form-select"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(0);
              }}
            >
              <option value="cvssScore,desc">CVSS Mayor → Menor</option>
              <option value="cvssScore,asc">CVSS Menor → Mayor</option>
              <option value="discoveredAt,desc">Más recientes</option>
              <option value="internalCode,asc">Código VFU (A-Z)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="filter-size" className="form-label">
              Por página
            </label>
            <select
              id="filter-size"
              className="form-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={5}>5 registros</option>
              <option value={10}>10 registros</option>
              <option value={20}>20 registros</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn" onClick={() => applyQuickPreset('ALL')}>
              Limpiar filtros ×
            </button>
          )}
        </div>
      </form>

      {/* Desktop High-Readability Table */}
      <div
        className="table-container desktop-table-only"
        role="region"
        aria-live="polite"
        aria-busy={loading}
      >
        <table className="data-table" aria-label="Listado paginado de vulnerabilidades">
          <thead>
            <tr>
              <th scope="col">Código / CVE</th>
              <th scope="col">Vulnerabilidad</th>
              <th scope="col">Severidad</th>
              <th scope="col">Estado</th>
              <th scope="col">Proveedor / SLA</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Cargando registros paginados...</td>
              </tr>
            ) : pageData.content.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  No se encontraron vulnerabilidades con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              pageData.content.map((vuln) => (
                <tr
                  key={vuln.id}
                  className="row-clickable"
                  onClick={() => void openDetailModal(vuln.id, 'overview')}
                >
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                    <strong>{vuln.internalCode}</strong>
                    <div style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                      {vuln.cveId ?? 'Sin CVE'}
                    </div>
                  </td>
                  <td style={{ maxWidth: '320px' }}>
                    <div style={{ fontWeight: 600 }}>{vuln.title}</div>
                    <code
                      className="mono"
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        fontSize: '0.72rem',
                        color: 'var(--ink-muted)',
                        wordBreak: 'break-all',
                      }}
                    >
                      v{vuln.cvssVersion}: {vuln.cvssVector}
                    </code>
                  </td>
                  <td>
                    <SeverityBadge
                      severity={vuln.severity}
                      score={vuln.cvssScore}
                      version={vuln.cvssVersion}
                    />
                  </td>
                  <td>
                    <StatusBadge status={vuln.status} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {vuln.primaryProviderName ?? 'Sin proveedor'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      {vuln.affectedAssetsCount} activo(s) · SLA{' '}
                      <span className="mono">{vuln.targetRemediationDate ?? 'N/D'}</span>
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => void openDetailModal(vuln.id, 'overview')}
                      >
                        Inspeccionar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-sapphire"
                        disabled={!canWrite || vuln.status === 'CERRADA'}
                        onClick={() => void openDetailModal(vuln.id, 'lifecycle')}
                      >
                        Estado
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adaptive Mobile Card Stack (Zero Horizontal Scroll on Phones!) */}
      <div className="mobile-card-list" role="region" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="panel">Cargando vulnerabilidades...</div>
        ) : pageData.content.length === 0 ? (
          <div className="panel">Sin vulnerabilidades para los filtros actuales.</div>
        ) : (
          pageData.content.map((vuln) => (
            <article key={vuln.id} className="mobile-data-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong className="mono" style={{ fontSize: '0.92rem' }}>
                  {vuln.internalCode}{' '}
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>
                    {vuln.cveId ?? ''}
                  </span>
                </strong>
                <SeverityBadge
                  severity={vuln.severity}
                  score={vuln.cvssScore}
                  version={vuln.cvssVersion}
                />
              </div>

              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{vuln.title}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={vuln.status} />
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  {vuln.primaryProviderName ?? 'Sin proveedor'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => void openDetailModal(vuln.id, 'overview')}
                >
                  Inspeccionar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ flex: 1 }}
                  disabled={!canWrite || vuln.status === 'CERRADA'}
                  onClick={() => void openDetailModal(vuln.id, 'lifecycle')}
                >
                  Cambiar estado
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      <div className="pagination-bar" role="navigation" aria-label="Paginación de vulnerabilidades">
        <div>
          Mostrando <strong className="mono">{pageData.content.length}</strong> de{' '}
          <strong className="mono">{pageData.totalElements}</strong> registros ·{' '}
          {dataMode === 'live' ? 'Paginación en servidor' : 'Demo Offline'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </button>
          <span className="mono">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={pageData.last || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

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

      <BatchImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBatchImport}
      />
    </section>
  );
};
