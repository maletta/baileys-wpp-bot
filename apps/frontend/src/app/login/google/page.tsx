import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function GoogleLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Acesso administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Apenas administradores autorizados com conta Google
          </p>
        </div>

        <GoogleLoginButton />
      </div>
    </div>
  );
}
