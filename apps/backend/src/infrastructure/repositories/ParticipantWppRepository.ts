import { PrismaClient, ParticipantsWpp as PrismaParticipant, UserRole } from '@prisma/client';
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
    row.role as any,
    row.createdAt,
    row.updatedAt
  );
}

export class ParticipantWppRepository implements IParticipantWppRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findByWhatsappRegistry(whatsappRegistry: string): Promise<ParticipantWpp | null> {
    const row = await this.prisma.participantsWpp.findUnique({
      where: { whatsappRegistry }
    });
    return row ? mapRow(row) : null;
  }

  async findByCellphoneDigits(cellphoneDigits: string): Promise<ParticipantWpp | null> {
    const row = await this.prisma.participantsWpp.findFirst({
      where: { cellphone: cellphoneDigits }
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
        infoName: data.infoName ?? null,
        role: (data.role as UserRole) ?? UserRole.MEMBER
      }
    });
    return mapRow(row);
  }

  async update(id: string, data: Partial<UpdateParticipantWppData>): Promise<ParticipantWpp> {
    const updateData: Record<string, unknown> = {};
    if (data.jid !== undefined) updateData.jid = data.jid;
    if (data.lid !== undefined) updateData.lid = data.lid;
    if (data.infoName !== undefined) updateData.infoName = data.infoName;
    if (data.role !== undefined) updateData.role = data.role as UserRole;

    const row = await this.prisma.participantsWpp.update({
      where: { id },
      data: updateData
    });
    return mapRow(row);
  }
}
