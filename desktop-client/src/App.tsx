import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ToastContainer } from './components/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useTheme } from './hooks/useTheme';
import { AssetsPage } from './pages/AssetsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState<'es' | 'en'>('es');

  const wrapWithShell = (content: React.ReactNode) => (
    <AppShell
      lang={lang}
      onLangToggle={() => setLang((prev) => (prev === 'es' ? 'en' : 'es'))}
      theme={theme}
      onThemeToggle={toggleTheme}
    >
      {content}
    </AppShell>
  );

  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={wrapWithShell(<LoginPage />)} />
            <Route path="/dashboard" element={wrapWithShell(<DashboardPage />)} />
            <Route
              path="/vulnerabilities"
              element={wrapWithShell(<VulnerabilitiesPage />)}
            />
            <Route path="/assets" element={wrapWithShell(<AssetsPage />)} />
            <Route path="/providers" element={wrapWithShell(<ProvidersPage />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};
