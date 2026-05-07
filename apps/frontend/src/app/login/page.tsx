'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  MessageSquare,
  Shield,
  Zap,
  Users,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="text-lg font-medium text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="text-lg font-medium text-muted-foreground">Redirecionando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-accent to-primary/80 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-16 animate-fade-in-left">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Baileys</h1>
              <p className="text-white/80 text-sm">Sistema de Gerenciamento</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8 animate-fade-in-left" style={{ animationDelay: '0.2s' }}>
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Gerencie seu WhatsApp de forma profissional
              </h2>
              <p className="text-white/90 text-lg">
                Conecte, gerencie grupos e envie mensagens com segurança e eficiência.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in-left" style={{ animationDelay: '0.4s' }}>
              <FeatureItem
                icon={<Shield className="h-5 w-5" />}
                title="Seguro e Confiável"
                description="Autenticação via Google OAuth 2.0"
              />
              <FeatureItem
                icon={<Zap className="h-5 w-5" />}
                title="Rápido e Eficiente"
                description="Interface moderna e responsiva"
              />
              <FeatureItem
                icon={<Users className="h-5 w-5" />}
                title="Gerenciamento de Grupos"
                description="Controle total sobre seus grupos"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            © 2024 WhatsApp Baileys. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in-right">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8 animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Baileys</h1>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-2 animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight">Bem-vindo de volta!</h2>
            <p className="text-muted-foreground">
              Entre com sua conta Google para acessar o sistema
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card border rounded-2xl p-8 shadow-lg space-y-6 animate-scale-in hover:shadow-xl transition-shadow duration-300" style={{ animationDelay: '0.2s' }}>
            <GoogleLoginButton
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Acesso seguro via Google
                </span>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-success" />
              <span>Conexão criptografada e segura</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm font-medium text-center text-muted-foreground">
              Por que usar o WhatsApp Baileys?
            </p>
            <div className="grid grid-cols-1 gap-2">
              <BenefitItem text="Gerencie múltiplas conexões WhatsApp" />
              <BenefitItem text="Envie mensagens para grupos e contatos" />
              <BenefitItem text="Interface intuitiva e moderna" />
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground px-8">
            Ao fazer login, você concorda com nossos{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Política de Privacidade
            </a>
          </p>

          {/* Help Link */}
          <p className="text-center text-sm text-muted-foreground">
            Participante do grupo?{' '}
            <Link href="/formulario" className="text-primary hover:underline font-medium">
              Acesso ao formulário
            </Link>
            {' · '}
            Precisa de ajuda?{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/80">{description}</p>
      </div>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}
