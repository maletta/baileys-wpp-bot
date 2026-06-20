'use client';

import { useEffect, useState, use } from 'react';
import { ParticipantPublicOtpForm, type ParticipantPublicOtpFormProps } from '@/components/public-participant-auth/ParticipantPublicOtpForm';
import { GroupHeader } from '@/components/public-participant-auth/GroupHeader';
import { validateFormSlug, clearFormSlugCache, type FormSlugGroupInfo } from '@/lib/publicParticipantAuthApi';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FormularioSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default function FormularioSlugPage({ params }: FormularioSlugPageProps) {
  // Unwrap params with use() since it's a Promise in Next.js 15
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [groupInfo, setGroupInfo] = useState<FormSlugGroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearFormSlugCache();
    let cancelled = false;

    async function loadSlug() {
      setLoading(true);
      setError(null);
      try {
        const response = await validateFormSlug(slug);
        if (cancelled) return;

        if (response.valid && response.group) {
          setGroupInfo(response.group);
        } else {
          setError(response.error || 'Grupo não encontrado');
        }
      } catch {
        if (!cancelled) {
          setError('Erro de conexão. Tente novamente.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSlug();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !groupInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6">
        <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">Link inválido</h1>
          <p className="text-sm text-muted-foreground">
            {error || 'Este link de formulário não é válido ou expirou.'}
          </p>
          <Link href="/login">
            <Button variant="outline">Ir para o login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 pt-10 pb-16">
      <div className="w-full max-w-md space-y-4">
        <GroupHeader group={groupInfo} />
        <ParticipantPublicOtpForm formSlug={slug} />
      </div>
    </div>
  );
}
