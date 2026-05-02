import { IBaileysSocketService, BaileysParticipantRef } from '@/domain/interfaces/services/IBaileysSocketService';
import { IGroupWppRepository } from '@/domain/interfaces/repositories/IGroupWppRepository';
import { IParticipantWppRepository } from '@/domain/interfaces/repositories/IParticipantWppRepository';
import { IParticipantGroupWppRepository } from '@/domain/interfaces/repositories/IParticipantGroupWppRepository';
import { logger } from '@/shared/utils/logger';

async function resolveParticipantPnJid(
  baileys: IBaileysSocketService,
  groupRegistry: string,
  ref: BaileysParticipantRef
): Promise<string | null> {
  if (ref.phoneNumber?.endsWith('@s.whatsapp.net')) {
    return ref.phoneNumber;
  }
  try {
    const meta = await baileys.getGroupData(groupRegistry);
    const hit = meta.participants.find(p => p.id === ref.id);
    const pn = hit?.phoneNumber;
    return pn?.endsWith('@s.whatsapp.net') ? pn : null;
  } catch {
    return null;
  }
}

export class MarkParticipantLeftInGroupUseCase {
  constructor(
    private readonly baileys: IBaileysSocketService,
    private readonly groupRepo: IGroupWppRepository,
    private readonly participantRepo: IParticipantWppRepository,
    private readonly membershipRepo: IParticipantGroupWppRepository
  ) {}

  async execute(groupRegistry: string, refs: BaileysParticipantRef[]): Promise<void> {
    const group = await this.groupRepo.findByWhatsappRegistry(groupRegistry);
    if (!group) {
      logger.warn('WPP sync leave: grupo não encontrado', { groupRegistry });
      return;
    }

    for (const ref of refs) {
      try {
        const pnJid = await resolveParticipantPnJid(this.baileys, groupRegistry, ref);
        if (!pnJid) {
          logger.warn('WPP sync leave: PN não resolvido', { ref });
          continue;
        }
        const participant = await this.participantRepo.findByWhatsappRegistry(pnJid);
        if (!participant) {
          continue;
        }
        await this.membershipRepo.softLeave(group.id, participant.id);
      } catch (error) {
        logger.error('WPP sync leave falhou para ref', { error, ref });
      }
    }
  }
}

export class SetParticipantAdminInGroupUseCase {
  constructor(
    private readonly baileys: IBaileysSocketService,
    private readonly groupRepo: IGroupWppRepository,
    private readonly participantRepo: IParticipantWppRepository,
    private readonly membershipRepo: IParticipantGroupWppRepository
  ) {}

  async execute(
    groupRegistry: string,
    refs: BaileysParticipantRef[],
    admin: boolean
  ): Promise<void> {
    const group = await this.groupRepo.findByWhatsappRegistry(groupRegistry);
    if (!group) {
      logger.warn('WPP sync admin: grupo não encontrado', { groupRegistry });
      return;
    }

    for (const ref of refs) {
      try {
        const pnJid = await resolveParticipantPnJid(this.baileys, groupRegistry, ref);
        if (!pnJid) {
          logger.warn('WPP sync admin: PN não resolvido', { ref });
          continue;
        }
        const participant = await this.participantRepo.findByWhatsappRegistry(pnJid);
        if (!participant) {
          continue;
        }
        await this.membershipRepo.setAdmin(group.id, participant.id, admin);
      } catch (error) {
        logger.error('WPP sync admin falhou para ref', { error, ref });
      }
    }
  }
}
