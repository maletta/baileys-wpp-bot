import type { ParticipantForm } from '@prisma/client';
import { IParticipantFormRepository } from '@/domain/interfaces/repositories/IParticipantFormRepository';
import {
  resolveTargetParticipantId
} from '@/shared/utils/participantPortalAuth';
import type { ParticipantPortalAuthState } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';

export interface ParticipantPortalFormResponse {
  participantId: string;
  exists: boolean;
  sendFormMessageToGroup: boolean;
  /** URL pública só para fotos legadas em `/uploads/...`. */
  photoUrl: string | null;
  /** Foto guardada na base (GET /participant-portal/form/photo com o mesmo token). */
  hasDbPhoto: boolean;
  name: string | null;
  pronoun: string | null;
  relationship: string | null;
  birthday: string | null;
  location: string | null;
  sexualOrientation: string | null;
  favoriteActivity: string | null;
  instagram: string | null;
}

function mapRow(
  participantId: string,
  row: ParticipantForm | null,
  photoPublicUrl: (stored: string) => string
): ParticipantPortalFormResponse {
  if (!row) {
    return {
      participantId,
      exists: false,
      sendFormMessageToGroup: true,
      photoUrl: null,
      hasDbPhoto: false,
      name: null,
      pronoun: null,
      relationship: null,
      birthday: null,
      location: null,
      sexualOrientation: null,
      favoriteActivity: null,
      instagram: null
    };
  }

  const hasDbPhoto = Boolean(row.photo && row.photo.byteLength > 0);
  const legacyPath = row.photoUrl?.trim();

  return {
    participantId,
    exists: true,
    sendFormMessageToGroup: row.sendFormMessageToGroup,
    photoUrl: !hasDbPhoto && legacyPath ? photoPublicUrl(legacyPath) : null,
    hasDbPhoto,
    name: row.name,
    pronoun: row.pronoun,
    relationship: row.relationship,
    birthday: row.birthday.toISOString(),
    location: row.location,
    sexualOrientation: row.sexualOrientation,
    favoriteActivity: row.favoriteActivity,
    instagram: row.instagram
  };
}

export class GetParticipantPortalFormUseCase {
  constructor(private readonly forms: IParticipantFormRepository) {}

  async execute(
    auth: ParticipantPortalAuthState,
    queryParticipantId: string | undefined,
    photoPublicUrl: (stored: string) => string
  ): Promise<ParticipantPortalFormResponse> {
    const participantId = resolveTargetParticipantId(auth, queryParticipantId);

    const row = await this.forms.findByParticipantId(participantId);
    return mapRow(participantId, row, photoPublicUrl);
  }
}
