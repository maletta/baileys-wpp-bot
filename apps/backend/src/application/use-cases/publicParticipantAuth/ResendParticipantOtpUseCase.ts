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
import type { ParticipantPublicAuthMessagingConfig } from './IssueParticipantOtpUseCase';

export class ResendTooSoonError extends Error {
  readonly code = 'RESEND_TOO_SOON';
  constructor(readonly retryAfterSec: number) {
    super('Aguarde antes de solicitar um novo código.');
  }
}

export class ResendLimitExceededError extends Error {
  readonly code = 'RESEND_LIMIT_EXCEEDED';
  constructor() {
    super('Limite de reenvios atingido. Tente novamente mais tarde.');
  }
}

export class NoActiveOtpError extends Error {
  readonly code = 'NO_ACTIVE_OTP';
  constructor() {
    super('Não há código pendente para reenvio.');
  }
}

export interface ResendParticipantOtpConfig {
  otpTtlMs: number;
  resendCooldownMs: number;
  resendMaxPerChain: number;
}

export interface ResendParticipantOtpResult {
  nextRequestAfterSec: number;
  otpSent: boolean;
}

function ceilSec(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

export class ResendParticipantOtpUseCase {
  constructor(
    private readonly participants: IParticipantWppRepository,
    private readonly tokens: IParticipantTemporaryTokenRepository,
    private readonly baileys: IBaileysSocketService,
    private readonly messaging: ParticipantPublicAuthMessagingConfig,
    private readonly authConfig: ResendParticipantOtpConfig
  ) {}

  async execute(input: {
    cellphoneDigits: string;
    context: ParticipantAuthorizationContext;
    type: ParticipantTemporaryTokenType;
  }): Promise<ResendParticipantOtpResult> {
    const cooldownFullSec = ceilSec(this.authConfig.resendCooldownMs);

    const participant = await this.participants.findByCellphoneDigits(input.cellphoneDigits);
    if (!participant) {
      throw new NoActiveOtpError();
    }

    const state = await this.baileys.getConnectionState();
    if (!state.isConnected) {
      logger.warn('Participant OTP resend: WhatsApp offline', { context: input.context });
      throw new NoActiveOtpError();
    }

    const active = await this.tokens.findLatestActive(participant.id, input.type, input.context);
    if (!active) {
      throw new NoActiveOtpError();
    }

    const now = Date.now();
    if (
      active.lastSentAt &&
      now - active.lastSentAt.getTime() < this.authConfig.resendCooldownMs
    ) {
      const elapsed = now - active.lastSentAt.getTime();
      const remainingMs = this.authConfig.resendCooldownMs - elapsed;
      logger.info('Participant OTP resend blocked: cooldown', {
        participantId: participant.id,
        context: input.context
      });
      throw new ResendTooSoonError(Math.max(1, ceilSec(remainingMs)));
    }

    if (active.resendCount >= this.authConfig.resendMaxPerChain) {
      logger.info('Participant OTP resend blocked: limit', {
        participantId: participant.id,
        context: input.context
      });
      throw new ResendLimitExceededError();
    }

    const otp = randomInt(100_000, 1_000_000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now + this.authConfig.otpTtlMs);
    const jid = resolveParticipantDmJid(participant);
    if (!jid) {
      logger.warn('Participant OTP resend: could not resolve DM JID', {
        participantId: participant.id,
        context: input.context
      });
      throw new NoActiveOtpError();
    }

    const fnLabel = this.messaging.labelForContext(input.context);
    const text = `Este é seu código de verificação para acesso ao formulário ${fnLabel} do ${this.messaging.appDisplayName}: ${otp}`;

    const sent = await this.baileys.sendPrivateText(jid, text);
    if (!sent) {
      logger.error('Participant OTP resend: send failed', {
        participantId: participant.id,
        context: input.context
      });
      throw new NoActiveOtpError();
    }

    const nextResend = active.resendCount + 1;
    await this.tokens.softDeleteActiveForParticipant(participant.id, input.type, input.context);
    await this.tokens.create({
      idParticipantWpp: participant.id,
      type: input.type,
      context: input.context,
      otpHash,
      expiresAt,
      lastSentAt: new Date(),
      resendCount: nextResend
    });

    logger.info('Participant OTP resent', {
      participantId: participant.id,
      context: input.context,
      resendCount: nextResend
    });

    return { nextRequestAfterSec: cooldownFullSec, otpSent: true };
  }
}
