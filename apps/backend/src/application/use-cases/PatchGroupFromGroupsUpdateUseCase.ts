import type { GroupMetadata } from '@whiskeysockets/baileys';
import { IGroupWppRepository, UpdateGroupWppData } from '@/domain/interfaces/repositories/IGroupWppRepository';
import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';

/**
 * Reage a `groups.update` do Baileys: atualiza `description` a partir de `desc` (se vier no payload)
 * e renova sempre `imageUrl` com `getProfilePictureUrl` (foto pode mudar sem vir no evento).
 * Só altera linhas de `groups_wpp` já existentes (whatsappRegistry = `id` do evento).
 */
export class PatchGroupFromGroupsUpdateUseCase {
  constructor(
    private readonly groupRepo: IGroupWppRepository,
    private readonly baileys: IBaileysSocketService
  ) {}

  async execute(updates: Partial<GroupMetadata>[]): Promise<void> {
    for (const partial of updates) {
      const gid = partial.id;
      if (!gid?.endsWith('@g.us')) {
        continue;
      }

      try {
        const existing = await this.groupRepo.findByWhatsappRegistry(gid);
        if (!existing) {
          logger.info('PatchGroupFromGroupsUpdate: grupo ainda não existe na BD, skip', {
            gid
          });
          continue;
        }

        const imageUrl = await this.baileys.getProfilePictureUrl(gid);

        const data: Partial<UpdateGroupWppData> = {
          imageUrl
        };

        if ('desc' in partial) {
          data.description = partial.desc ?? null;
        }

        if ('isCommunity' in partial && typeof partial.isCommunity === 'boolean') {
          data.isCommunity = partial.isCommunity;
        }

        if ('isCommunityAnnounce' in partial && typeof partial.isCommunityAnnounce === 'boolean') {
          data.isCommunityAnnounce = partial.isCommunityAnnounce;
        }

        await this.groupRepo.update(existing.id, data);
      } catch (error) {
        logger.error('PatchGroupFromGroupsUpdate: falha por item', { error, gid });
      }
    }
  }
}
