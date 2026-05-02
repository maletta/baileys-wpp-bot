import { PrismaClient, ParticipantGroupWpp as PrismaPg } from '@prisma/client';
import { ParticipantGroupWpp } from '@/domain/entities/ParticipantGroupWpp';
import {
  IParticipantGroupWppRepository,
  UpsertParticipantGroupData
} from '@/domain/interfaces/repositories/IParticipantGroupWppRepository';

function mapRow(row: PrismaPg): ParticipantGroupWpp {
  return new ParticipantGroupWpp(
    row.id,
    row.idGroupWpp,
    row.idParticipantWpp,
    row.name ?? null,
    row.linkedParent ?? null,
    row.admin,
    row.deleted,
    row.removedAt ?? null,
    row.createdAt,
    row.updatedAt
  );
}

export class ParticipantGroupWppRepository implements IParticipantGroupWppRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByGroupAndParticipantIds(
    idGroupWpp: string,
    idParticipantWpp: string
  ): Promise<ParticipantGroupWpp | null> {
    const row = await this.prisma.participantGroupWpp.findUnique({
      where: {
        idGroupWpp_idParticipantWpp: { idGroupWpp, idParticipantWpp }
      }
    });
    return row ? mapRow(row) : null;
  }

  async upsertActiveMembership(data: UpsertParticipantGroupData): Promise<ParticipantGroupWpp> {
    const row = await this.prisma.participantGroupWpp.upsert({
      where: {
        idGroupWpp_idParticipantWpp: {
          idGroupWpp: data.idGroupWpp,
          idParticipantWpp: data.idParticipantWpp
        }
      },
      create: {
        idGroupWpp: data.idGroupWpp,
        idParticipantWpp: data.idParticipantWpp,
        name: data.name ?? null,
        linkedParent: data.linkedParent ?? null,
        admin: data.admin ?? false,
        deleted: false,
        removedAt: null
      },
      update: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.linkedParent !== undefined && { linkedParent: data.linkedParent }),
        ...(data.admin !== undefined && { admin: data.admin }),
        deleted: false,
        removedAt: null
      }
    });
    return mapRow(row);
  }

  async softLeave(idGroupWpp: string, idParticipantWpp: string): Promise<void> {
    await this.prisma.participantGroupWpp.updateMany({
      where: { idGroupWpp, idParticipantWpp },
      data: {
        deleted: true,
        removedAt: new Date()
      }
    });
  }

  async setAdmin(idGroupWpp: string, idParticipantWpp: string, admin: boolean): Promise<void> {
    await this.prisma.participantGroupWpp.updateMany({
      where: { idGroupWpp, idParticipantWpp },
      data: { admin }
    });
  }
}
