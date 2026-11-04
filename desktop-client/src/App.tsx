import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useTheme } from './hooks/useTheme';
import { AssetsPage } from './pages/AssetsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import type { UserRole } from './types/api';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');
  const [lang, setLang] = useState<'es' | 'en'>('es');

  return (
    <BrowserRouter>
      <AppShell
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        lang={lang}
        onLangToggle={() => setLang((prev) => (prev === 'es' ? 'en' : 'es'))}
        theme={theme}
        onThemeToggle={toggleTheme}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={<LoginPage onSelectDemoRole={setActiveRole} />}
          />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/vulnerabilities"
            element={<VulnerabilitiesPage activeRole={activeRole} />}
          />
          <Route
            path="/assets"
            element={<AssetsPage activeRole={activeRole} />}
          />
          <Route
            path="/providers"
            element={<ProvidersPage activeRole={activeRole} />}
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
};
