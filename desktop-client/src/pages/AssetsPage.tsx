import React from 'react';
import { PHASE1_ASSETS } from '../services/apiClient';
import type { UserRole } from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';

interface AssetsPageProps {
  activeRole: UserRole;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({ activeRole }) => {
  const canCreateAsset = activeRole === 'ADMIN' || activeRole === 'ANALYST';

  return (
    <section aria-labelledby="assets-heading">
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
          <h1 id="assets-heading" style={{ fontSize: '1.55rem', fontWeight: 800 }}>
            Inventario de Activos Tecnológicos (`GET /api/assets`)
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
            Activos vinculados a Proveedores TIC bajo normativa europea DORA (relación 1:N con <code>ict_providers</code> y N:M con <code>vulnerabilities</code>)
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!canCreateAsset}
          title={
            !canCreateAsset
              ? 'Rol VIEWER no autorizado para crear activos (403 Forbidden)'
              : 'Registrar nuevo activo tecnológico'
          }
        >
          + Nuevo Activo Tecnológico
        </button>
      </div>

      <div className="table-container">
        <table className="data-table" aria-label="Inventario de activos tecnológicos">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Nombre del Activo</th>
              <th scope="col">Tipo / Sistema Operativo</th>
              <th scope="col">Criticidad</th>
              <th scope="col">Entorno / IP</th>
              <th scope="col">Proveedor TIC (DORA)</th>
              <th scope="col">CVEs Abiertos</th>
            </tr>
          </thead>
          <tbody>
            {PHASE1_ASSETS.map((asset) => (
              <tr key={asset.id}>
                <td className="mono">
                  <strong>{asset.assetCode}</strong>
                </td>
                <td>
                  <strong>{asset.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    {asset.ownerDepartment}
                  </div>
                </td>
                <td>
                  <span className="mono" style={{ fontSize: '0.8rem' }}>
                    {asset.assetType}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    {asset.operatingSystem}
                  </div>
                </td>
                <td>
                  <SeverityBadge severity={asset.criticality} />
                </td>
                <td className="mono">
                  <div>{asset.environment}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                    {asset.ipAddress}
                  </div>
                </td>
                <td>
                  <strong>{asset.providerName}</strong>
                </td>
                <td className="mono" style={{ fontWeight: 700 }}>
                  {asset.openVulnerabilitiesCount} activos
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
