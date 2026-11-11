import React, { useMemo, useState } from 'react';
import { PHASE1_VULNERABILITIES } from '../services/apiClient';
import type {
  CvssSeverity,
  UserRole,
  VulnerabilityStatus,
} from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

interface VulnerabilitiesPageProps {
  activeRole: UserRole;
}

export const VulnerabilitiesPage: React.FC<VulnerabilitiesPageProps> = ({
  activeRole,
}) => {
  const [severityFilter, setSeverityFilter] = useState<CvssSeverity | ''>('');
  const [statusFilter, setStatusFilter] = useState<VulnerabilityStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const filtered = useMemo(() => {
    return PHASE1_VULNERABILITIES.filter((item) => {
      if (severityFilter && item.severity !== severityFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.internalCode.toLowerCase().includes(q);
        const matchCve = (item.cveId || '').toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchProv = (item.primaryProviderName || '').toLowerCase().includes(q);
        if (!matchCode && !matchCve && !matchTitle && !matchProv) return false;
      }
      return true;
    });
  }, [severityFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedSlice = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const canCreateOrImport = activeRole === 'ADMIN' || activeRole === 'ANALYST';
  const canCloseVulnerability = activeRole === 'ADMIN';

  return (
    <section aria-labelledby="vulns-heading">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 id="vulns-heading" style={{ fontSize: '1.55rem', fontWeight: 800 }}>
            Registro Paginado de Vulnerabilidades (CVSS v3.1 & v4.0)
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
            Contrato REST: <code className="mono">GET /api/vulnerabilities?page={page}&size={pageSize}&sort=cvssScore,desc</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            disabled={!canCreateOrImport}
            title={
              !canCreateOrImport
                ? 'Operación bloqueada para rol VIEWER (403 Forbidden)'
                : 'Importar lote JSON con ExecutorService'
            }
          >
            Importar Lote JSON (ExecutorService)
          </button>
          <button
            type="button"
            className="btn"
            disabled={!canCreateOrImport}
            title={
              !canCreateOrImport
                ? 'Operación bloqueada para rol VIEWER (403 Forbidden)'
                : 'Exportar informe vía ProcessBuilder'
            }
          >
            Exportar CSV/HTML (ProcessBuilder)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canCreateOrImport}
          >
            + Registrar Vulnerabilidad
          </button>
        </div>
      </div>

      {/* Multi-Criteria Filter Bar */}
      <form
        className="panel"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '18px',
        }}
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filtros combinados de vulnerabilidades"
      >
        <div className="form-field">
          <label htmlFor="filter-search" className="form-label">
            Buscar (Código VFU, CVE, Título o Proveedor)
          </label>
          <input
            id="filter-search"
            type="search"
            className="form-input"
            placeholder="Ej. VFU-0012, HostingSur, CVE-2024..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="filter-severity" className="form-label">
            Severidad CVSS Base
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
            Estado del Ciclo de Vida
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
      </form>

      {/* Accessible Data Table */}
      <div className="table-container" role="region" aria-live="polite">
        <table className="data-table" aria-label="Listado paginado de vulnerabilidades">
          <thead>
            <tr>
              <th scope="col">Código / CVE</th>
              <th scope="col">Vulnerabilidad & Vector CVSS</th>
              <th scope="col">Severidad & Nota</th>
              <th scope="col">Estado Actual</th>
              <th scope="col">Proveedor TIC / Activos</th>
              <th scope="col">Acciones RBAC ({activeRole})</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSlice.map((vuln) => (
              <tr key={vuln.id}>
                <td className="mono">
                  <strong>{vuln.internalCode}</strong>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                    {vuln.cveId ?? 'Sin CVE'}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{vuln.title}</div>
                  <code
                    className="mono"
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--ink-secondary)',
                      backgroundColor: 'var(--bg-elevated)',
                      padding: '2px 6px',
                      borderRadius: '2px',
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
                  <div style={{ fontWeight: 600 }}>{vuln.primaryProviderName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    {vuln.affectedAssetsCount} activo(s) N:M · SLA: {vuln.targetRemediationDate}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      disabled={activeRole === 'VIEWER'}
                      title={
                        activeRole === 'VIEWER'
                          ? 'Rol VIEWER: solo lectura (403 Forbidden)'
                          : 'Avanzar estado de remediación'
                      }
                    >
                      Cambiar Estado
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={!canCloseVulnerability}
                      title={
                        !canCloseVulnerability
                          ? 'Solo ADMIN puede cerrar (CERRADA) una vulnerabilidad'
                          : 'Cerrar vulnerabilidad verificada'
                      }
                    >
                      Cerrar (ADMIN)
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Green Software Pagination Footer */}
      <div className="pagination-bar" role="navigation" aria-label="Paginación de tabla">
        <div>
          Mostrando <strong className="mono">{paginatedSlice.length}</strong> de{' '}
          <strong className="mono">{filtered.length}</strong> registros filtrados ·{' '}
          <span className="mono">Green Software Server-Side Pagination</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </button>
          <span className="mono">
            Página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            className="btn"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
};
