import React from 'react';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../types/api';
import type { ThemeMode } from '../hooks/useTheme';
import { SkipLink } from './SkipLink';

interface AppShellProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  lang: 'es' | 'en';
  onLangToggle: () => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeRole,
  onRoleChange,
  lang,
  onLangToggle,
  theme,
  onThemeToggle,
  children,
}) => {
  const labels = {
    es: {
      dashboard: 'Panel Ejecutivo DORA',
      vulnerabilities: 'Vulnerabilidades (CVSS)',
      assets: 'Inventario de Activos',
      providers: 'Proveedores TIC (DORA)',
      login: 'Acceso / Sesión JWT',
      roleLabel: 'Rol RBAC Activo:',
      themeDark: 'Modo Oscuro (OLED)',
      themeLight: 'Modo Claro (Papel)',
    },
    en: {
      dashboard: 'Executive DORA Dashboard',
      vulnerabilities: 'Vulnerabilities (CVSS)',
      assets: 'Technological Assets',
      providers: 'ICT Providers (DORA)',
      login: 'Auth / JWT Session',
      roleLabel: 'Active RBAC Role:',
      themeDark: 'Dark Mode (OLED)',
      themeLight: 'Light Mode (Paper)',
    },
  }[lang];

  return (
    <>
      <SkipLink />
      <div className="app-layout">
        <aside className="app-sidebar" aria-label="Sidebar Governance Navigation">
          <div>
            <div className="brand-block">
              <div className="brand-title">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>VulnFollowUp</span>
              </div>
              <p className="brand-subtitle mono">
                EU DORA Chap. V · CVSS v3.1/v4.0
              </p>
            </div>

            <nav aria-label={lang === 'es' ? 'Navegación principal' : 'Primary navigation'}>
              <ul className="nav-list">
                <li>
                  <NavLink to="/dashboard" className="nav-link">
                    <span>{labels.dashboard}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/vulnerabilities" className="nav-link">
                    <span>{labels.vulnerabilities}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/assets" className="nav-link">
                    <span>{labels.assets}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/providers" className="nav-link">
                    <span>{labels.providers}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/login" className="nav-link">
                    <span>{labels.login}</span>
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--ink-muted)',
            }}
          >
            <p className="mono">WCAG 2.1 Level AA Verified</p>
            <p style={{ marginTop: '4px' }}>
              Green Software · Paginated REST API
            </p>
          </div>
        </aside>

        <div className="app-main-wrapper">
          <header className="app-topbar">
            <div>
              <span
                className="mono"
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--ink-secondary)',
                  fontWeight: 600,
                }}
              >
                {lang === 'es'
                  ? 'Plataforma Defensiva de Gestión de Vulnerabilidades y Riesgo de Proveedores TIC'
                  : 'Defensive Vulnerability & ICT Third-Party Risk Management Platform'}
              </span>
            </div>

            <div className="topbar-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="rbac-role-select" className="form-label">
                  {labels.roleLabel}
                </label>
                <select
                  id="rbac-role-select"
                  className="form-select mono"
                  value={activeRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  aria-label="Simulate RBAC Role for Phase 1 Wireframe Review"
                >
                  <option value="ADMIN">ADMIN (Full Control)</option>
                  <option value="ANALYST">ANALYST (Triage & SLA)</option>
                  <option value="VIEWER">VIEWER (Read-Only Audit)</option>
                </select>
              </div>

              <button
                type="button"
                className="btn mono"
                onClick={onLangToggle}
                aria-label="Switch Interface Language between Spanish and English"
              >
                {lang === 'es' ? 'ES · Español' : 'EN · English'}
              </button>

              <button
                type="button"
                className="btn"
                onClick={onThemeToggle}
                aria-pressed={theme === 'light'}
                aria-label="Toggle High-Contrast Dark and Light Theme"
              >
                {theme === 'dark' ? labels.themeDark : labels.themeLight}
              </button>
            </div>
          </header>

          <main id="main-content" className="app-main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
};
