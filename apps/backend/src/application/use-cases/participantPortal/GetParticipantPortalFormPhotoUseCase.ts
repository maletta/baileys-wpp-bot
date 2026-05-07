import fs from 'fs/promises';
import path from 'path';
import { IParticipantFormRepository } from '@/domain/interfaces/repositories/IParticipantFormRepository';
import {
  assertParticipantAllowed,
  resolveTargetParticipantId
} from '@/shared/utils/participantPortalAuth';
import type { ParticipantPortalAuthState } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';

function guessMimetypeFromPath(filePath: string): string | undefined {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return undefined;
}

export class GetParticipantPortalFormPhotoUseCase {
  constructor(
    private readonly forms: IParticipantFormRepository,
    private readonly uploadsRoot: string
  ) {}

  /**
   * Prioridade: bytes em `photo` (DB); senão ficheiro legado em `photoUrl` + disco.
   */
  async execute(
    auth: ParticipantPortalAuthState,
    queryParticipantId: string | undefined
  ): Promise<{ buffer: Buffer; mime: string } | null> {
    const participantId = resolveTargetParticipantId(auth, queryParticipantId);
    assertParticipantAllowed(auth, participantId);

    const row = await this.forms.findByParticipantId(participantId);
    if (!row) {
      return null;
    }

    if (row.photo && row.photo.byteLength > 0) {
      const mime = row.photoMimeType?.trim();
      if (!mime) {
        return null;
      }
      return { buffer: Buffer.from(row.photo), mime };
    }

    const rel = row.photoUrl?.trim();
    if (!rel) {
      return null;
    }

    const diskPath = path.join(this.uploadsRoot, rel.replace(/^\//, ''));
    try {
      const buffer = await fs.readFile(diskPath);
      const mime = guessMimetypeFromPath(diskPath) ?? 'application/octet-stream';
      return { buffer, mime };
    } catch {
      return null;
    }
  }
}
