import { PrismaClient } from '@prisma/client';
import type {
  ParticipantAuthorizationContext,
  ParticipantTemporaryToken,
  ParticipantTemporaryTokenType
} from '@prisma/client';
import {
  CreateParticipantTemporaryTokenInput,
  IParticipantTemporaryTokenRepository
} from '@/domain/interfaces/repositories/IParticipantTemporaryTokenRepository';

export class ParticipantTemporaryTokenRepository implements IParticipantTemporaryTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async softDeleteActiveForParticipant(
    participantId: string,
    type: ParticipantTemporaryTokenType,
    context: ParticipantAuthorizationContext
  ): Promise<number> {
    const now = new Date();
    const result = await this.prisma.participantTemporaryToken.updateMany({
      where: {
        idParticipantWpp: participantId,
        type,
        context,
        consumedAt: null,
        deletedAt: null,
        expiresAt: { gt: now }
      },
      data: { deletedAt: now }
    });
    return result.count;
  }

  async create(data: CreateParticipantTemporaryTokenInput): Promise<{ id: string }> {
    const row = await this.prisma.participantTemporaryToken.create({
      data: {
        idParticipantWpp: data.idParticipantWpp,
        type: data.type,
        context: data.context,
        otpHash: data.otpHash,
        expiresAt: data.expiresAt,
        lastSentAt: data.lastSentAt,
        resendCount: data.resendCount
      }
    });
    return { id: row.id };
  }

  async findLatestActive(
    participantId: string,
    type: ParticipantTemporaryTokenType,
    context: ParticipantAuthorizationContext
  ): Promise<ParticipantTemporaryToken | null> {
    const now = new Date();
    return this.prisma.participantTemporaryToken.findFirst({
      where: {
        idParticipantWpp: participantId,
        type,
        context,
        consumedAt: null,
        deletedAt: null,
        expiresAt: { gt: now }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markConsumed(id: string): Promise<void> {
    await this.prisma.participantTemporaryToken.update({
      where: { id },
      data: { consumedAt: new Date() }
    });
  }
}
