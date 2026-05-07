import fs from 'fs/promises';
import path from 'path';
import type { GroupsWpp, ParticipantGroupWpp, PrismaClient } from '@prisma/client';
import { IParticipantFormRepository } from '@/domain/interfaces/repositories/IParticipantFormRepository';
import type { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';
import {
  assertParticipantAllowed,
  ParticipantPortalAuthError,
  resolveTargetParticipantId
} from '@/shared/utils/participantPortalAuth';
import type { ParticipantPortalAuthState } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';

export interface UpsertParticipantPortalFormInput {
  participantId?: string;
  idGroupWpp?: string;
  sendFormMessageToGroup: boolean;
  name: string;
  pronoun: string;
  relationship: string;
  birthday: Date;
  location: string;
  sexualOrientation: string;
  favoriteActivity: string;
  instagram: string | null;
  /** Nova imagem (multipart em memória). */
  newPhotoBuffer?: Buffer;
  newPhotoMimeType?: string;
}

export interface UpsertParticipantPortalFormResult {
  formSaved: boolean;
  messageSentToGroup: boolean;
  warnings: string[];
}

function buildCaption(data: {
  name: string;
  pronoun: string;
  relationship: string;
  birthday: Date;
  location: string;
  sexualOrientation: string;
  favoriteActivity: string;
  instagram: string | null;
}): string {
  const esc = (s: string) => s.replace(/\*/g, '·').replace(/\n/g, ' ');
  const b = data.birthday.toLocaleDateString('pt-BR');
  const ig = data.instagram?.trim()
    ? `@${esc(data.instagram.replace(/^@/, ''))}`
    : '—';
  return [
    '📋 *Formulário do participante*',
    `*Nome:* ${esc(data.name)}`,
    `*Pronome:* ${esc(data.pronoun)}`,
    `*Relacionamento:* ${esc(data.relationship)}`,
    `*Nascimento:* ${b}`,
    `*Local:* ${esc(data.location)}`,
    `*Orientação:* ${esc(data.sexualOrientation)}`,
    `*Rolê favorito:* ${esc(data.favoriteActivity)}`,
    `*Instagram:* ${ig}`
  ].join('\n');
}

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

export class UpsertParticipantPortalFormUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly forms: IParticipantFormRepository,
    private readonly baileys: IBaileysSocketService,
    private readonly uploadsRoot: string
  ) {}

  async execute(
    auth: ParticipantPortalAuthState,
    input: UpsertParticipantPortalFormInput
  ): Promise<UpsertParticipantPortalFormResult> {
    let participantId: string;
    try {
      participantId = resolveTargetParticipantId(auth, input.participantId);
    } catch (e) {
      if (e instanceof ParticipantPortalAuthError) {
        throw e;
      }
      throw e;
    }
    assertParticipantAllowed(auth, participantId);

    if (input.sendFormMessageToGroup) {
      if (!input.idGroupWpp?.trim()) {
        throw new ParticipantPortalAuthError(
          'idGroupWpp é obrigatório quando sendFormMessageToGroup está ativo.',
          400
        );
      }
    }

    const existing = await this.forms.findByParticipantId(participantId);

    let photo: Buffer | null =
      existing?.photo && existing.photo.byteLength > 0 ? Buffer.from(existing.photo) : null;
    let photoMimeType: string | null = existing?.photoMimeType ?? null;
    let photoUrl = existing?.photoUrl?.trim() ?? '';

    if (input.newPhotoBuffer && input.newPhotoBuffer.byteLength > 0 && input.newPhotoMimeType?.trim()) {
      photo = input.newPhotoBuffer;
      photoMimeType = input.newPhotoMimeType.trim();
      photoUrl = '';
    }

    const hasPhoto = (photo && photo.byteLength > 0) || photoUrl.length > 0;
    if (!hasPhoto) {
      throw new ParticipantPortalAuthError('Foto obrigatória na primeira submissão do formulário.', 400);
    }

    type MembershipWithGroup = ParticipantGroupWpp & { group: GroupsWpp };

    let membershipForSend: MembershipWithGroup | null = null;
    if (input.sendFormMessageToGroup && input.idGroupWpp) {
      const membership = await this.prisma.participantGroupWpp.findUnique({
        where: {
          idGroupWpp_idParticipantWpp: {
            idGroupWpp: input.idGroupWpp,
            idParticipantWpp: participantId
          }
        },
        include: { group: true }
      });

      if (!membership || membership.deleted) {
        logger.warn('Participant portal form: envio ao grupo bloqueado — sem membership ativa', {
          participantTail: participantId.slice(-6),
          groupTail: input.idGroupWpp.slice(-6)
        });
        throw new ParticipantPortalAuthError(
          'Não é membro ativo do grupo selecionado ou o grupo é inválido.',
          403
        );
      }
      membershipForSend = membership;
    }

    const row = await this.forms.upsertByParticipantId(participantId, {
      name: input.name,
      pronoun: input.pronoun,
      relationship: input.relationship,
      birthday: input.birthday,
      location: input.location,
      sexualOrientation: input.sexualOrientation,
      favoriteActivity: input.favoriteActivity,
      instagram: input.instagram,
      photoUrl,
      photo,
      photoMimeType,
      sendFormMessageToGroup: input.sendFormMessageToGroup
    });

    let messageSentToGroup = false;
    const warnings: string[] = [];

    if (input.sendFormMessageToGroup && input.idGroupWpp && membershipForSend) {
      const caption = buildCaption({
        name: row.name,
        pronoun: row.pronoun,
        relationship: row.relationship,
        birthday: row.birthday,
        location: row.location,
        sexualOrientation: row.sexualOrientation,
        favoriteActivity: row.favoriteActivity,
        instagram: row.instagram
      });

      const groupJid = membershipForSend.group.whatsappRegistry;
      let imageBuffer: Buffer | undefined;
      let imageMimetype: string | undefined;

      if (row.photo && row.photo.byteLength > 0) {
        imageBuffer = Buffer.from(row.photo);
        imageMimetype = row.photoMimeType ?? undefined;
      } else if (row.photoUrl?.trim()) {
        const diskPath = path.join(this.uploadsRoot, row.photoUrl.replace(/^\//, ''));
        try {
          imageBuffer = await fs.readFile(diskPath);
          imageMimetype = guessMimetypeFromPath(diskPath);
        } catch {
          logger.warn('Participant portal form: foto em disco não lida para envio', {
            pathTail: row.photoUrl.slice(-24)
          });
        }
      }

      const state = await this.baileys.getConnectionState();
      if (!state.isConnected) {
        warnings.push('WhatsApp offline: formulário salvo, mensagem não enviada ao grupo.');
        logger.warn('Participant portal form: WhatsApp offline após gravar');
      } else {
        const ok = await this.baileys.sendGroupFormMessage({
          groupJid,
          caption,
          imageBuffer,
          imageMimetype
        });
        messageSentToGroup = ok;
        if (!ok) {
          warnings.push('Formulário salvo, mas o envio da mensagem ao grupo falhou.');
          logger.error('Participant portal form: falha ao enviar mensagem ao grupo');
        }
      }
    }

    return { formSaved: true, messageSentToGroup, warnings };
  }
}
