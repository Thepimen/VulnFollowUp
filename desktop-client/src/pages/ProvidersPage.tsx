import React, { useState } from 'react';
import {
  PHASE1_PROVIDERS,
  PHASE1_VULNERABILITIES,
} from '../services/apiClient';
import type { IctProviderDTO, UserRole } from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { DoraRiskBadge, StatusBadge } from '../components/StatusBadge';

interface ProvidersPageProps {
  activeRole: UserRole;
}

export const ProvidersPage: React.FC<ProvidersPageProps> = ({ activeRole }) => {
  const [selectedProvider, setSelectedProvider] = useState<IctProviderDTO>(
    PHASE1_PROVIDERS[0]
  );

  const isAdmin = activeRole === 'ADMIN';
  const providerVulns = PHASE1_VULNERABILITIES.filter(
    (v) => v.primaryProviderName === selectedProvider.name
  );

  return (
    <section aria-labelledby="providers-heading">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 id="providers-heading" style={{ fontSize: '1.55rem', fontWeight: 800 }}>
            Proveedores TIC y Riesgo de Cadena de Suministro (Módulo SGE · DORA Cap. V)
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
            Gestión reservada a <code>ADMIN</code> (`POST/PUT /api/providers`); consulta e informe DORA (`GET /api/providers/{'{id}'}/report`) disponible para todos los roles.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!isAdmin}
          title={
            !isAdmin
              ? `Rol ${activeRole}: solo ADMIN puede dar de alta o editar proveedores TIC (403 Forbidden)`
              : 'Registrar nuevo proveedor TIC'
          }
        >
          + Alta Proveedor TIC (Solo ADMIN)
        </button>
      </div>

      <div className="bento-grid">
        {/* Providers Table */}
        <div className="panel bento-col-6">
          <h2 style={{ fontSize: '1.08rem', marginBottom: '12px' }}>
            Cartera de Proveedores TIC Regulados
          </h2>
          <div className="table-container">
            <table className="data-table" aria-label="Tabla de proveedores TIC">
              <thead>
                <tr>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Criticidad</th>
                  <th scope="col">Revisión Contrato</th>
                  <th scope="col">Estado DORA</th>
                  <th scope="col">Informe</th>
                </tr>
              </thead>
              <tbody>
                {PHASE1_PROVIDERS.map((prov) => (
                  <tr
                    key={prov.id}
                    style={{
                      backgroundColor:
                        selectedProvider.id === prov.id
                          ? 'var(--bg-elevated)'
                          : undefined,
                    }}
                  >
                    <td>
                      <strong className="mono">{prov.providerCode}</strong> ·{' '}
                      <strong>{prov.name}</strong>
                      <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                        {prov.providedService}
                      </div>
                    </td>
                    <td>
                      <SeverityBadge severity={prov.criticality} />
                    </td>
                    <td className="mono">{prov.reviewDate}</td>
                    <td>
                      <DoraRiskBadge riskStatus={prov.doraRiskStatus} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setSelectedProvider(prov)}
                        aria-label={`Ver informe DORA de ${prov.name}`}
                      >
                        Ver Reporte
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Provider DORA Report Panel */}
        <div
          className="panel bento-col-6"
          role="region"
          aria-live="polite"
          aria-label={`Informe DORA para ${selectedProvider.name}`}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h2 style={{ fontSize: '1.12rem' }}>
              Informe DORA: {selectedProvider.name}
            </h2>
            <DoraRiskBadge riskStatus={selectedProvider.doraRiskStatus} />
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', marginBottom: '14px' }}>
            Contrato <code className="mono">{selectedProvider.contractReference}</code> ({selectedProvider.contractStatus}) · Próxima revisión:{' '}
            <strong className="mono">{selectedProvider.reviewDate}</strong> · Contacto:{' '}
            <span className="mono">{selectedProvider.contactEmail}</span>
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
            Vulnerabilidades Asociadas a Activos del Proveedor ({providerVulns.length})
          </h3>
          <div className="table-container">
            <table className="data-table" aria-label="Vulnerabilidades del proveedor seleccionado">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Título</th>
                  <th scope="col">CVSS</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {providerVulns.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      Sin vulnerabilidades críticas/altas pendientes. Proveedor conforme con SLA DORA.
                    </td>
                  </tr>
                ) : (
                  providerVulns.map((v) => (
                    <tr key={v.id}>
                      <td className="mono">
                        <strong>{v.internalCode}</strong>
                      </td>
                      <td>{v.title}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
