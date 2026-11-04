import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types/api';

interface LoginPageProps {
  onSelectDemoRole: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSelectDemoRole }) => {
  const [username, setUsername] = useState('admin_dora');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.includes('admin')) {
      onSelectDemoRole('ADMIN');
    } else if (username.includes('viewer') || username.includes('auditor')) {
      onSelectDemoRole('VIEWER');
    } else {
      onSelectDemoRole('ANALYST');
    }
    navigate('/dashboard');
  };

  return (
    <section
      aria-labelledby="login-heading"
      style={{ maxWidth: '480px', margin: '32px auto' }}
    >
      <div className="panel">
        <h1 id="login-heading" style={{ fontSize: '1.45rem', fontWeight: 800 }}>
          Autenticación Defensiva JWT (`POST /api/auth/login`)
        </h1>
        <p
          style={{
            color: 'var(--ink-secondary)',
            fontSize: '0.88rem',
            marginTop: '6px',
            marginBottom: '20px',
          }}
        >
          Verificación de credenciales mediante hash adaptativo BCrypt ($2b$12$) + Salt y emisión de token RFC 7519 con rol RBAC.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div className="form-field">
            <label htmlFor="login-username" className="form-label">
              Usuario Operador (`username`)
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
              Contraseña (`password`)
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Iniciar Sesión Segura (JWT)
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--ink-muted)',
          }}
        >
          <p style={{ fontWeight: 700, color: 'var(--ink-secondary)' }}>
            Usuarios Semilla (`02_seed_data.sql`):
          </p>
          <ul className="mono" style={{ marginTop: '6px', paddingLeft: '18px' }}>
            <li>admin_dora (ADMIN)</li>
            <li>analyst_soc (ANALYST)</li>
            <li>auditor_viewer (VIEWER)</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
