import { ParticipantWpp } from '@/domain/entities/ParticipantWpp';

export interface CreateParticipantWppData {
  whatsappRegistry: string;
  cellphone: string;
  jid?: string | null;
  lid?: string | null;
  infoName?: string | null;
  role?: string;
}

export interface UpdateParticipantWppData {
  jid?: string | null;
  lid?: string | null;
  infoName?: string | null;
  role?: string;
}

export interface IParticipantWppRepository {
  findByWhatsappRegistry(whatsappRegistry: string): Promise<ParticipantWpp | null>;
  /** Dígitos apenas (ex.: 5511982653547), igual a `ParticipantsWpp.cellphone`. */
  findByCellphoneDigits(cellphoneDigits: string): Promise<ParticipantWpp | null>;
  create(data: CreateParticipantWppData): Promise<ParticipantWpp>;
  update(id: string, data: Partial<UpdateParticipantWppData>): Promise<ParticipantWpp>;
}
