import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  googleLogin: (code: string) => Promise<void>;
  getGoogleAuthURL: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (err) {
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setLoading(true);
    try {
      await authService.login(credentials);
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Identifiants incorrects';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setLoading(true);
    try {
      await authService.register(data);
      await login({ username: data.username, password: data.password });
    } catch (err: any) {
      const message =
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        "Erreur lors de l'inscription";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /** Redirect the user to Google's consent screen. */
  const getGoogleAuthURL = async () => {
    setError(null);
    try {
      const url = await authService.getGoogleAuthURL();
      window.location.href = url;
    } catch (err: any) {
      const message =
        err.response?.data?.error || 'Impossible de se connecter avec Google';
      setError(message);
    }
  };

  const googleLogin = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.googleCallback(code);
      setUser(data.user);
    } catch (err: any) {
      const message =
        err.response?.data?.error || 'Erreur de connexion Google';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        googleLogin,
        getGoogleAuthURL,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};