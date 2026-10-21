import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aicte_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aicte_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!localStorage.getItem('aicte_token')) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await api.get<User>('/auth/me');
      setUser(u);
      localStorage.setItem('aicte_user', JSON.stringify(u));
    } catch {
      setUser(null);
      localStorage.removeItem('aicte_token');
      localStorage.removeItem('aicte_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('aicte_token', data.access_token);
    setToken(data.access_token);
    const u: User = {
      id: 0, // will be refreshed by /auth/me
      name: data.name,
      email: data.email,
      role: data.role,
      institution_id: data.institution_id,
      institution_name: data.institution_name,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setUser(u);
    localStorage.setItem('aicte_user', JSON.stringify(u));
    await refreshUser();
  };

  const loginAsDemo = async (targetRole: UserRole) => {
    let email = 'college@demo.aicte.gov.in';
    if (targetRole === 'AICTE_OFFICER') email = 'officer@demo.aicte.gov.in';
    if (targetRole === 'ADMIN') email = 'admin@demo.aicte.gov.in';

    await login(email, 'Demo@12345');
  };

  const logout = () => {
    localStorage.removeItem('aicte_token');
    localStorage.removeItem('aicte_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        token,
        isLoading,
        login,
        loginAsDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
