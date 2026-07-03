import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { GitHubUser } from '../types';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/whipping-time/auth/callback`;
const OAUTH_PROXY_URL = import.meta.env.VITE_OAUTH_PROXY_URL || '';
const TOKEN_KEY = 'whipping_time_token';
const RETURN_PATH_KEY = 'whipping_time_return_path';

export interface AuthContextValue {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (returnPath?: string) => void;
  logout: () => void;
  setAuthData: (token: string, user: GitHubUser) => void;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isAuthenticated = token !== null && user !== null;

  // 세션에 토큰이 있으면 유저 정보 복원
  useEffect(() => {
    const savedToken = sessionStorage.getItem(TOKEN_KEY);
    if (savedToken && !user) {
      setIsLoading(true);
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token expired');
          return res.json();
        })
        .then((data) => {
          setUser({ login: data.login, avatarUrl: data.avatar_url, id: data.node_id });
          setToken(savedToken);
        })
        .catch(() => {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback((returnPath?: string) => {
    // basename(/whipping-time/)을 제거한 상대 경로만 저장
    const currentPath = window.location.pathname.replace('/whipping-time', '') || '/';
    sessionStorage.setItem(RETURN_PATH_KEY, returnPath || currentPath);
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'repo read:user',
    });
    window.location.href = `${GITHUB_OAUTH_URL}?${params.toString()}`;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(RETURN_PATH_KEY);
  }, []);

  const setAuthData = useCallback((newToken: string, newUser: GitHubUser) => {
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
    setError(null);
    sessionStorage.setItem(TOKEN_KEY, newToken);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, setAuthData, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export proxy URL for callback page
export const OAUTH_PROXY = OAUTH_PROXY_URL;
