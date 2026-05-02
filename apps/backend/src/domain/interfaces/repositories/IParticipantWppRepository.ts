import { ParticipantWpp } from '@/domain/entities/ParticipantWpp';

export interface CreateParticipantWppData {
  whatsappRegistry: string;
  cellphone: string;
  jid?: string | null;
  lid?: string | null;
  infoName?: string | null;
}

export interface UpdateParticipantWppData {
  jid?: string | null;
  lid?: string | null;
  infoName?: string | null;
}

export interface IParticipantWppRepository {
  findByWhatsappRegistry(whatsappRegistry: string): Promise<ParticipantWpp | null>;
  create(data: CreateParticipantWppData): Promise<ParticipantWpp>;
  update(id: string, data: Partial<UpdateParticipantWppData>): Promise<ParticipantWpp>;
}
