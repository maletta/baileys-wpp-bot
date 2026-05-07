import type {
  ParticipantAuthorizationContext,
  ParticipantTemporaryToken,
  ParticipantTemporaryTokenType
} from '@prisma/client';

export interface CreateParticipantTemporaryTokenInput {
  idParticipantWpp: string;
  type: ParticipantTemporaryTokenType;
  context: ParticipantAuthorizationContext;
  otpHash: string;
  expiresAt: Date;
  lastSentAt: Date;
  resendCount: number;
}

export interface IParticipantTemporaryTokenRepository {
  softDeleteActiveForParticipant(
    participantId: string,
    type: ParticipantTemporaryTokenType,
    context: ParticipantAuthorizationContext
  ): Promise<number>;

  create(data: CreateParticipantTemporaryTokenInput): Promise<{ id: string }>;

  findLatestActive(
    participantId: string,
    type: ParticipantTemporaryTokenType,
    context: ParticipantAuthorizationContext
  ): Promise<ParticipantTemporaryToken | null>;

  markConsumed(id: string): Promise<void>;
}
