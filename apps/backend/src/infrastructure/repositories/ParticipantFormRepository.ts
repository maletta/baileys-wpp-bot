import { PrismaClient, type ParticipantForm } from '@prisma/client';
import {
  IParticipantFormRepository,
  UpsertParticipantFormData
} from '@/domain/interfaces/repositories/IParticipantFormRepository';

export class ParticipantFormRepository implements IParticipantFormRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByParticipantId(idParticipantWpp: string): Promise<ParticipantForm | null> {
    return this.prisma.participantForm.findUnique({
      where: { idParticipantWpp }
    });
  }

  async upsertByParticipantId(
    idParticipantWpp: string,
    data: UpsertParticipantFormData
  ): Promise<ParticipantForm> {
    return this.prisma.participantForm.upsert({
      where: { idParticipantWpp },
      create: {
        idParticipantWpp,
        name: data.name,
        pronoun: data.pronoun,
        relationship: data.relationship,
        birthday: data.birthday,
        location: data.location,
        sexualOrientation: data.sexualOrientation,
        favoriteActivity: data.favoriteActivity,
        instagram: data.instagram,
        photoUrl: data.photoUrl,
        photo: data.photo,
        photoMimeType: data.photoMimeType,
        sendFormMessageToGroup: data.sendFormMessageToGroup
      },
      update: {
        name: data.name,
        pronoun: data.pronoun,
        relationship: data.relationship,
        birthday: data.birthday,
        location: data.location,
        sexualOrientation: data.sexualOrientation,
        favoriteActivity: data.favoriteActivity,
        instagram: data.instagram,
        photoUrl: data.photoUrl,
        photo: data.photo,
        photoMimeType: data.photoMimeType,
        sendFormMessageToGroup: data.sendFormMessageToGroup
      }
    });
  }
}
