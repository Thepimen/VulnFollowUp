import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiClient';
import { demoStore } from '../services/demoStore';
import type { IctProviderDTO, VulnerabilitySummaryDTO } from '../types/api';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
}

interface PaletteEntry {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onToggleTheme,
}) => {
  const { dataMode, activeRole } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [vulns, setVulns] = useState<VulnerabilitySummaryDTO[]>([]);
  const [providers, setProviders] = useState<IctProviderDTO[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIdx(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);

    const loadIndex = async () => {
      try {
        if (dataMode === 'live') {
          const [vRes, pRes] = await Promise.all([
            apiService.getVulnerabilities({ page: 0, size: 30 }),
            apiService.getProviders(),
          ]);
          setVulns(vRes.content);
          setProviders(pRes);
        } else {
          setVulns(demoStore.getVulnerabilities({ page: 0, size: 30 }).content);
          setProviders(demoStore.getProviders());
        }
      } catch {
        setVulns(demoStore.getVulnerabilities({ page: 0, size: 30 }).content);
        setProviders(demoStore.getProviders());
      }
    };
    void loadIndex();
  }, [isOpen, dataMode]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const canWrite = activeRole === 'ADMIN' || activeRole === 'ANALYST';

    const quickActions: PaletteEntry[] = [
      {
        id: 'act-dashboard',
        title: 'Ir al Panel Ejecutivo DORA',
        subtitle: 'KPIs, gráfico de distribución CVSS y agenda SLA',
        kind: 'Vista',
        action: () => navigate('/dashboard'),
      },
      {
        id: 'act-vulns',
        title: 'Abrir Registro de Vulnerabilidades',
        subtitle: 'Listado paginado CVSS v3.1 y v4.0 con filtros',
        kind: 'Vista',
        action: () => navigate('/vulnerabilities'),
      },
      ...(canWrite
        ? [
            {
              id: 'act-new-cve',
              title: 'Registrar nueva vulnerabilidad CVSS',
              subtitle: 'Abrir formulario con validación en vivo y activos N:M',
              kind: 'Acción',
              action: () => navigate('/vulnerabilities?action=new'),
            },
            {
              id: 'act-import-acid',
              title: 'Probar Importación JSON / Rollback ACID',
              subtitle: 'Validar lote oficial de 4 registros con transacción atómica',
              kind: 'Acción',
              action: () => navigate('/vulnerabilities?action=import'),
            },
          ]
        : []),
      {
        id: 'act-providers',
        title: 'Auditar Proveedores TIC (Módulo SGE · DORA)',
        subtitle: 'Semáforo de riesgo y reporte contractual HostingSur S.L.',
        kind: 'Vista',
        action: () => navigate('/providers'),
      },
      {
        id: 'act-assets',
        title: 'Consultar Inventario de Activos Tecnológicos',
        subtitle: 'Activos vinculados 1:N con proveedores TIC',
        kind: 'Vista',
        action: () => navigate('/assets'),
      },
      {
        id: 'act-theme',
        title: 'Cambiar tema visual (Oscuro / Claro)',
        subtitle: 'Alternar entre modo Obsidiana y modo Claro WCAG 2.1 AA',
        kind: 'Preferencia',
        action: () => onToggleTheme(),
      },
      {
        id: 'act-landing',
        title: 'Volver a la Landing 3D de presentación',
        subtitle: 'Malla geodésica 3D, Prisma CVSS y Bóveda Isométrica',
        kind: 'Presentación',
        action: () => navigate('/'),
      },
    ];

    const vulnEntries: PaletteEntry[] = vulns.map((v) => ({
      id: `vuln-${v.id}`,
      title: `${v.internalCode} · ${v.title}`,
      subtitle: `${v.cveId ?? 'Sin CVE'} · CVSS ${v.cvssScore.toFixed(1)} (${v.severity}) · ${v.status}`,
      kind: 'CVE',
      action: () => navigate(`/vulnerabilities?search=${encodeURIComponent(v.internalCode)}`),
    }));

    const providerEntries: PaletteEntry[] = providers.map((p) => ({
      id: `prov-${p.id}`,
      title: `${p.providerCode} · ${p.name}`,
      subtitle: `DORA: ${p.doraRiskStatus} · Revisión ${p.reviewDate} · SLA ${p.slaAvailabilityPct}%`,
      kind: 'Proveedor',
      action: () => navigate('/providers'),
    }));

    const all = [...quickActions, ...vulnEntries, ...providerEntries];
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 9);

    return all
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.kind.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, vulns, providers, activeRole, navigate, onToggleTheme]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  if (!isOpen) return null;

  const executeEntry = (entry: PaletteEntry | undefined) => {
    if (!entry) return;
    entry.action();
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cmd-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Buscador global y paleta de comandos"
      >
        <div className="cmd-input-row">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden="true"
            style={{ color: 'var(--ink-muted)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            className="cmd-input"
            placeholder="Buscar VFU-0012, HostingSur, CVE o acción rápida..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx((i) => Math.min(entries.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                executeEntry(entries[activeIdx]);
              }
            }}
          />
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Esc
          </button>
        </div>

        <div className="cmd-results" role="listbox" aria-label="Resultados de búsqueda">
          {entries.length === 0 ? (
            <div style={{ padding: '18px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
              No se encontraron coincidencias para «{query}».
            </div>
          ) : (
            entries.map((entry, idx) => (
              <button
                key={entry.id}
                type="button"
                role="option"
                aria-selected={idx === activeIdx}
                className={`cmd-item ${idx === activeIdx ? 'cmd-item-active' : ''}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => executeEntry(entry)}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{entry.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                    {entry.subtitle}
                  </div>
                </div>
                <span className="cmd-item-kind">{entry.kind}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
