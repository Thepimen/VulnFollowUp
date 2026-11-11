import React from 'react';
import type { CvssSeverity } from '../types/api';

interface SeverityBadgeProps {
  severity: CvssSeverity;
  score?: number;
  version?: '3.1' | '4.0';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  score,
  version,
}) => {
  const renderIcon = () => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
            <path d="M8 1L15 8L8 15L1 8Z" />
          </svg>
        );
      case 'HIGH':
        return (
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
            <path d="M8 1.5L15 14.5H1L8 1.5Z" />
          </svg>
        );
      case 'MEDIUM':
        return (
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
            <rect x="2.5" y="2.5" width="11" height="11" />
          </svg>
        );
      case 'LOW':
        return (
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
            <circle cx="8" cy="8" r="5.5" />
          </svg>
        );
      default:
        return (
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8" cy="8" r="5" />
          </svg>
        );
    }
  };

  const formattedScore = score !== undefined ? score.toFixed(1) : null;
  const ariaDescription = `Severidad ${severity}${
    formattedScore ? `, puntuación CVSS ${version ?? ''} ${formattedScore}` : ''
  }`;

  return (
    <span
      className={`badge badge-sev-${severity}`}
      role="status"
      aria-label={ariaDescription}
    >
      {renderIcon()}
      <span>{severity}</span>
      {formattedScore && <span className="mono">{formattedScore}</span>}
    </span>
  );
};
