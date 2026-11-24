import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/apiClient';
import { demoStore } from '../services/demoStore';
import type {
  AssetCreateRequest,
  AssetCriticality,
  AssetDTO,
  AssetEnvironment,
  IctProviderDTO,
  PaginatedResponse,
} from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { CreateAssetModal } from '../components/modals/CreateAssetModal';

export const AssetsPage: React.FC = () => {
  const { user, activeRole, dataMode } = useAuth();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [criticality, setCriticality] = useState<AssetCriticality | ''>('');
  const [environment, setEnvironment] = useState<AssetEnvironment | ''>('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [assetsPage, setAssetsPage] = useState<PaginatedResponse<AssetDTO>>({
    content: [],
    page: 0,
    size: pageSize,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });
  const [providers, setProviders] = useState<IctProviderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canCreateAsset = activeRole === 'ADMIN' || activeRole === 'ANALYST';

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      search: search.trim() || undefined,
      criticality: criticality || undefined,
      environment: environment || undefined,
      page,
      size: pageSize,
    };

    try {
      if (dataMode === 'live') {
        const res = await apiService.getAssets(params);
        setAssetsPage(res);
      } else {
        setAssetsPage(demoStore.getAssets(params));
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al cargar el inventario de activos.';
      setError(msg);
      notify('Error en activos', msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, criticality, environment, page, dataMode, notify]);

  const loadProviders = useCallback(async () => {
    try {
      if (dataMode === 'live') {
        setProviders(await apiService.getProviders());
      } else {
        setProviders(demoStore.getProviders());
      }
    } catch {
      setProviders(demoStore.getProviders());
    }
  }, [dataMode]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const handleCreateAsset = async (payload: AssetCreateRequest) => {
    const created =
      dataMode === 'live'
        ? await apiService.createAsset(payload)
        : demoStore.createAsset(payload, user);

    notify(
      'Activo tecnológico registrado',
      `${created.assetCode} (${created.name}) vinculado a ${created.providerName}.`,
      'success'
    );
    setPage(0);
    await loadAssets();
  };

  const criticalProdCount = assetsPage.content.filter(
    (a) =>
      a.environment === 'PRODUCTION' &&
      (a.criticality === 'CRITICAL' || a.criticality === 'HIGH')
  ).length;
  const totalPages = Math.max(1, assetsPage.totalPages);

  return (
    <section aria-labelledby="assets-heading">
      <div className="page-header">
        <div>
          <h1 id="assets-heading" className="page-title">
            Activos TIC
          </h1>
          <p className="page-subtitle">
            Infraestructura por entorno, criticidad operativa y proveedor asignado
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canCreateAsset}
            onClick={() => setIsCreateOpen(true)}
            title={
              !canCreateAsset
                ? 'Rol VIEWER no autorizado para crear activos (403 Forbidden)'
                : 'Registrar nuevo activo tecnológico'
            }
          >
            + Nuevo activo TIC
          </button>
        </div>
      </div>

      <div className="telemetry-strip telemetry-strip-3" role="region" aria-label="Resumen de activos">
        <article className="telemetry-cell">
          <div className="telemetry-top">
            <span className="telemetry-label">Activos registrados</span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--brand-ocean)' }}>
              Total
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value">{assetsPage.totalElements}</span>
            <span className="telemetry-meta">{assetsPage.content.length} en vista</span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{ width: '100%', backgroundColor: 'var(--brand-sapphire-mid)' }}
            />
          </div>
        </article>

        <article className="telemetry-cell">
          <div className="telemetry-top">
            <span className="telemetry-label">Producción alta / crítica</span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--sev-critical-border)' }}>
              PROD
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value" style={{ color: 'var(--brand-ocean)' }}>
              {criticalProdCount}
            </span>
            <span className="telemetry-meta">prioridad DORA</span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{
                width: `${assetsPage.content.length > 0 ? Math.round((criticalProdCount / assetsPage.content.length) * 100) : 0}%`,
                backgroundColor: 'var(--brand-ocean)',
              }}
            />
          </div>
        </article>

        <article className="telemetry-cell">
          <div className="telemetry-top">
            <span className="telemetry-label">Proveedores vinculados</span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--brand-jade)' }}>
              1:N
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value" style={{ color: 'var(--brand-jade)' }}>
              {providers.length}
            </span>
            <span className="telemetry-meta">terceros TIC</span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{ width: '100%', backgroundColor: 'var(--brand-jade)' }}
            />
          </div>
        </article>
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

      <form
        className="filter-dock"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filtros de inventario de activos"
      >
        <div className="filter-grid">
          <div className="form-field">
            <label htmlFor="asset-filter-search" className="form-label">
              Buscar (código o nombre)
            </label>
            <input
              id="asset-filter-search"
              type="search"
              className="form-input"
              placeholder="Ej. AST-PAY-008, API de pagos..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div className="form-field">
            <label htmlFor="asset-filter-crit" className="form-label">
              Criticidad DORA
            </label>
            <select
              id="asset-filter-crit"
              className="form-select"
              value={criticality}
              onChange={(e) => {
                setCriticality(e.target.value as AssetCriticality | '');
                setPage(0);
              }}
            >
              <option value="">Todas las criticidades</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="asset-filter-env" className="form-label">
              Entorno
            </label>
            <select
              id="asset-filter-env"
              className="form-select"
              value={environment}
              onChange={(e) => {
                setEnvironment(e.target.value as AssetEnvironment | '');
                setPage(0);
              }}
            >
              <option value="">Todos los entornos</option>
              <option value="PRODUCTION">PRODUCTION</option>
              <option value="STAGING">STAGING</option>
              <option value="DEVELOPMENT">DEVELOPMENT</option>
              <option value="DR">DR</option>
            </select>
          </div>
        </div>
      </form>

      {/* Desktop Table */}
      <div
        className="table-container desktop-table-only"
        role="region"
        aria-live="polite"
        aria-busy={loading}
      >
        <table className="data-table" aria-label="Inventario de activos tecnológicos">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Activo y departamento</th>
              <th scope="col">Tipo / Sistema</th>
              <th scope="col">Criticidad</th>
              <th scope="col">Entorno / IP</th>
              <th scope="col">Proveedor TIC</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Cargando activos...</td>
              </tr>
            ) : assetsPage.content.length === 0 ? (
              <tr>
                <td colSpan={7}>No hay activos que coincidan con el filtro aplicado.</td>
              </tr>
            ) : (
              assetsPage.content.map((asset) => (
                <tr key={asset.id}>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                    <strong>{asset.assetCode}</strong>
                  </td>
                  <td>
                    <strong>{asset.name}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                      {asset.ownerDepartment}
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--brand-ocean)' }}>
                      {asset.assetType}
                    </span>
                    <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                      {asset.operatingSystem ?? 'N/D'}
                    </div>
                  </td>
                  <td>
                    <SeverityBadge severity={asset.criticality} />
                  </td>
                  <td className="mono">
                    <div>{asset.environment}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                      {asset.ipAddress ?? 'Sin IP'}
                    </div>
                  </td>
                  <td>
                    <strong>{asset.providerName}</strong>
                  </td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--brand-jade)' }}>
                    {asset.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-card-list" role="region" aria-live="polite">
        {assetsPage.content.map((asset) => (
          <article key={asset.id} className="mobile-data-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <strong className="mono">{asset.assetCode}</strong>
              <SeverityBadge severity={asset.criticality} />
            </div>
            <div style={{ fontWeight: 700 }}>{asset.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              {asset.providerName} · <span className="mono">{asset.environment}</span>
              {asset.ipAddress ? ` · ${asset.ipAddress}` : ''}
            </div>
          </article>
        ))}
      </div>

      <div className="pagination-bar" role="navigation" aria-label="Paginación de activos">
        <div>
          Mostrando <strong className="mono">{assetsPage.content.length}</strong> de{' '}
          <strong className="mono">{assetsPage.totalElements}</strong> activos
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
            disabled={assetsPage.last || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      <CreateAssetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        providers={providers}
        onSubmit={handleCreateAsset}
      />
    </section>
  );
};
