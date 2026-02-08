import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi } from '../services/authApi';
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  setAuthData,
  clearAll,
} from '../utils/authStorage';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedAccessToken = getAccessToken();
    const storedRefreshToken = getRefreshToken();
    const storedUser = getUser();

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    const response = await authApi.login(request);
    setAuthData(response);
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setUser(response.user);
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await authApi.register(request);
    setAuthData(response);
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const currentRefreshToken = getRefreshToken();
      if (currentRefreshToken) {
        await authApi.logout(currentRefreshToken);
      }
    } catch (error) {
      // Ignore logout errors - we'll clear local state anyway
      console.warn('Logout API call failed:', error);
    } finally {
      clearAll();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  }, []);

  const isAuthenticated = useMemo(
    () => !!accessToken && !!user,
    [accessToken, user]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, accessToken, refreshToken, isAuthenticated, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
