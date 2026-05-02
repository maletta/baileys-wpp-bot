import { PrismaClient, ParticipantsWpp as PrismaParticipant } from '@prisma/client';
import { ParticipantWpp } from '@/domain/entities/ParticipantWpp';
import {
  CreateParticipantWppData,
  IParticipantWppRepository,
  UpdateParticipantWppData
} from '@/domain/interfaces/repositories/IParticipantWppRepository';

function mapRow(row: PrismaParticipant): ParticipantWpp {
  return new ParticipantWpp(
    row.id,
    row.whatsappRegistry,
    row.cellphone,
    row.jid ?? null,
    row.lid ?? null,
    row.infoName ?? null,
    row.createdAt,
    row.updatedAt
  );
}

export class ParticipantWppRepository implements IParticipantWppRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByWhatsappRegistry(whatsappRegistry: string): Promise<ParticipantWpp | null> {
    const row = await this.prisma.participantsWpp.findUnique({
      where: { whatsappRegistry }
    });
    return row ? mapRow(row) : null;
  }

  async create(data: CreateParticipantWppData): Promise<ParticipantWpp> {
    const row = await this.prisma.participantsWpp.create({
      data: {
        whatsappRegistry: data.whatsappRegistry,
        cellphone: data.cellphone,
        jid: data.jid ?? null,
        lid: data.lid ?? null,
        infoName: data.infoName ?? null
      }
    });
    return mapRow(row);
  }

  async update(id: string, data: Partial<UpdateParticipantWppData>): Promise<ParticipantWpp> {
    const row = await this.prisma.participantsWpp.update({
      where: { id },
      data: {
        ...(data.jid !== undefined && { jid: data.jid }),
        ...(data.lid !== undefined && { lid: data.lid }),
        ...(data.infoName !== undefined && { infoName: data.infoName })
      }
    });
    return mapRow(row);
  }
}
