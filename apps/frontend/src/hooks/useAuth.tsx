"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/utils';
import type { User, AuthResponse } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (googleToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Verificar se há token salvo e validar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = storage.get('accessToken');
        const savedUser = storage.get('user');

        if (token && savedUser) {
          // Verificar se o token ainda é válido fazendo uma requisição para o perfil
          try {
            const profile = await api.getProfile();
            setUser(profile.user);
          } catch (error) {
            // Token inválido, limpar storage
            storage.remove('accessToken');
            storage.remove('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (googleToken: string) => {
    try {
      console.log('userAuth - login - googleToken', googleToken);
      setIsLoading(true);
      const response = await api.googleAuth(googleToken);
      console.log('userAuth - response', response);

      // Salvar dados no storage
      storage.set('accessToken', response.accessToken);
      storage.set('user', response.user);

      setUser(response.user);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Chamar endpoint de logout no backend (limpa cookies)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api'}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Erro ao fazer logout no backend:', error);
      }

      // Limpar storage local
      storage.remove('accessToken');
      storage.remove('user');

      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api'}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        storage.set('accessToken', data.data.accessToken);
      } else {
        // Refresh token inválido, fazer logout
        await logout();
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar em componentes que precisam de autenticação
export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirecionar para login se não estiver autenticado
      window.location.href = '/login';
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}
