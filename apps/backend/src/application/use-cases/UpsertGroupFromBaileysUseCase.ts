import { IBaileysSocketService, BaileysGroupData } from '@/domain/interfaces/services/IBaileysSocketService';
import { IGroupWppRepository } from '@/domain/interfaces/repositories/IGroupWppRepository';
import { GroupWpp } from '@/domain/entities/GroupWpp';
import { ICommunityConfigRepository } from '@/domain/interfaces/repositories/ICommunityConfigRepository';
import { logger } from '@/shared/utils/logger';

function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80) || 'grupo';
}

async function ensureUniqueSlug(
  groupRepo: IGroupWppRepository,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;
  while (await groupRepo.findByFormSlug(slug)) {
    slug = `${baseSlug}_${suffix}`;
    suffix++;
  }
  return slug;
}

/** Upsert de `groups_wpp` quando há metadados (ex.: `groups.upsert` / onGroupJoin). */
export class UpsertGroupFromBaileysUseCase {
  constructor(
    private readonly groupRepo: IGroupWppRepository,
    private readonly communityConfigRepo: ICommunityConfigRepository,
    private readonly baileys: IBaileysSocketService
  ) { }

  async execute(
    groupData: BaileysGroupData,
    /** UUID interno (`GroupsWpp.id`) do grupo que originou esta descoberta (ex.: linkedParent). */
    discovererGroupId?: string
  ): Promise<void> {
    try {
      let imageUrl: string | null = null;
      try {
        imageUrl = await this.baileys.getProfilePictureUrl(groupData.id);
      } catch {
        imageUrl = null;
      }

      const isCommunity = groupData.isCommunity ?? false;
      const isCommunityAnnounce = groupData.isCommunityAnnounce ?? false;
      const existing = await this.groupRepo.findByWhatsappRegistry(groupData.id);

      let groupRow: GroupWpp;
      if (existing) {
        groupRow = await this.groupRepo.update(existing.id, {
          name: groupData.subject,
          description: groupData.desc ?? undefined,
          linkedParent: groupData.linkedParent ?? undefined,
          isCommunity,
          isCommunityAnnounce,
          ...(imageUrl !== null ? { imageUrl } : {})
        });
      } else {
        // Gerar slug apenas para comunidades e grupos standalone (sem linkedParent)
        const isStandalone = !groupData.linkedParent || groupData.linkedParent === groupData.id;
        const shouldHaveSlug = isCommunity || isStandalone;
        const formSlug = shouldHaveSlug
          ? await ensureUniqueSlug(this.groupRepo, generateSlug(groupData.subject))
          : undefined;

        groupRow = await this.groupRepo.create({
          whatsappRegistry: groupData.id,
          name: groupData.subject,
          description: groupData.desc,
          linkedParent: groupData.linkedParent,
          isCommunity,
          isCommunityAnnounce,
          imageUrl: imageUrl ?? undefined,
          formSlug
        });

        // Se é uma comunidade recém-descoberta e temos um discoverer, criar CommunityConfig
        if (isCommunity && discovererGroupId) {
          const existingConfig = await this.communityConfigRepo.findByGroupWppId(groupRow.id);
          if (!existingConfig) {
            await this.communityConfigRepo.create({
              groupWppId: groupRow.id,
              notificationGroupId: discovererGroupId
            });
            logger.info('CommunityConfig criado para comunidade recém-descoberta', {
              communityId: groupRow.id,
              communityRegistry: groupData.id,
              discovererGroupId
            });
          }
        }
      }

      // Recurse para a comunidade pai (linkedParent), passando este grupo como discoverer
      if (groupData.linkedParent && groupData.linkedParent !== groupData.id) {
        const parentJid = groupData.linkedParent;
        try {
          const parentMeta = await this.baileys.getGroupData(parentJid);
          await this.execute(parentMeta, groupRow.id);
        } catch (error) {
          logger.warn('UpsertGroupFromBaileys: metadados do linkedParent indisponíveis', {
            linkedParent: parentJid,
            error
          });
        }
      }
    } catch (error) {
      logger.error('UpsertGroupFromBaileysUseCase falhou', { error, groupId: groupData.id });
    }
  }
}
