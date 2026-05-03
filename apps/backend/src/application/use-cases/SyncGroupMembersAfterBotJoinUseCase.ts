import { PrismaClient } from '@prisma/client';
import {
  IBaileysSocketService,
  BaileysGroupData,
  BaileysParticipantData
} from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';
import { cellphoneDigitsFromPnJid, toPnJidIfPossible } from '@/shared/utils/whatsappJid';

function resolveParticipantPnJid(p: BaileysParticipantData): string | undefined {
  const fromPhone = toPnJidIfPossible(p.phoneNumber);
  if (fromPhone) {
    return fromPhone;
  }
  if (p.id?.endsWith('@s.whatsapp.net')) {
    return p.id;
  }
  return toPnJidIfPossible(p.id);
}

/**
 * Quando a **própria sessão** entra num grupo: obtém metadados completos e
 * sincroniza todos os membros para `participants_wpp` + `participant_group_wpp`.
 * Membros sem JID PN resolvível são ignorados (mesma regra que o join unitário).
 */
export class SyncGroupMembersAfterBotJoinUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly baileys: IBaileysSocketService
  ) {}

  async execute(groupRegistry: string): Promise<void> {
    let groupMeta: BaileysGroupData;
    let imageUrl: string | null = null;
    try {
      groupMeta = await this.baileys.getGroupData(groupRegistry);
      imageUrl = await this.baileys.getProfilePictureUrl(groupRegistry);
    } catch (error) {
      logger.error('SyncGroupMembersAfterBotJoin: metadados do grupo indisponíveis', {
        error,
        groupRegistry
      });
      return;
    }

    logger.info('SyncGroupMembersAfterBotJoin: sincronização completa iniciada', {
      groupRegistry,
      participantCount: groupMeta.participants.length
    });

    try {
      await this.prisma.$transaction(async tx => {
        const groupRow = await tx.groupsWpp.upsert({
          where: { whatsappRegistry: groupRegistry },
          create: {
            whatsappRegistry: groupRegistry,
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

        let skippedNoPn = 0;

        for (const p of groupMeta.participants) {
          const pnJid = resolveParticipantPnJid(p);
          if (!pnJid?.endsWith('@s.whatsapp.net')) {
            skippedNoPn += 1;
            continue;
          }

          const lidStr = p.id.endsWith('@lid') ? p.id : p.lid ?? null;
          const cellphone = cellphoneDigitsFromPnJid(pnJid);
          const admin = p.admin === 'admin' || p.admin === 'superadmin';

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
              admin,
              deleted: false,
              removedAt: null
            },
            update: {
              admin,
              deleted: false,
              removedAt: null
            }
          });
        }

        if (skippedNoPn > 0) {
          logger.warn('SyncGroupMembersAfterBotJoin: membros ignorados sem PN resolvível', {
            groupRegistry,
            skippedNoPn
          });
        }
      });
    } catch (error) {
      logger.error('SyncGroupMembersAfterBotJoin: transação falhou', { error, groupRegistry });
    }
  }
}
