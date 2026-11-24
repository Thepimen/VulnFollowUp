import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  AssetDTO,
  IctProviderDTO,
  VulnerabilitySummaryDTO,
} from '../types/api';
import { DoraRiskBadge } from './StatusBadge';

interface DoraBlastRadiusCardProps {
  providersAtRisk: IctProviderDTO[];
  allAssets: AssetDTO[];
  allVulns: VulnerabilitySummaryDTO[];
  onInspectVulnerability: (vulnId: number) => void;
}

const FlowConnectorSvg: React.FC<{ alert?: boolean }> = ({ alert = false }) => (
  <svg
    className="flow-connector-svg"
    width="42"
    height="16"
    viewBox="0 0 42 16"
    fill="none"
    aria-hidden="true"
  >
    <line
      x1="2"
      y1="8"
      x2="34"
      y2="8"
      stroke="var(--border-strong)"
      strokeWidth="1.5"
      strokeDasharray="3 3"
    />
    <line
      className="flow-connector-pulse"
      x1="2"
      y1="8"
      x2="34"
      y2="8"
      stroke={alert ? '#FB7185' : '#00D3FB'}
      strokeWidth="2"
      strokeDasharray="8 26"
    />
    <path
      d="M31 4.5L36.5 8L31 11.5"
      stroke={alert ? '#FB7185' : '#00D3FB'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DoraBlastRadiusCard: React.FC<DoraBlastRadiusCardProps> = ({
  providersAtRisk,
  allAssets,
  allVulns,
  onInspectVulnerability,
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(
    providersAtRisk[0]?.id ?? null
  );

  useEffect(() => {
    if (providersAtRisk.length === 0) {
      setSelectedProviderId(null);
      return;
    }
    if (!providersAtRisk.some((p) => p.id === selectedProviderId)) {
      const preferred =
        providersAtRisk.find((p) => p.providerCode === 'PROV-005') ??
        providersAtRisk[0];
      setSelectedProviderId(preferred.id);
    }
  }, [providersAtRisk, selectedProviderId]);

  const activeProvider = useMemo(
    () =>
      providersAtRisk.find((p) => p.id === selectedProviderId) ??
      providersAtRisk[0] ??
      null,
    [providersAtRisk, selectedProviderId]
  );

  const providerAssets = useMemo(() => {
    if (!activeProvider) return [];
    return allAssets
      .filter((a) => a.providerId === activeProvider.id)
      .sort((a, b) => (b.openVulnerabilitiesCount ?? 0) - (a.openVulnerabilitiesCount ?? 0));
  }, [activeProvider, allAssets]);

  const providerTopVuln = useMemo(() => {
    if (!activeProvider) return null;
    const activeStatuses = new Set(['ABIERTA', 'PENDIENTE DE REMEDIACIÓN']);
    const matching = allVulns
      .filter(
        (v) =>
          activeStatuses.has(v.status) &&
          v.primaryProviderName === activeProvider.name
      )
      .sort((a, b) => b.cvssScore - a.cvssScore);
    return matching[0] ?? null;
  }, [activeProvider, allVulns]);

  if (!activeProvider) {
    return (
      <div
        className="dora-trace-card dora-trace-compliant"
        role="region"
        aria-label="Estado de cadena de suministro DORA"
      >
        <div className="dora-trace-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DoraRiskBadge riskStatus="COMPLIANT" />
            <strong style={{ fontSize: '0.9rem' }}>
              Cadena de suministro TIC sin brechas HIGH/CRITICAL abiertas
            </strong>
          </div>
          <Link to="/providers" className="btn btn-sm">
            Ver cartera DORA
          </Link>
        </div>
      </div>
    );
  }

  const primaryAsset = providerAssets[0] ?? null;

  return (
    <div
      className="dora-trace-card"
      role="region"
      aria-label="Selector interactivo de radio de explosión DORA por proveedor"
    >
      <div className="dora-trace-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DoraRiskBadge riskStatus={activeProvider.doraRiskStatus} />
          <strong style={{ fontSize: '0.92rem' }}>Radio de explosión DORA</strong>
          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
            {providersAtRisk.length} proveedor(es) en riesgo
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {providerTopVuln && (
            <button
              type="button"
              className="btn btn-sm btn-sapphire"
              onClick={() => onInspectVulnerability(providerTopVuln.id)}
            >
              Inspeccionar {providerTopVuln.internalCode}
            </button>
          )}
          <Link to="/providers" className="btn btn-sm">
            Informe DORA
          </Link>
        </div>
      </div>

      {/* Dedicated Multi-Provider Switcher Bar */}
      <div
        className="blast-provider-tabs"
        role="tablist"
        aria-label="Proveedores TIC en riesgo"
      >
        {providersAtRisk.map((prov) => {
          const isSelected = prov.id === activeProvider.id;
          const shortName = prov.name.split(' ').slice(0, 2).join(' ');
          return (
            <button
              key={prov.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`blast-tab-btn ${isSelected ? 'blast-tab-active' : ''}`}
              onClick={() => setSelectedProviderId(prov.id)}
            >
              <span className="blast-tab-dot" aria-hidden="true" />
              <span>{shortName}</span>
              <span className="mono blast-tab-count">
                {prov.activeCriticalHighVulnsCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3-Node Supply-Chain Flow with Animated SVG Connectors */}
      <div className="dora-trace-chain">
        <Link to="/providers" className="dora-node">
          <span className="dora-node-tag">1 · Proveedor TIC</span>
          <span className="dora-node-title">{activeProvider.name}</span>
          <span className="dora-node-sub">
            {activeProvider.providerCode} · Rev. {activeProvider.reviewDate} · SLA{' '}
            {activeProvider.slaAvailabilityPct}%
          </span>
        </Link>

        <FlowConnectorSvg />

        <Link to="/assets" className="dora-node">
          <span className="dora-node-tag">
            2 · {providerAssets.length > 1 ? `Activos (${providerAssets.length})` : 'Activo expuesto'}
          </span>
          <span className="dora-node-title">
            {primaryAsset
              ? primaryAsset.name
              : `${activeProvider.managedAssetsCount} activos gestionados`}
          </span>
          <span className="dora-node-sub">
            {primaryAsset
              ? `${primaryAsset.assetCode} · ${primaryAsset.environment}${
                  providerAssets.length > 1 ? ` (+${providerAssets.length - 1} más)` : ''
                }`
              : activeProvider.providedService}
          </span>
        </Link>

        <FlowConnectorSvg alert />

        {providerTopVuln ? (
          <button
            type="button"
            className="dora-node dora-node-alert"
            onClick={() => onInspectVulnerability(providerTopVuln.id)}
          >
            <span className="dora-node-tag" style={{ color: 'var(--brand-jade)' }}>
              3 · Brecha principal · abrir inspector
            </span>
            <span className="dora-node-title">
              {providerTopVuln.internalCode} · CVSS {providerTopVuln.cvssScore.toFixed(1)}
            </span>
            <span className="dora-node-sub">
              {providerTopVuln.cveId ?? providerTopVuln.severity} · {providerTopVuln.status}
            </span>
          </button>
        ) : (
          <div className="dora-node">
            <span className="dora-node-tag">3 · Exposición</span>
            <span className="dora-node-title">
              {activeProvider.activeCriticalHighVulnsCount} brecha(s) activa(s)
            </span>
            <span className="dora-node-sub">Revisar detalle en Proveedores</span>
          </div>
        )}
      </div>
    </div>
  );
};
