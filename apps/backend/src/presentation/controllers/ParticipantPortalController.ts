import type { Response } from 'express';
import type { HybridAuthenticatedRequest } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';
import type { ListParticipantPortalGroupsUseCase } from '@/application/use-cases/participantPortal/ListParticipantPortalGroupsUseCase';
import type { GetParticipantPortalFormUseCase } from '@/application/use-cases/participantPortal/GetParticipantPortalFormUseCase';
import type { GetParticipantPortalFormPhotoUseCase } from '@/application/use-cases/participantPortal/GetParticipantPortalFormPhotoUseCase';
import type {
  UpsertParticipantPortalFormUseCase,
  UpsertParticipantPortalFormInput
} from '@/application/use-cases/participantPortal/UpsertParticipantPortalFormUseCase';
import { ParticipantPortalAuthError } from '@/shared/utils/participantPortalAuth';
import { logger } from '@/shared/utils/logger';

/**
 * Endpoints do “portal participante” (Google ou JWT temporário).
 */
export class ParticipantPortalController {
  constructor(
    private readonly listGroupsUseCase: ListParticipantPortalGroupsUseCase,
    private readonly getFormUseCase: GetParticipantPortalFormUseCase,
    private readonly getFormPhotoUseCase: GetParticipantPortalFormPhotoUseCase,
    private readonly upsertFormUseCase: UpsertParticipantPortalFormUseCase
  ) {}

  /**
   * Confirma autenticação híbrida e devolve participantes resolvidos (sem dados sensíveis).
   */
  getSession(req: HybridAuthenticatedRequest, res: Response): void {
    const auth = req.participantPortal;
    if (!auth) {
      res.status(500).json({ error: 'Internal Server Error', message: 'Estado de autenticação ausente' });
      return;
    }

    if (auth.kind === 'participant_jwt') {
      res.status(200).json({
        ok: true,
        authMode: 'participant_otp',
        participantIds: [auth.participantId]
      });
      return;
    }

    res.status(200).json({
      ok: true,
      authMode: 'google',
      participantIds: auth.participantIds,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role
      }
    });
  }

  async getGroups(req: HybridAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auth = req.participantPortal;
      if (!auth) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Estado de autenticação ausente' });
        return;
      }
      const groups = await this.listGroupsUseCase.execute(auth);
      res.status(200).json({ ok: true, groups });
    } catch (error) {
      logger.error('Participant portal getGroups', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }

  async getForm(req: HybridAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auth = req.participantPortal;
      if (!auth) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Estado de autenticação ausente' });
        return;
      }
      const participantId = typeof req.query.participantId === 'string' ? req.query.participantId : undefined;
      const form = await this.getFormUseCase.execute(auth, participantId, stored =>
        `/uploads/${stored.replace(/^\//, '')}`
      );
      res.status(200).json({ ok: true, form });
    } catch (error) {
      if (error instanceof ParticipantPortalAuthError) {
        res.status(error.statusCode).json({ error: 'Request Error', message: error.message });
        return;
      }
      logger.error('Participant portal getForm', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }

  /** Imagem do formulário (bytes na DB ou ficheiro legado em disco). */
  async getFormPhoto(req: HybridAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auth = req.participantPortal;
      if (!auth) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Estado de autenticação ausente' });
        return;
      }
      const participantId = typeof req.query.participantId === 'string' ? req.query.participantId : undefined;
      const result = await this.getFormPhotoUseCase.execute(auth, participantId);
      if (!result) {
        res.status(404).json({ error: 'Not Found', message: 'Foto não disponível' });
        return;
      }
      logger.info('Participant portal: foto do formulário entregue após autorização');
      res.setHeader('Content-Type', result.mime);
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.send(result.buffer);
    } catch (error) {
      if (error instanceof ParticipantPortalAuthError) {
        res.status(error.statusCode).json({ error: 'Request Error', message: error.message });
        return;
      }
      logger.error('Participant portal getFormPhoto', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }

  async putForm(
    req: HybridAuthenticatedRequest & { file?: Express.Multer.File },
    res: Response,
    parsed: UpsertParticipantPortalFormInput
  ): Promise<void> {
    try {
      const auth = req.participantPortal;
      if (!auth) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Estado de autenticação ausente' });
        return;
      }

      const newPhotoBuffer = req.file?.buffer;
      const newPhotoMimeType = req.file?.mimetype;

      const result = await this.upsertFormUseCase.execute(auth, {
        ...parsed,
        newPhotoBuffer,
        newPhotoMimeType
      });

      res.status(200).json({
        ok: true,
        messageSentToGroup: result.messageSentToGroup,
        warnings: result.warnings
      });
    } catch (error) {
      if (error instanceof ParticipantPortalAuthError) {
        res.status(error.statusCode).json({ error: 'Request Error', message: error.message });
        return;
      }
      logger.error('Participant portal putForm', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }
}
