import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/apiClient';
import { demoStore } from '../services/demoStore';
import type {
  IctProviderDTO,
  IctProviderUpsertRequest,
  ProviderCriticality,
  ProviderDoraReportDTO,
} from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { DoraRiskBadge, StatusBadge } from '../components/StatusBadge';
import { ProviderFormModal } from '../components/modals/ProviderFormModal';

export const ProvidersPage: React.FC = () => {
  const { user, activeRole, dataMode } = useAuth();
  const { notify } = useToast();

  const [criticalityFilter, setCriticalityFilter] = useState<ProviderCriticality | ''>('');
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  const [providers, setProviders] = useState<IctProviderDTO[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [doraReport, setDoraReport] = useState<ProviderDoraReportDTO | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<IctProviderDTO | null>(null);

  const isAdmin = activeRole === 'ADMIN';

  const loadProviders = useCallback(async () => {
    setLoadingProviders(true);
    setError(null);
    const params = {
      criticality: criticalityFilter || undefined,
      atRiskOnly: atRiskOnly || undefined,
    };

    try {
      const list =
        dataMode === 'live'
          ? await apiService.getProviders(params)
          : demoStore.getProviders(params);

      setProviders(list);
      setSelectedProviderId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev;
        const hostingSur = list.find((p) => p.providerCode === 'PROV-005');
        return hostingSur?.id ?? list[0]?.id ?? null;
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al consultar proveedores TIC.';
      setError(msg);
      notify('Error en proveedores TIC', msg, 'error');
    } finally {
      setLoadingProviders(false);
    }
  }, [criticalityFilter, atRiskOnly, dataMode, notify]);

  const loadProviderReport = useCallback(
    async (providerId: number) => {
      setLoadingReport(true);
      try {
        const report =
          dataMode === 'live'
            ? await apiService.getProviderDoraReport(providerId)
            : demoStore.getProviderDoraReport(providerId);
        setDoraReport(report);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el informe DORA del proveedor.';
        notify('Error en informe DORA', msg, 'error');
        setDoraReport(null);
      } finally {
        setLoadingReport(false);
      }
    },
    [dataMode, notify]
  );

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (selectedProviderId !== null) {
      void loadProviderReport(selectedProviderId);
    } else {
      setDoraReport(null);
    }
  }, [selectedProviderId, loadProviderReport]);

  const handleUpsertProvider = async (
    payload: IctProviderUpsertRequest,
    editingId: number | null
  ) => {
    let saved: IctProviderDTO;
    if (editingId !== null) {
      saved =
        dataMode === 'live'
          ? await apiService.updateProvider(editingId, payload)
          : demoStore.updateProvider(editingId, payload, user);
      notify(
        'Proveedor TIC actualizado',
        `${saved.providerCode} · ${saved.name} actualizado correctamente.`,
        'success'
      );
    } else {
      saved =
        dataMode === 'live'
          ? await apiService.createProvider(payload)
          : demoStore.createProvider(payload, user);
      notify(
        'Proveedor TIC dado de alta',
        `${saved.providerCode} · ${saved.name} homologado bajo DORA Cap. V.`,
        'success'
      );
    }

    await loadProviders();
    setSelectedProviderId(saved.id);
    await loadProviderReport(saved.id);
  };

  const atRiskCount = providers.filter((p) => p.doraRiskStatus === 'AT_RISK').length;
  const compliantCount = providers.length - atRiskCount;

  return (
    <section aria-labelledby="providers-heading">
      <div className="page-header">
        <div>
          <h1 id="providers-heading" className="page-title">
            Proveedores DORA
          </h1>
          <p className="page-subtitle">
            Riesgo contractual Cap. V y exposición en activos gestionados (alta reservada a ADMIN)
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isAdmin}
            onClick={() => {
              setEditingProvider(null);
              setIsFormOpen(true);
            }}
            title={
              !isAdmin
                ? `Rol ${activeRole}: solo ADMIN puede dar de alta o editar proveedores TIC (403 Forbidden)`
                : 'Registrar nuevo proveedor TIC'
            }
          >
            + Alta proveedor TIC
          </button>
        </div>
      </div>

      <div className="telemetry-strip telemetry-strip-3" role="region" aria-label="Resumen DORA de proveedores">
        <article className="telemetry-cell">
          <div className="telemetry-top">
            <span className="telemetry-label">Cartera regulada</span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--brand-ocean)' }}>
              Cap. V
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value">{providers.length}</span>
            <span className="telemetry-meta">proveedores TIC</span>
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
            <span className="telemetry-label">En riesgo</span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--sev-critical-border)' }}>
              AT_RISK
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value" style={{ color: 'var(--sev-critical-border)' }}>
              {atRiskCount}
            </span>
            <span className="telemetry-meta">con brechas HIGH/CRIT</span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{
                width: `${providers.length > 0 ? Math.round((atRiskCount / providers.length) * 100) : 0}%`,
                backgroundColor: 'var(--sev-critical-border)',
              }}
            />
          </div>
        </article>

        <article className="telemetry-cell">
          <div className="telemetry-top">
            <span className="telemetry-label">Conformes SLA</span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--brand-jade)' }}>
              {providers.length > 0 ? `${Math.round((compliantCount / providers.length) * 100)}%` : '100%'}
            </span>
          </div>
          <div className="telemetry-value-row">
            <span className="telemetry-value" style={{ color: 'var(--brand-jade)' }}>
              {compliantCount}
            </span>
            <span className="telemetry-meta">aptos renovación</span>
          </div>
          <div className="telemetry-bar-track" aria-hidden="true">
            <div
              className="telemetry-bar-fill"
              style={{
                width: `${providers.length > 0 ? Math.round((compliantCount / providers.length) * 100) : 100}%`,
                backgroundColor: 'var(--brand-jade)',
              }}
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

      {/* Quick Filters */}
      <div className="quick-chip-bar" role="group" aria-label="Filtros rápidos de proveedores">
        <button
          type="button"
          className={`quick-chip ${!atRiskOnly && !criticalityFilter ? 'quick-chip-active' : ''}`}
          onClick={() => {
            setAtRiskOnly(false);
            setCriticalityFilter('');
          }}
        >
          Todos ({providers.length})
        </button>
        <button
          type="button"
          className={`quick-chip ${atRiskOnly ? 'quick-chip-active' : ''}`}
          onClick={() => setAtRiskOnly((prev) => !prev)}
        >
          Solo en riesgo DORA
        </button>
        <button
          type="button"
          className={`quick-chip ${criticalityFilter === 'CRITICAL' ? 'quick-chip-active' : ''}`}
          onClick={() =>
            setCriticalityFilter((prev) => (prev === 'CRITICAL' ? '' : 'CRITICAL'))
          }
        >
          Criticidad CRITICAL
        </button>
      </div>

      <div className="bento-grid">
        {/* Providers List */}
        <div className="panel bento-col-6">
          <div className="panel-header-bar">
            <h2 className="panel-title">Cartera de proveedores ({providers.length})</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              Pulsa para ver el informe
            </span>
          </div>

          <div className="table-container" style={{ boxShadow: 'none' }} aria-busy={loadingProviders}>
            <table className="data-table" aria-label="Tabla de proveedores TIC">
              <thead>
                <tr>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Estado DORA</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingProviders ? (
                  <tr>
                    <td colSpan={3}>Cargando proveedores...</td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Sin proveedores para el filtro seleccionado.</td>
                  </tr>
                ) : (
                  providers.map((prov) => (
                    <tr
                      key={prov.id}
                      className={`row-clickable ${selectedProviderId === prov.id ? 'row-selected' : ''}`}
                      onClick={() => setSelectedProviderId(prov.id)}
                    >
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {prov.name}{' '}
                          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 500 }}>
                            ({prov.providerCode})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                          {prov.providedService} · Rev.{' '}
                          <span className="mono">{prov.reviewDate}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                          <DoraRiskBadge riskStatus={prov.doraRiskStatus} />
                          <SeverityBadge severity={prov.criticality} />
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-sapphire"
                            onClick={() => setSelectedProviderId(prov.id)}
                          >
                            Reporte
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => {
                                setEditingProvider(prov);
                                setIsFormOpen(true);
                              }}
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Provider DORA Report Panel */}
        <div
          className="panel bento-col-6"
          role="region"
          aria-live="polite"
          aria-busy={loadingReport}
          aria-label="Informe de cumplimiento DORA"
        >
          {loadingReport || !doraReport ? (
            <div className="skeleton-stack">
              <div className="skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton-line" style={{ width: '100%' }} />
              <div className="skeleton-line" style={{ width: '80%' }} />
            </div>
          ) : (
            <>
              <div className="panel-header-bar">
                <h2 className="panel-title">Informe DORA: {doraReport.provider.name}</h2>
                <DoraRiskBadge riskStatus={doraReport.doraRiskStatus} />
              </div>

              <div
                className={`inline-alert ${
                  doraReport.doraRiskStatus === 'AT_RISK'
                    ? 'inline-alert-error'
                    : 'inline-alert-success'
                }`}
                style={{ marginBottom: '16px' }}
              >
                {doraReport.riskJustification}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                  gap: '10px',
                  marginBottom: '18px',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span className="kpi-label">Contrato</span>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '0.8rem', marginTop: '3px' }}>
                    {doraReport.provider.contractReference}
                  </div>
                </div>
                <div>
                  <span className="kpi-label">Revisión · País</span>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '0.8rem', marginTop: '3px' }}>
                    {doraReport.provider.reviewDate} · {doraReport.provider.countryCode}
                  </div>
                </div>
                <div>
                  <span className="kpi-label">SLA disponibilidad</span>
                  <div className="mono" style={{ fontWeight: 800, fontSize: '0.84rem', marginTop: '3px', color: 'var(--brand-jade)' }}>
                    {doraReport.provider.slaAvailabilityPct}%
                  </div>
                  <div className="sla-meter-track" aria-hidden="true">
                    <div
                      className="sla-meter-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, doraReport.provider.slaAvailabilityPct))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <h3 className="detail-heading" style={{ marginBottom: '8px' }}>
                Activos gestionados ({doraReport.managedAssets.length})
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                {doraReport.managedAssets.length === 0 ? (
                  <li style={{ fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
                    Sin activos asignados actualmente.
                  </li>
                ) : (
                  doraReport.managedAssets.map((a) => (
                    <li
                      key={a.id}
                      style={{
                        fontSize: '0.78rem',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      <strong className="mono">{a.assetCode}</strong> · {a.name}
                    </li>
                  ))
                )}
              </ul>

              <h3 className="detail-heading" style={{ marginBottom: '8px' }}>
                Vulnerabilidades pendientes ({doraReport.pendingVulnerabilities.length})
              </h3>
              <div className="table-container" style={{ boxShadow: 'none' }}>
                <table
                  className="data-table"
                  aria-label="Vulnerabilidades pendientes del proveedor"
                >
                  <thead>
                    <tr>
                      <th scope="col">Vulnerabilidad</th>
                      <th scope="col">CVSS / Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doraReport.pendingVulnerabilities.length === 0 ? (
                      <tr>
                        <td colSpan={2}>
                          Sin vulnerabilidades pendientes. Proveedor conforme con SLA DORA.
                        </td>
                      </tr>
                    ) : (
                      doraReport.pendingVulnerabilities.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <div className="mono" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                              {v.internalCode}
                              {v.cveId ? (
                                <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>
                                  {' '}· {v.cveId}
                                </span>
                              ) : null}
                            </div>
                            <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>{v.title}</div>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <ProviderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingProvider={editingProvider}
        onSubmit={handleUpsertProvider}
      />
    </section>
  );
};
