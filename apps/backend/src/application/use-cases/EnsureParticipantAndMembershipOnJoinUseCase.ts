import { PrismaClient } from '@prisma/client';
import {
  IBaileysSocketService,
  ParticipantJoinContext,
  BaileysGroupData
} from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';
import { cellphoneDigitsFromPnJid } from '@/shared/utils/whatsappJid';

export interface EnsureParticipantMembershipInput {
  groupRegistry: string;
  eventParticipantId: string;
  participantPnJid?: string;
  membershipAdmin?: boolean;
  context?: ParticipantJoinContext;
}

/** Persiste participante + junção no `group-participants.update` com `action: add`. */
export class EnsureParticipantAndMembershipOnJoinUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly baileys: IBaileysSocketService
  ) {}

  async execute(input: EnsureParticipantMembershipInput): Promise<void> {
    let pnJid = input.participantPnJid;
    if (!pnJid?.endsWith('@s.whatsapp.net')) {
      try {
        const gd = await this.baileys.getGroupData(input.groupRegistry);
        const hit = gd.participants.find(p => p.id === input.eventParticipantId);
        pnJid =
          hit?.phoneNumber?.endsWith('@s.whatsapp.net') ? hit.phoneNumber : undefined;
      } catch (error) {
        logger.warn('WPP sync: getGroupData falhou ao resolver PN', {
          groupRegistry: input.groupRegistry,
          error
        });
      }
    }

    if (!pnJid?.endsWith('@s.whatsapp.net')) {
      logger.warn('WPP sync join ignorado: sem JID PN', {
        groupRegistry: input.groupRegistry,
        eventParticipantId: input.eventParticipantId
      });
      return;
    }

    const cellphone = cellphoneDigitsFromPnJid(pnJid);
    const lidStr = input.eventParticipantId.endsWith('@lid')
      ? input.eventParticipantId
      : null;

    let groupMeta: BaileysGroupData;
    let imageUrl: string | null = null;
    try {
      groupMeta = await this.baileys.getGroupData(input.groupRegistry);
      imageUrl = await this.baileys.getProfilePictureUrl(input.groupRegistry);
    } catch (error) {
      logger.error('WPP sync: metadados do grupo antes da transação', {
        groupRegistry: input.groupRegistry,
        error
      });
      return;
    }

    try {
      await this.prisma.$transaction(async tx => {
        const groupRow = await tx.groupsWpp.upsert({
          where: { whatsappRegistry: input.groupRegistry },
          create: {
            whatsappRegistry: input.groupRegistry,
            name: groupMeta.subject,
            description: groupMeta.desc ?? null,
            linkedParent: groupMeta.linkedParent ?? null,
            isCommunity: groupMeta.isCommunity ?? false,
            isCommunityAnnounce: groupMeta.isCommunityAnnounce ?? false,
            imageUrl
          },
          update: {
            name: groupMeta.subject,
            description: groupMeta.desc ?? null,
            linkedParent: groupMeta.linkedParent ?? null,
            isCommunity: groupMeta.isCommunity ?? false,
            isCommunityAnnounce: groupMeta.isCommunityAnnounce ?? false,
            imageUrl
          }
        });

        let partRow = await tx.participantsWpp.findUnique({
          where: { whatsappRegistry: pnJid }
        });

        if (!partRow) {
          partRow = await tx.participantsWpp.create({
            data: {
              whatsappRegistry: pnJid,
              cellphone,
              jid: pnJid,
              lid: lidStr
            }
          });
        } else {
          partRow = await tx.participantsWpp.update({
            where: { id: partRow.id },
            data: {
              jid: pnJid,
              ...(lidStr !== null ? { lid: lidStr } : {})
            }
          });
        }

        await tx.participantGroupWpp.upsert({
          where: {
            idGroupWpp_idParticipantWpp: {
              idGroupWpp: groupRow.id,
              idParticipantWpp: partRow.id
            }
          },
          create: {
            idGroupWpp: groupRow.id,
            idParticipantWpp: partRow.id,
            admin: input.membershipAdmin ?? false,
            deleted: false,
            removedAt: null
          },
          update: {
            admin: input.membershipAdmin ?? false,
            deleted: false,
            removedAt: null
          }
        });
      });
    } catch (error) {
      logger.error('WPP sync join transação falhou', { error, input });
    }
  }
}
