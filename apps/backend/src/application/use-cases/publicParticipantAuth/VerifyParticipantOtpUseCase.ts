import {
  ParticipantAuthorizationContext,
  ParticipantTemporaryTokenType
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { IParticipantWppRepository } from '@/domain/interfaces/repositories/IParticipantWppRepository';
import { IParticipantTemporaryTokenRepository } from '@/domain/interfaces/repositories/IParticipantTemporaryTokenRepository';
import { logger } from '@/shared/utils/logger';

export class VerifyParticipantOtpInvalidError extends Error {
  readonly code = 'VERIFY_INVALID';
  constructor() {
    super('Código inválido ou expirado.');
  }
}

export interface VerifyParticipantOtpConfig {
  jwtParticipantSecret: string;
  /** Segundos até expirar (claim `exp` do JWT). */
  jwtParticipantExpiresInSec: number;
}

export class VerifyParticipantOtpUseCase {
  constructor(
    private readonly participants: IParticipantWppRepository,
    private readonly tokens: IParticipantTemporaryTokenRepository,
    private readonly authConfig: VerifyParticipantOtpConfig
  ) {}

  async execute(input: {
    cellphoneDigits: string;
    otp: string;
    context: ParticipantAuthorizationContext;
    type: ParticipantTemporaryTokenType;
  }): Promise<{ accessToken: string }> {
    const participant = await this.participants.findByCellphoneDigits(input.cellphoneDigits);
    if (!participant) {
      logger.info('Participant OTP verify failed: unknown cellphone', {
        tail: input.cellphoneDigits.slice(-4),
        context: input.context
      });
      throw new VerifyParticipantOtpInvalidError();
    }

    const tokenRow = await this.tokens.findLatestActive(
      participant.id,
      input.type,
      input.context
    );
    if (!tokenRow) {
      logger.info('Participant OTP verify failed: no active token', {
        participantId: participant.id,
        context: input.context
      });
      throw new VerifyParticipantOtpInvalidError();
    }

    const match = await bcrypt.compare(input.otp, tokenRow.otpHash);
    if (!match) {
      logger.info('Participant OTP verify failed: bad code', {
        participantId: participant.id,
        context: input.context
      });
      throw new VerifyParticipantOtpInvalidError();
    }

    await this.tokens.markConsumed(tokenRow.id);

    const signOptions: SignOptions = {
      expiresIn: this.authConfig.jwtParticipantExpiresInSec
    };

    const accessToken = jwt.sign(
      {
        authKind: 'participant_session',
        tokenType: 'temporary',
        participantId: participant.id,
        sub: participant.id
      },
      this.authConfig.jwtParticipantSecret,
      signOptions
    );

    logger.info('Participant OTP verified, JWT issued', {
      participantId: participant.id,
      context: input.context
    });

    return { accessToken };
  }
}
