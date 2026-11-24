import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, ApiClientError } from '../services/apiClient';
import type { UserRole } from '../types/api';

const SEED_ACCOUNTS: Array<{
  username: string;
  role: UserRole;
  description: string;
}> = [
  {
    username: 'admin_dora',
    role: 'ADMIN',
    description: 'Control total: proveedores DORA, cierre CERRADA y borrado de registros.',
  },
  {
    username: 'analyst_soc',
    role: 'ANALYST',
    description: 'Triaje CVSS v3.1/v4.0, alta de activos/CVEs, importación ACID y exportación.',
  },
  {
    username: 'auditor_viewer',
    role: 'VIEWER',
    description: 'Consulta de solo lectura y auditoría DORA (escritura bloqueada con 403).',
  },
];

export const LoginPage: React.FC = () => {
  const {
    user,
    dataMode,
    backendStatus,
    loginLive,
    enterDemoMode,
    logout,
    refreshBackendHealth,
  } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin_dora');
  const [password, setPassword] = useState('VulnFollowUp2026!');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const loggedUser = await loginLive(username.trim(), password);
      notify(
        'Autenticación JWT correcta',
        `Sesión activa como ${loggedUser.username} (${loggedUser.role}) contra ${API_BASE_URL}.`,
        'success'
      );
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError && err.isNetworkError) {
        setErrorMessage(
          `El backend Spring Boot no responde en ${API_BASE_URL}. Arranca 'mvn spring-boot:run' o selecciona un perfil en Modo Demo Offline.`
        );
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Credenciales inválidas (401 Unauthorized).'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterDemo = (role: UserRole) => {
    enterDemoMode(role);
    notify(
      `Modo Demo Offline activado (${role})`,
      'Todos los formularios, validaciones CVSS, ciclo de vida, rollback y exportaciones están operativos en memoria local.',
      'info'
    );
    navigate('/dashboard');
  };

  return (
    <section aria-labelledby="login-heading">
      <div className="page-header">
        <div>
          <h1 id="login-heading" className="page-title">
            Sesión JWT
          </h1>
          <p className="page-subtitle">
            Acceso con Bearer JWT (HS256) contra Spring Boot o simulación RBAC local
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void refreshBackendHealth()}
          >
            Estado API: <strong className="mono">{backendStatus.toUpperCase()}</strong>
          </button>
        </div>
      </div>

      <div className="login-split-grid">
        {/* Left Card: Live JWT Form */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div className="panel-header-bar">
              <h2 className="panel-title">Iniciar sesión contra Spring Boot</h2>
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                {API_BASE_URL}
              </span>
            </div>

            {dataMode === 'live' && (
              <div
                className="inline-alert inline-alert-success"
                role="status"
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  Sesión Live activa: <strong className="mono">{user.username}</strong> ({user.role})
                </span>
                <button type="button" className="btn btn-sm" onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                className="inline-alert inline-alert-error"
                role="alert"
                style={{ marginBottom: '16px' }}
              >
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleLiveSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div className="form-field">
                <label htmlFor="login-username" className="form-label">
                  Usuario operador
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="form-input mono"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="login-password" className="form-label">
                  Contraseña
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  required
                  autoComplete="current-password"
                  placeholder="Contraseña verificada con BCrypt"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '100%', minHeight: '44px' }}
              >
                {submitting ? 'Verificando credenciales...' : 'Iniciar sesión segura (JWT)'}
              </button>
            </form>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '3px solid var(--brand-jade)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink-primary)' }}>
              Control stateless RFC 7519
            </div>
            <p style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--ink-muted)' }}>
              Validación de firma HS256, BCrypt (coste 12) y matriz de permisos 401/403 por rol.
            </p>
          </div>
        </div>

        {/* Right Card: Seed Accounts & Demo Switcher */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '18px' }}>
          <div>
            <div className="panel-header-bar">
              <h2 className="panel-title">Cuentas semilla y Modo Demo</h2>
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                02_seed_data.sql
              </span>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--ink-secondary)', marginBottom: '16px' }}>
              Rellena el acceso JWT con un clic o entra directamente en{' '}
              <strong>Modo Demo Offline</strong> para probar toda la interfaz sin levantar el backend:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SEED_ACCOUNTS.map((acc) => (
                <div key={acc.username} className="seed-account-row">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      <span className="mono">{acc.username}</span>{' '}
                      <span style={{ color: 'var(--brand-ocean)', fontSize: '0.78rem' }}>
                        · {acc.role}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
                      {acc.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setUsername(acc.username);
                        setErrorMessage(null);
                      }}
                    >
                      Rellenar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-sapphire"
                      onClick={() => handleEnterDemo(acc.role)}
                    >
                      Demo {acc.role}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--ink-muted)',
            }}
          >
            Arranque backend local:{' '}
            <code className="mono" style={{ color: 'var(--ink-primary)' }}>
              cd backend &amp;&amp; mvn spring-boot:run
            </code>
          </div>
        </div>
      </div>
    </section>
  );
};
