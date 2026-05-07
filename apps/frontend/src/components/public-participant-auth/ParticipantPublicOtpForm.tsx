'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useSecondsCountdown } from '@/hooks/useSecondsCountdown';
import { formatClockSeconds } from '@/lib/formatCountdown';
import {
  getResend429RetryAfter,
  getParticipantPortalSession,
  postRequestOtp,
  postResendOtp,
  postVerifyOtp
} from '@/lib/publicParticipantAuthApi';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  formatPhoneNumberIntl,
  isValidPhoneNumber
} from 'react-phone-number-input';
import type { Value as E164PhoneValue } from 'react-phone-number-input';
import { ParticipantPortalFormStep } from '@/components/public-participant-auth/ParticipantPortalFormStep';
import { ParticipantWhatsAppPhoneInput } from '@/components/public-participant-auth/ParticipantWhatsAppPhoneInput';

const AUTH = {
  context: 'PUBLIC_FORM' as const,
  type: 'AUTHORIZE_PARTICIPANT' as const
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

type Step = 'phone' | 'otp' | 'form';

export function ParticipantPublicOtpForm() {
  const [sessionReady, setSessionReady] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [phoneE164, setPhoneE164] = useState<E164PhoneValue | undefined>(undefined);
  const [otp, setOtp] = useState('');
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? sessionStorage.getItem('participantAccessToken') : null;
    if (!t) {
      setSessionReady(true);
      return;
    }
    getParticipantPortalSession(t)
      .then(() => {
        setPortalToken(t);
        setStep('form');
      })
      .catch(() => {
        sessionStorage.removeItem('participantAccessToken');
      })
      .finally(() => {
        setSessionReady(true);
      });
  }, []);

  const handleParticipantSignOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('participantAccessToken');
    }
    setPortalToken(null);
    setStep('phone');
    setOtp('');
    setPhoneE164(undefined);
  }, []);

  const requestCooldown = useSecondsCountdown();
  const resendCooldown = useSecondsCountdown();

  const cellphoneDigits = useMemo(() => {
    if (!phoneE164 || !isValidPhoneNumber(phoneE164)) {
      return null;
    }
    return onlyDigits(phoneE164);
  }, [phoneE164]);

  const phoneValid = useMemo(() => {
    if (!phoneE164 || !cellphoneDigits) {
      return false;
    }
    if (!isValidPhoneNumber(phoneE164)) {
      return false;
    }
    return cellphoneDigits.length >= 10 && cellphoneDigits.length <= 15;
  }, [phoneE164, cellphoneDigits]);

  const phoneDisplayInternational = useMemo(() => {
    if (!phoneE164 || !isValidPhoneNumber(phoneE164)) {
      return '';
    }
    try {
      return formatPhoneNumberIntl(phoneE164);
    } catch {
      return cellphoneDigits ?? '';
    }
  }, [phoneE164, cellphoneDigits]);

  const otpValid = /^\d{6}$/.test(otp);

  const handleRequestOtp = async () => {
    if (!phoneValid || !cellphoneDigits || requestCooldown.isRunning) {
      return;
    }
    setLoadingRequest(true);
    try {
      const res = await postRequestOtp({
        cellphone: cellphoneDigits,
        ...AUTH
      });
      requestCooldown.start(res.nextRequestAfterSec);
      setStep('otp');
      setOtp('');
      if (res.otpSent) {
        toast({
          title: 'Código enviado',
          description: 'Verifique seu WhatsApp e digite o código abaixo.'
        });
      } else {
        toast({
          title: 'Solicitação registrada',
          description:
            'Se o número estiver cadastrado, você receberá o código em instantes. Aguarde o tempo indicado para nova tentativa.'
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível enviar a solicitação. Tente novamente.'
      });
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleResend = async () => {
    if (!phoneValid || !cellphoneDigits || resendCooldown.isRunning || loadingResend) {
      return;
    }
    setLoadingResend(true);
    try {
      const res = await postResendOtp({
        cellphone: cellphoneDigits,
        ...AUTH
      });
      resendCooldown.start(res.nextRequestAfterSec);
      toast({
        title: 'Novo código enviado',
        description: 'Confira o WhatsApp.'
      });
    } catch (err) {
      const retry = getResend429RetryAfter(err);
      if (retry !== undefined) {
        resendCooldown.start(retry);
        toast({
          title: 'Aguarde',
          description: `Você poderá reenviar em ${formatClockSeconds(retry)}.`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Não foi possível reenviar',
          description: 'Verifique se ainda há um código válido ou solicite novamente pela etapa do telefone.'
        });
      }
    } finally {
      setLoadingResend(false);
    }
  };

  const handleVerify = async () => {
    if (!otpValid || !cellphoneDigits || loadingVerify) {
      return;
    }
    setLoadingVerify(true);
    try {
      const res = await postVerifyOtp({
        cellphone: cellphoneDigits,
        otp,
        ...AUTH
      });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('participantAccessToken', res.accessToken);
      }
      try {
        await getParticipantPortalSession(res.accessToken);
      } catch {
        toast({
          variant: 'destructive',
          title: 'Sessão não confirmada',
          description: 'O token foi guardado, mas não foi possível validar com o servidor. Verifique a API.'
        });
      }
      setPortalToken(res.accessToken);
      setStep('form');
      toast({
        title: 'Acesso liberado',
        description: 'Preencha ou atualize seu formulário abaixo.'
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Código inválido',
        description: 'Confira os dígitos ou solicite um novo código.'
      });
    } finally {
      setLoadingVerify(false);
    }
  };

  const requestLabel =
    requestCooldown.isRunning && step === 'phone'
      ? `Aguarde ${formatClockSeconds(requestCooldown.remainingSec)}`
      : loadingRequest
        ? 'Enviando…'
        : 'Enviar código no WhatsApp';

  const resendLabel =
    resendCooldown.isRunning
      ? `Reenviar em ${formatClockSeconds(resendCooldown.remainingSec)}`
      : loadingResend
        ? 'Reenviando…'
        : 'Reenviar código';

  if (!sessionReady) {
    return (
      <div className="w-full max-w-md flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Iniciando…
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-6', step === 'form' ? 'max-w-xl' : 'max-w-md')}>
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground mb-2">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Formulário</h1>
        <p className="text-sm text-muted-foreground">
          Acesso com o mesmo número do WhatsApp usado nos grupos, sem login Google.
        </p>
      </div>

      <Card className="rounded-2xl p-6 shadow-lg space-y-5">
        {step === 'phone' && (
          <>
            <div className="space-y-2">
              <label htmlFor="participant-whatsapp" className="text-sm font-medium leading-none">
                Número do WhatsApp
              </label>
              <ParticipantWhatsAppPhoneInput
                id="participant-whatsapp"
                value={phoneE164}
                onChange={setPhoneE164}
              />
              <p className="text-xs text-muted-foreground">
                Escolha o país (bandeira), depois digite o número — a máscara ajusta automaticamente. Pode colar o número
                completo com código do país.
              </p>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                className="w-full"
                size="lg"
                variant="whatsapp"
                loading={loadingRequest}
                disabled={!phoneValid || requestCooldown.isRunning}
                onClick={handleRequestOtp}
              >
                <span className="tabular-nums tracking-tight">{requestLabel}</span>
              </Button>
              {requestCooldown.isRunning && (
                <p className="text-center text-xs text-muted-foreground">
                  Por segurança, novas solicitações ficam disponíveis após{' '}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatClockSeconds(requestCooldown.remainingSec)}
                  </span>
                  .
                </p>
              )}
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Alterar número
            </button>

            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium leading-none">
                Código de 6 dígitos
              </label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(onlyDigits(e.target.value).slice(0, 6))}
                className="text-center text-lg tracking-[0.4em] font-medium tabular-nums"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enviamos para{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {phoneDisplayInternational || cellphoneDigits || '—'}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                className="w-full"
                size="lg"
                loading={loadingVerify}
                disabled={!otpValid}
                onClick={handleVerify}
              >
                Verificar e continuar
              </Button>

              <div className="flex flex-col items-center gap-1 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  loading={loadingResend}
                  disabled={resendCooldown.isRunning || loadingResend}
                  onClick={handleResend}
                >
                  {resendLabel}
                </Button>
                {resendCooldown.isRunning && (
                  <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                    Você poderá solicitar outro código em{' '}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatClockSeconds(resendCooldown.remainingSec)}
                    </span>
                    .
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {step === 'form' && portalToken && (
          <ParticipantPortalFormStep accessToken={portalToken} onSignOut={handleParticipantSignOut} />
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline font-medium">
          Acesso com Google
        </Link>
        {' · '}
        Uso exclusivo de participantes autorizados.
      </p>
    </div>
  );
}
