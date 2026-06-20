"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import { isJwtExpired, isLikelyJwtString } from '@/lib/jwtClient';
import { clearAuthStorage } from '@/lib/authStorage';
import { storage } from '@/lib/utils';
import type { User, AuthResponse } from '@/types/api';

const PROFILE_BOOTSTRAP_TIMEOUT_MS = 8000;

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
        const savedUser = storage.get('user') as User | null;

        // Chaves órfãs (ex.: falha parcial ao gravar) — evita estado inconsistente
        if ((token && !savedUser) || (!token && savedUser)) {
          clearAuthStorage();
          setUser(null);
          return;
        }

        if (!token || !savedUser) {
          return;
        }

        if (!isLikelyJwtString(token) || isJwtExpired(token)) {
          console.warn('Sessão local expirada ou token inválido; limpando cache de auth.');
          clearAuthStorage();
          setUser(null);
          return;
        }

        // Para JWT de phone dashboard (authKind: phone_dashboard), não chama /profile
        // pois não há User correspondente na tabela users — só ParticipantsWpp
        let isPhoneToken = false;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          isPhoneToken = payload.authKind === 'phone_dashboard';
        } catch {
          // Token inválido ou Google JWT padrão
        }

        if (isPhoneToken) {
          // Phone user: usa dados locais sem validar com backend
          setUser(savedUser);
          setIsLoading(false);
          return;
        }

        try {
          const profile = await api.getProfile({ timeoutMs: PROFILE_BOOTSTRAP_TIMEOUT_MS });
          setUser(profile.user);
          storage.set('user', profile.user);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            clearAuthStorage();
            setUser(null);
            return;
          }

          // Backend offline, timeout ou 5xx: mantém sessão local se o JWT ainda não expirou
          const isNetworkOrTimeout =
            axios.isAxiosError(error) &&
            !error.response &&
            (error.code === 'ECONNABORTED' || error.message === 'Network Error');

          const isServerError =
            axios.isAxiosError(error) &&
            error.response &&
            error.response.status >= 500;

          if ((isNetworkOrTimeout || isServerError) && !isJwtExpired(token)) {
            console.warn('Não foi possível validar o perfil no servidor; usando dados em cache.', error);
            setUser(savedUser);
            return;
          }

          console.error('Falha ao validar sessão; limpando cache de auth.', error);
          clearAuthStorage();
          setUser(null);
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
      console.log('userAuth.tsx - response', response);

      // Salvar dados no storage
      storage.set('accessToken', response.accessToken);
      storage.set('user', response.user);

      setUser(response.user);
    } catch (error) {
      console.error('useAuth.tsx - Erro no login:', error);
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

      clearAuthStorage();
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
