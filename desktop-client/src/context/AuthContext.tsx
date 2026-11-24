import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ApiClientError,
  apiService,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '../services/apiClient';
import { DEMO_USERS } from '../services/demoStore';
import type { UserRole, UserSummaryDTO } from '../types/api';

export type BackendStatus = 'checking' | 'online' | 'offline';
export type DataMode = 'live' | 'demo';

interface AuthContextValue {
  user: UserSummaryDTO;
  activeRole: UserRole;
  isAuthenticatedLive: boolean;
  dataMode: DataMode;
  backendStatus: BackendStatus;
  loginLive: (username: string, password: string) => Promise<UserSummaryDTO>;
  enterDemoMode: (role: UserRole) => void;
  switchDemoRole: (role: UserRole) => void;
  logout: () => void;
  refreshBackendHealth: () => Promise<BackendStatus>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialToken = getStoredToken();
  const initialUser = getStoredUser();

  const [token, setToken] = useState<string | null>(initialToken);
  const [liveUser, setLiveUser] = useState<UserSummaryDTO | null>(
    initialToken && initialUser ? initialUser : null
  );
  const [demoRole, setDemoRole] = useState<UserRole>('ADMIN');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');

  const refreshBackendHealth = useCallback(async (): Promise<BackendStatus> => {
    setBackendStatus('checking');
    try {
      const health = await apiService.checkHealth();
      const nextStatus: BackendStatus =
        health.status === 'UP' ? 'online' : 'offline';
      setBackendStatus(nextStatus);
      return nextStatus;
    } catch {
      setBackendStatus('offline');
      return 'offline';
    }
  }, []);

  useEffect(() => {
    void refreshBackendHealth();
  }, [refreshBackendHealth]);

  const loginLive = useCallback(
    async (username: string, password: string): Promise<UserSummaryDTO> => {
      try {
        const res = await apiService.login({ username, password });
        const resolvedUser: UserSummaryDTO = res.user ?? {
          id: res.userId ?? 0,
          username: res.username ?? username,
          email: `${username}@vulnfollowup.eu`,
          fullName: res.username ?? username,
          role: res.role ?? 'VIEWER',
        };
        setStoredToken(res.accessToken);
        setStoredUser(resolvedUser);
        setToken(res.accessToken);
        setLiveUser(resolvedUser);
        setBackendStatus('online');
        return resolvedUser;
      } catch (err) {
        if (err instanceof ApiClientError && err.isNetworkError) {
          setBackendStatus('offline');
        }
        throw err;
      }
    },
    []
  );

  const enterDemoMode = useCallback((role: UserRole) => {
    setStoredToken(null);
    setStoredUser(null);
    setToken(null);
    setLiveUser(null);
    setDemoRole(role);
  }, []);

  const switchDemoRole = useCallback((role: UserRole) => {
    setDemoRole(role);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredUser(null);
    setToken(null);
    setLiveUser(null);
  }, []);

  const isAuthenticatedLive = Boolean(token && liveUser);
  const dataMode: DataMode = isAuthenticatedLive ? 'live' : 'demo';
  const user: UserSummaryDTO = useMemo(
    () => (liveUser ? liveUser : DEMO_USERS[demoRole]),
    [liveUser, demoRole]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeRole: user.role,
      isAuthenticatedLive,
      dataMode,
      backendStatus,
      loginLive,
      enterDemoMode,
      switchDemoRole,
      logout,
      refreshBackendHealth,
    }),
    [
      user,
      isAuthenticatedLive,
      dataMode,
      backendStatus,
      loginLive,
      enterDemoMode,
      switchDemoRole,
      logout,
      refreshBackendHealth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de <AuthProvider>');
  }
  return ctx;
}
