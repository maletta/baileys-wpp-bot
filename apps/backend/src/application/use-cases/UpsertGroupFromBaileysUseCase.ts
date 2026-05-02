import { IBaileysSocketService, BaileysGroupData } from '@/domain/interfaces/services/IBaileysSocketService';
import { IGroupWppRepository } from '@/domain/interfaces/repositories/IGroupWppRepository';
import { logger } from '@/shared/utils/logger';

/** Upsert de `groups_wpp` quando há metadados (ex.: `groups.upsert` / onGroupJoin). */
export class UpsertGroupFromBaileysUseCase {
  constructor(
    private readonly groupRepo: IGroupWppRepository,
    private readonly baileys: IBaileysSocketService
  ) {}

  async execute(groupData: BaileysGroupData): Promise<void> {
    try {
      let imageUrl: string | null = null;
      try {
        imageUrl = await this.baileys.getProfilePictureUrl(groupData.id);
      } catch {
        imageUrl = null;
      }

      const existing = await this.groupRepo.findByWhatsappRegistry(groupData.id);

      if (existing) {
        await this.groupRepo.update(existing.id, {
          name: groupData.subject,
          description: groupData.desc ?? undefined,
          linkedParent: groupData.linkedParent ?? undefined,
          ...(imageUrl !== null ? { imageUrl } : {})
        });
      } else {
        await this.groupRepo.create({
          whatsappRegistry: groupData.id,
          name: groupData.subject,
          description: groupData.desc,
          linkedParent: groupData.linkedParent,
          imageUrl: imageUrl ?? undefined
        });
      }
    } catch (error) {
      logger.error('UpsertGroupFromBaileysUseCase falhou', { error, groupId: groupData.id });
    }
  }
}
