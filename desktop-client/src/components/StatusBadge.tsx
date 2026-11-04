import React from 'react';
import type { DoraRiskStatus, VulnerabilityStatus } from '../types/api';

interface StatusBadgeProps {
  status: VulnerabilityStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'ABIERTA':
        return {
          className: 'badge badge-status-open',
          icon: (
            <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a1 1 0 0 1 1 1v3.5a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1zm0 8a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 8 12z" />
            </svg>
          ),
        };
      case 'PENDIENTE DE REMEDIACIÓN':
        return {
          className: 'badge badge-status-pending',
          icon: (
            <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 3.5v3.69l2.53 1.52-.76 1.28L7.25 9V4.5h1.5z" />
            </svg>
          ),
        };
      case 'RESUELTA':
        return {
          className: 'badge badge-status-resolved',
          icon: (
            <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
            </svg>
          ),
        };
      case 'CERRADA':
      default:
        return {
          className: 'badge badge-status-closed',
          icon: (
            <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
              <path d="M4 6V4a4 4 0 1 1 8 0v2h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1zm2-2v2h4V4a2 2 0 1 0-4 0z" />
            </svg>
          ),
        };
    }
  };

  const { className, icon } = getVariant();

  return (
    <span className={className} role="status" aria-label={`Estado: ${status}`}>
      {icon}
      <span>{status}</span>
    </span>
  );
};

interface DoraRiskBadgeProps {
  riskStatus: DoraRiskStatus;
}

export const DoraRiskBadge: React.FC<DoraRiskBadgeProps> = ({ riskStatus }) => {
  const isAtRisk = riskStatus === 'AT_RISK';
  return (
    <span
      className={`badge ${isAtRisk ? 'badge-sev-CRITICAL' : 'badge-status-closed'}`}
      role="status"
      aria-label={`Estado DORA del proveedor: ${isAtRisk ? 'EN RIESGO (AT_RISK)' : 'CONFORME (COMPLIANT)'}`}
    >
      {isAtRisk ? (
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
          <path d="M8 1.5L15 14.5H1L8 1.5Z" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
          <circle cx="8" cy="8" r="5.5" />
        </svg>
      )}
      <span>{isAtRisk ? 'EN RIESGO · AT_RISK' : 'CONFORME · COMPLIANT'}</span>
    </span>
  );
};
