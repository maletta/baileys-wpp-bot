import type { ParticipantForm as PrismaParticipantForm } from '@prisma/client';

export interface UpsertParticipantFormData {
  name: string;
  pronoun: string;
  relationship: string;
  birthday: Date;
  location: string;
  sexualOrientation: string;
  favoriteActivity: string;
  instagram: string | null;
  photoUrl: string;
  photo: Buffer | null;
  photoMimeType: string | null;
  sendFormMessageToGroup: boolean;
}

export interface IParticipantFormRepository {
  findByParticipantId(idParticipantWpp: string): Promise<PrismaParticipantForm | null>;
  upsertByParticipantId(
    idParticipantWpp: string,
    data: UpsertParticipantFormData
  ): Promise<PrismaParticipantForm>;
}
