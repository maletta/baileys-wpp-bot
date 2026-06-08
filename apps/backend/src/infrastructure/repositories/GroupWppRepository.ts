import { PrismaClient, GroupsWpp as PrismaGroup } from '@prisma/client';
import { GroupWpp } from '@/domain/entities/GroupWpp';
import {
  CreateGroupWppData,
  IGroupWppRepository,
  UpdateGroupWppData
} from '@/domain/interfaces/repositories/IGroupWppRepository';

function mapRow(row: PrismaGroup): GroupWpp {
  return new GroupWpp(
    row.id,
    row.whatsappRegistry,
    row.name,
    row.description ?? null,
    row.linkedParent ?? null,
    row.isCommunity,
    row.isCommunityAnnounce,
    row.imageUrl ?? null,
    row.notifyNewUserDetail,
    row.onlyRegisteredUserMode,
    row.formSlug ?? null,
    row.createdAt,
    row.updatedAt
  );
}

export class GroupWppRepository implements IGroupWppRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<GroupWpp | null> {
    const row = await this.prisma.groupsWpp.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async findByWhatsappRegistry(whatsappRegistry: string): Promise<GroupWpp | null> {
    const row = await this.prisma.groupsWpp.findUnique({
      where: { whatsappRegistry }
    });
    return row ? mapRow(row) : null;
  }

  async findByFormSlug(slug: string): Promise<GroupWpp | null> {
    const row = await this.prisma.groupsWpp.findUnique({
      where: { formSlug: slug }
    });
    return row ? mapRow(row) : null;
  }

  async findAll(): Promise<GroupWpp[]> {
    const rows = await this.prisma.groupsWpp.findMany();
    return rows.map(mapRow);
  }

  async create(groupData: CreateGroupWppData): Promise<GroupWpp> {
    const row = await this.prisma.groupsWpp.create({
      data: {
        whatsappRegistry: groupData.whatsappRegistry,
        name: groupData.name,
        description: groupData.description ?? null,
        linkedParent: groupData.linkedParent ?? null,
        isCommunity: groupData.isCommunity ?? false,
        isCommunityAnnounce: groupData.isCommunityAnnounce ?? false,
        imageUrl: groupData.imageUrl ?? null,
        notifyNewUserDetail: groupData.notifyNewUserDetail ?? true,
        onlyRegisteredUserMode: groupData.onlyRegisteredUserMode ?? true,
        formSlug: groupData.formSlug ?? null
      }
    });
    return mapRow(row);
  }

  async update(id: string, groupData: Partial<UpdateGroupWppData>): Promise<GroupWpp> {
    const row = await this.prisma.groupsWpp.update({
      where: { id },
      data: {
        ...(groupData.name !== undefined && { name: groupData.name }),
        ...(groupData.description !== undefined && { description: groupData.description }),
        ...(groupData.linkedParent !== undefined && { linkedParent: groupData.linkedParent }),
        ...(groupData.isCommunity !== undefined && { isCommunity: groupData.isCommunity }),
        ...(groupData.isCommunityAnnounce !== undefined && {
          isCommunityAnnounce: groupData.isCommunityAnnounce
        }),
        ...(groupData.imageUrl !== undefined && { imageUrl: groupData.imageUrl }),
        ...(groupData.notifyNewUserDetail !== undefined && {
          notifyNewUserDetail: groupData.notifyNewUserDetail
        }),
        ...(groupData.onlyRegisteredUserMode !== undefined && {
          onlyRegisteredUserMode: groupData.onlyRegisteredUserMode
        }),
        ...(groupData.formSlug !== undefined && { formSlug: groupData.formSlug })
      }
    });
    return mapRow(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.groupsWpp.delete({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<GroupWpp[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.groupsWpp.findMany({
      where: { id: { in: ids } }
    });
    return rows.map(mapRow);
  }
}
