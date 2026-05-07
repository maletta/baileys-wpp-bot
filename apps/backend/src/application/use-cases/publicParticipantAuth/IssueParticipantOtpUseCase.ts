import {
  ParticipantAuthorizationContext,
  ParticipantTemporaryTokenType
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { IParticipantWppRepository } from '@/domain/interfaces/repositories/IParticipantWppRepository';
import { IParticipantTemporaryTokenRepository } from '@/domain/interfaces/repositories/IParticipantTemporaryTokenRepository';
import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';
import { resolveParticipantDmJid } from '@/shared/utils/whatsappJid';

export interface ParticipantPublicAuthMessagingConfig {
  appDisplayName: string;
  labelForContext: (ctx: ParticipantAuthorizationContext) => string;
}

export interface IssueParticipantOtpConfig {
  otpTtlMs: number;
  /** Intervalo mínimo entre envios ao repetir o passo "número" sem usar o botão reenviar. */
  issueMinIntervalMs: number;
}

export interface IssueParticipantOtpResult {
  /**
   * Segundos até o cliente poder chamar `/request-otp` de novo (contagem regressiva).
   * Após envio bem-sucedido ou quando o envio foi bloqueado por intervalo mínimo, reflete o cooldown real.
   * Em falhas “silenciosas” (anti-enumeração) devolve 0 para não bloquear a UI.
   */
  nextRequestAfterSec: number;
  /** `true` somente se um novo código foi enviado ao WhatsApp nesta requisição. */
  otpSent: boolean;
}

function ceilSec(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

/**
 * Primeiro envio (ou novo envio após intervalo) ao submeter o telefone na etapa 1.
 * Mantém corpo HTTP estável (`ok`) com metadados de cooldown para o front.
 */
export class IssueParticipantOtpUseCase {
  constructor(
    private readonly participants: IParticipantWppRepository,
    private readonly tokens: IParticipantTemporaryTokenRepository,
    private readonly baileys: IBaileysSocketService,
    private readonly messaging: ParticipantPublicAuthMessagingConfig,
    private readonly authConfig: IssueParticipantOtpConfig
  ) {}

  async execute(input: {
    cellphoneDigits: string;
    context: ParticipantAuthorizationContext;
    type: ParticipantTemporaryTokenType;
  }): Promise<IssueParticipantOtpResult> {
    const cooldownFullSec = ceilSec(this.authConfig.issueMinIntervalMs);

    const participant = await this.participants.findByCellphoneDigits(input.cellphoneDigits);
    if (!participant) {
      logger.info('Participant OTP issue: no participant for cellphone (masked)', {
        tail: input.cellphoneDigits.slice(-4),
        context: input.context
      });
      return { nextRequestAfterSec: 0, otpSent: false };
    }

    let state: { isConnected: boolean };
    try {
      state = await this.baileys.getConnectionState();
    } catch (error) {
      logger.warn('Participant OTP issue: connection state failed', { error, context: input.context });
      return { nextRequestAfterSec: 0, otpSent: false };
    }
    if (!state.isConnected) {
      logger.warn('Participant OTP issue: WhatsApp offline', { context: input.context });
      return { nextRequestAfterSec: 0, otpSent: false };
    }

    const existing = await this.tokens.findLatestActive(
      participant.id,
      input.type,
      input.context
    );
    const now = Date.now();
    if (
      existing?.lastSentAt &&
      now - existing.lastSentAt.getTime() < this.authConfig.issueMinIntervalMs
    ) {
      const elapsed = now - existing.lastSentAt.getTime();
      const remainingMs = this.authConfig.issueMinIntervalMs - elapsed;
      logger.info('Participant OTP issue: skipped (min interval)', {
        participantId: participant.id,
        context: input.context
      });
      return {
        nextRequestAfterSec: ceilSec(remainingMs),
        otpSent: false
      };
    }

    const otp = randomInt(100_000, 1_000_000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now + this.authConfig.otpTtlMs);
    const jid = resolveParticipantDmJid(participant);
    if (!jid) {
      logger.warn('Participant OTP issue: could not resolve DM JID', {
        participantId: participant.id,
        context: input.context
      });
      return { nextRequestAfterSec: 0, otpSent: false };
    }

    const fnLabel = this.messaging.labelForContext(input.context);
    const text = `Este é seu código de verificação para acesso ao formulário ${fnLabel} do ${this.messaging.appDisplayName}: ${otp}`;

    const sent = await this.baileys.sendPrivateText(jid, text);
    if (!sent) {
      logger.error('Participant OTP issue: WhatsApp send failed', {
        participantId: participant.id,
        context: input.context
      });
      return { nextRequestAfterSec: 0, otpSent: false };
    }

    await this.tokens.softDeleteActiveForParticipant(participant.id, input.type, input.context);
    await this.tokens.create({
      idParticipantWpp: participant.id,
      type: input.type,
      context: input.context,
      otpHash,
      expiresAt,
      lastSentAt: new Date(),
      resendCount: 0
    });

    logger.info('Participant OTP issued', {
      participantId: participant.id,
      context: input.context
    });

    return { nextRequestAfterSec: cooldownFullSec, otpSent: true };
  }
}
