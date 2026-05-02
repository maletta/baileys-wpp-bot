import { ParticipantGroupWpp } from '@/domain/entities/ParticipantGroupWpp';

export interface UpsertParticipantGroupData {
  idGroupWpp: string;
  idParticipantWpp: string;
  name?: string | null;
  linkedParent?: string | null;
  admin?: boolean;
}

export interface IParticipantGroupWppRepository {
  findByGroupAndParticipantIds(
    idGroupWpp: string,
    idParticipantWpp: string
  ): Promise<ParticipantGroupWpp | null>;

  upsertActiveMembership(data: UpsertParticipantGroupData): Promise<ParticipantGroupWpp>;

  softLeave(idGroupWpp: string, idParticipantWpp: string): Promise<void>;

  setAdmin(idGroupWpp: string, idParticipantWpp: string, admin: boolean): Promise<void>;
}
