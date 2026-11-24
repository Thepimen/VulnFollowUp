import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { UserRole } from '../types/api';
import type { ThemeMode } from '../hooks/useTheme';
import { SkipLink } from './SkipLink';
import { CommandPaletteModal } from './CommandPaletteModal';
import { BrandLogo } from './BrandLogo';

interface AppShellProps {
  lang: 'es' | 'en';
  onLangToggle: () => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  lang,
  onLangToggle,
  theme,
  onThemeToggle,
  children,
}) => {
  const {
    user,
    activeRole,
    dataMode,
    backendStatus,
    switchDemoRole,
    logout,
    refreshBackendHealth,
  } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const labels = {
    es: {
      dashboard: 'Panel Ejecutivo',
      vulnerabilities: 'Vulnerabilidades',
      assets: 'Activos TIC',
      providers: 'Proveedores DORA',
      login: 'Sesión JWT',
      landing: 'Landing 3D',
      searchPlaceholder: 'Buscar VFU, CVE, proveedor...',
      themeDark: 'Oscuro',
      themeLight: 'Claro',
    },
    en: {
      dashboard: 'Dashboard',
      vulnerabilities: 'Vulnerabilities',
      assets: 'IT Assets',
      providers: 'DORA Providers',
      login: 'JWT Session',
      landing: '3D Landing',
      searchPlaceholder: 'Search VFU, CVE, vendor...',
      themeDark: 'Dark',
      themeLight: 'Light',
    },
  }[lang];

  const handleLogout = () => {
    logout();
    notify(
      'Sesión JWT cerrada',
      'Token Bearer eliminado. Puedes iniciar sesión con otro rol o continuar en Modo Demo.',
      'info'
    );
    navigate('/login');
  };

  const handleHealthRecheck = async () => {
    const status = await refreshBackendHealth();
    notify(
      status === 'online' ? 'Backend Spring Boot conectado' : 'Backend no disponible',
      status === 'online'
        ? 'GET /api/health respondió UP. Ya puedes autenticarte en /login contra PostgreSQL.'
        : 'No se detecta Spring Boot en localhost:8080. Operando en Modo Demo Offline.',
      status === 'online' ? 'success' : 'warning'
    );
  };

  const handleQuickFab = () => {
    if (activeRole === 'VIEWER') {
      notify(
        'Acción bloqueada (VIEWER)',
        'El rol VIEWER tiene acceso de solo lectura. Cambia a ANALYST o ADMIN para registrar CVEs.',
        'warning'
      );
      return;
    }
    navigate('/vulnerabilities?action=new');
  };

  return (
    <>
      <SkipLink />
      <div className="app-layout">
        {/* Desktop Sidebar */}
        <aside className="app-sidebar" aria-label="Navegación principal">
          <div>
            <div className="brand-block">
              <NavLink
                to="/"
                className="brand-title"
                title="Volver a la presentación 3D (Landing)"
              >
                <BrandLogo size={32} variant="default" />
                <span>VulnFollowUp</span>
              </NavLink>
              <p className="brand-subtitle">EU DORA · CVSS v3.1 / v4.0</p>
            </div>

            <nav aria-label="Secciones de la plataforma">
              <ul className="nav-list">
                <li>
                  <NavLink to="/dashboard" className="nav-link">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="9" rx="2" />
                      <rect x="14" y="3" width="7" height="5" rx="2" />
                      <rect x="14" y="12" width="7" height="9" rx="2" />
                      <rect x="3" y="16" width="7" height="5" rx="2" />
                    </svg>
                    <span>{labels.dashboard}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/vulnerabilities" className="nav-link">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>{labels.vulnerabilities}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/assets" className="nav-link">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="2" y="3" width="20" height="7" rx="2" />
                      <rect x="2" y="14" width="20" height="7" rx="2" />
                    </svg>
                    <span>{labels.assets}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/providers" className="nav-link">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{labels.providers}</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/login" className="nav-link">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>{labels.login}</span>
                  </NavLink>
                </li>
              </ul>

              <div className="nav-divider" />

              <ul className="nav-list">
                <li>
                  <NavLink to="/" end className="nav-link">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m12 19-7-7 7-7" />
                      <path d="M19 12H5" />
                    </svg>
                    <span>{labels.landing}</span>
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>

          <div className="sidebar-footer">
            <button
              type="button"
              className={`connectivity-pill connectivity-${backendStatus}`}
              onClick={handleHealthRecheck}
              title="Comprobar GET /api/health en el backend Spring Boot"
            >
              <span className="connectivity-dot" aria-hidden="true" />
              <span>
                {backendStatus === 'online'
                  ? 'API Spring Boot: Activa'
                  : backendStatus === 'checking'
                    ? 'Comprobando API...'
                    : 'Modo Demo Offline'}
              </span>
            </button>
          </div>
        </aside>

        <div className="app-main-wrapper">
          <header className="app-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 260px', minWidth: 0 }}>
              <button
                type="button"
                className="topbar-search-trigger"
                onClick={() => setCmdOpen(true)}
                aria-label="Abrir buscador global y comandos rápidos (Control más K)"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {labels.searchPlaceholder}
                  </span>
                </span>
                <kbd className="kbd-chip">Ctrl K</kbd>
              </button>
            </div>

            <div className="topbar-controls">
              {/* Unified Operator Session & RBAC Role Chip */}
              <div className="operator-chip">
                <span
                  className={`operator-dot ${
                    dataMode === 'live' ? 'operator-dot-live' : 'operator-dot-demo'
                  }`}
                  aria-hidden="true"
                  title={dataMode === 'live' ? 'Sesión JWT activa' : 'Entorno Demo local'}
                />
                <span className="operator-name mono">{user.username}</span>
                {dataMode === 'demo' ? (
                  <select
                    id="rbac-role-select"
                    className="operator-role-select mono"
                    value={activeRole}
                    onChange={(e) => switchDemoRole(e.target.value as UserRole)}
                    aria-label="Cambiar rol RBAC en Modo Demo"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="ANALYST">ANALYST</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                ) : (
                  <>
                    <span className="operator-role-tag mono">{activeRole}</span>
                    <button
                      type="button"
                      className="operator-logout-btn"
                      onClick={handleLogout}
                    >
                      Salir
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                className="btn btn-sm mono"
                onClick={onLangToggle}
                aria-label="Cambiar idioma"
              >
                {lang === 'es' ? 'ES' : 'EN'}
              </button>

              <button
                type="button"
                className="btn btn-sm"
                onClick={onThemeToggle}
                aria-pressed={theme === 'light'}
                aria-label="Cambiar entre tema oscuro y claro"
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

      {/* Native Mobile Floating Bottom Navigation Bar with Central '+' FAB */}
      <nav className="mobile-bottom-dock" aria-label="Navegación móvil rápida">
        <NavLink to="/dashboard" className="mobile-dock-link">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="9" rx="2" />
            <rect x="14" y="3" width="7" height="5" rx="2" />
            <rect x="14" y="12" width="7" height="9" rx="2" />
            <rect x="3" y="16" width="7" height="5" rx="2" />
          </svg>
          <span>Panel</span>
        </NavLink>

        <NavLink to="/vulnerabilities" className="mobile-dock-link">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
          </svg>
          <span>CVEs</span>
        </NavLink>

        <button
          type="button"
          className="mobile-dock-fab"
          onClick={handleQuickFab}
          aria-label="Registrar nueva vulnerabilidad"
          title="Registrar nueva vulnerabilidad"
        >
          +
        </button>

        <NavLink to="/assets" className="mobile-dock-link">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="2" y="3" width="20" height="7" rx="2" />
            <rect x="2" y="14" width="20" height="7" rx="2" />
          </svg>
          <span>Activos</span>
        </NavLink>

        <NavLink to="/providers" className="mobile-dock-link">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>DORA</span>
        </NavLink>
      </nav>

      <CommandPaletteModal
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onToggleTheme={onThemeToggle}
      />
    </>
  );
};
