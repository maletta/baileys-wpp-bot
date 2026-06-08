import { PrismaClient, CommunityConfig as PrismaCommunityConfig } from '@prisma/client';
import { CommunityConfig } from '@/domain/entities/CommunityConfig';
import {
  CreateCommunityConfigData,
  ICommunityConfigRepository,
  UpdateCommunityConfigData
} from '@/domain/interfaces/repositories/ICommunityConfigRepository';

function mapRow(row: PrismaCommunityConfig): CommunityConfig {
  return new CommunityConfig(
    row.id,
    row.groupWppId,
    row.notificationGroupId,
    row.welcomeMessageTemplate,
    row.createdAt,
    row.updatedAt
  );
}

export class CommunityConfigRepository implements ICommunityConfigRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findByGroupWppId(groupWppId: string): Promise<CommunityConfig | null> {
    const row = await this.prisma.communityConfig.findUnique({
      where: { groupWppId }
    });
    return row ? mapRow(row) : null;
  }

  async findByNotificationGroup(groupId: string): Promise<CommunityConfig[]> {
    const rows = await this.prisma.communityConfig.findMany({
      where: { notificationGroupId: groupId }
    });
    return rows.map(mapRow);
  }

  async create(data: CreateCommunityConfigData): Promise<CommunityConfig> {
    const row = await this.prisma.communityConfig.create({
      data: {
        groupWppId: data.groupWppId,
        notificationGroupId: data.notificationGroupId ?? null,
        welcomeMessageTemplate: data.welcomeMessageTemplate ?? null
      }
    });
    return mapRow(row);
  }

  async update(groupWppId: string, data: UpdateCommunityConfigData): Promise<CommunityConfig> {
    const row = await this.prisma.communityConfig.update({
      where: { groupWppId },
      data: {
        ...(data.notificationGroupId !== undefined && { notificationGroupId: data.notificationGroupId }),
        ...(data.welcomeMessageTemplate !== undefined && { welcomeMessageTemplate: data.welcomeMessageTemplate })
      }
    });
    return mapRow(row);
  }

  async delete(groupWppId: string): Promise<void> {
    await this.prisma.communityConfig.delete({
      where: { groupWppId }
    });
  }
}
