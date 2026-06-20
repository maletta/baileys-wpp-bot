'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, ArrowRight, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { storage } from '@/lib/utils';
import {
  formatPhoneNumberIntl,
  isValidPhoneNumber
} from 'react-phone-number-input';
import { ParticipantWhatsAppPhoneInput } from '@/components/public-participant-auth/ParticipantWhatsAppPhoneInput';
import type { Value as E164PhoneValue } from 'react-phone-number-input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

type Step = 'phone' | 'loading' | 'otp' | 'registration';

export default function PhoneLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phoneE164, setPhoneE164] = useState<E164PhoneValue | undefined>(undefined);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [regToken, setRegToken] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const cellphoneDigits = phoneE164 && isValidPhoneNumber(phoneE164) ? onlyDigits(phoneE164) : null;
  const phoneValid = cellphoneDigits && cellphoneDigits.length >= 10 && cellphoneDigits.length <= 15;
  const otpValid = /^\d{6}$/.test(otp);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback((token: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/phone/register-status/${token}`);
        const data = await res.json();

        if (data.done && data.participantId) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setParticipantId(data.participantId);
          setStep('otp');
          toast({ title: 'Registro concluído!', description: 'Digite o código enviado no seu WhatsApp.' });
        } else if (data.expired) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({ variant: 'destructive', title: 'Token expirou', description: 'Solicite um novo código.' });
          setStep('phone');
        }
      } catch {
        // Silently retry
      }
    }, 3000);
  }, []);

  const handleInitiate = async () => {
    if (!phoneValid || !cellphoneDigits || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/phone/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cellphone: cellphoneDigits })
      });
      const data = await res.json();

      if (data.flow === 'otp') {
        setParticipantId(data.participantId);
        setStep('otp');
        toast({ title: 'Código enviado', description: 'Verifique seu WhatsApp.' });
      } else if (data.flow === 'registration') {
        setRegToken(data.token);
        setWaLink(data.waLink);
        setStep('registration');
        startPolling(data.token);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível conectar ao servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValid || !participantId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/phone/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, otp })
      });
      const data = await res.json();

      if (data.accessToken) {
        storage.set('accessToken', data.accessToken);
        storage.set('user', { id: data.participantId, role: data.role });
        toast({ title: 'Login realizado!' });
        window.location.href = '/dashboard';
      } else {
        toast({ variant: 'destructive', title: 'Código inválido', description: 'Tente novamente.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível verificar o código.' });
    } finally {
      setLoading(false);
    }
  };

  const phoneDisplay = phoneE164 && isValidPhoneNumber(phoneE164)
    ? formatPhoneNumberIntl(phoneE164)
    : cellphoneDigits || '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground mb-2">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Acessar Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Entre com seu número do WhatsApp
          </p>
        </div>

        <Card className="rounded-2xl p-6 shadow-lg space-y-5">
          {step === 'phone' && (
            <>
              <div className="space-y-2" onKeyDown={(e) => { if (e.key === 'Enter' && phoneValid && !loading) handleInitiate(); }}>
                <label className="text-sm font-medium">Número do WhatsApp</label>
                <ParticipantWhatsAppPhoneInput
                  value={phoneE164}
                  onChange={setPhoneE164}
                />
              </div>
              <Button className="w-full" size="lg" loading={loading} disabled={!phoneValid} onClick={handleInitiate}>
                Enviar código
              </Button>
            </>
          )}

          {step === 'registration' && (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                <p className="text-sm">Aguardando confirmação...</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Envie a mensagem abaixo para o bot no WhatsApp
                </p>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#20BD5A] transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Enviar mensagem no WhatsApp
                  </a>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  Token: <code className="bg-muted px-1 py-0.5 rounded text-xs">{regToken}</code>
                </p>
              </div>

              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setStep('phone'); if (pollingRef.current) clearInterval(pollingRef.current); }}>
                Cancelar e tentar outro número
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="space-y-2"
                onKeyDown={(e) => { if (e.key === 'Enter' && otpValid && !loading) handleVerifyOtp(); }}
              >
                <label className="text-sm font-medium">Código de 6 dígitos</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={e => {
                    const newOtp = onlyDigits(e.target.value).slice(0, 6);
                    setOtp(newOtp);
                    // Auto-submit when all 6 digits are typed
                    if (newOtp.length === 6 && participantId && !loading) {
                      setTimeout(() => handleVerifyOtp(), 150);
                    }
                  }}
                  className="text-center text-lg tracking-[0.4em] font-medium tabular-nums"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enviamos para {phoneDisplay}
                </p>
              </div>
              <Button className="w-full" size="lg" loading={loading} disabled={!otpValid} onClick={handleVerifyOtp}>
                Entrar
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setStep('phone')}>
                Alterar número
              </Button>
            </>
          )}
        </Card>

        <div className="text-center">
          <Link href="/login/google" className="text-xs text-muted-foreground hover:text-primary underline">
            Acesso administrativo com Google
          </Link>
        </div>
      </div>
    </div>
  );
}
