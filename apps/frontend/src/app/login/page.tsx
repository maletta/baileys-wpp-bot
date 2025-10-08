'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirecionar se já estiver autenticado
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginSuccess = () => {
    router.push('/dashboard');
  };

  const handleLoginError = (error: string) => {
    console.error('Erro no login:', error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecionando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Baileys
          </h1>
          <p className="text-gray-600">
            Sistema de Gerenciamento de WhatsApp
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Fazer Login
            </CardTitle>
            <CardDescription className="text-center">
              Entre com sua conta Google para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleLoginButton
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />

            <div className="text-center text-sm text-gray-500">
              <p>
                Ao fazer login, você concorda com nossos{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Termos de Serviço
                </a>{' '}
                e{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>
            Precisa de ajuda?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
