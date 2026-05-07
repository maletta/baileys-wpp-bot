import { Router, type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { ParticipantFormRepository } from '@/infrastructure/repositories/ParticipantFormRepository';
import type { HybridAuthenticatedRequest } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';
import { HybridParticipantAuthMiddleware } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';
import { ParticipantPortalController } from '@/presentation/controllers/ParticipantPortalController';
import { ListParticipantPortalGroupsUseCase } from '@/application/use-cases/participantPortal/ListParticipantPortalGroupsUseCase';
import { GetParticipantPortalFormUseCase } from '@/application/use-cases/participantPortal/GetParticipantPortalFormUseCase';
import { GetParticipantPortalFormPhotoUseCase } from '@/application/use-cases/participantPortal/GetParticipantPortalFormPhotoUseCase';
import { UpsertParticipantPortalFormUseCase } from '@/application/use-cases/participantPortal/UpsertParticipantPortalFormUseCase';
import type { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';

const portalFormBodySchema = z
  .object({
    participantId: z.string().min(8).max(40).optional(),
    idGroupWpp: z.string().min(8).max(40).optional(),
    sendFormMessageToGroup: z.preprocess(val => {
      if (typeof val === 'boolean') {
        return val;
      }
      const s = String(val ?? '').toLowerCase();
      return s === 'true' || s === '1' || s === 'on' || s === 'yes';
    }, z.boolean()),
    name: z.string().trim().min(1).max(120),
    pronoun: z.string().trim().min(1).max(80),
    relationship: z.string().trim().min(1).max(120),
    birthday: z.coerce.date(),
    location: z.string().trim().min(1).max(200),
    sexualOrientation: z.string().trim().min(1).max(120),
    favoriteActivity: z.string().trim().min(1).max(200),
    instagram: z
      .string()
      .max(200)
      .optional()
      .transform(v => (!v || v.trim() === '' ? null : v.trim())),
  })
  .refine(d => !d.sendFormMessageToGroup || Boolean(d.idGroupWpp?.trim()), {
    message: 'idGroupWpp é obrigatório quando sendFormMessageToGroup está ativo',
    path: ['idGroupWpp']
  });

export function createParticipantPortalRoutes(
  prisma: PrismaClient,
  baileys: IBaileysSocketService
): Router {
  const router = Router();
  const userRepository = new UserRepository(prisma);
  const jwtUserSecret = process.env.JWT_SECRET || 'default-secret';
  const jwtParticipantSecret =
    process.env.JWT_PARTICIPANT_SECRET || process.env.JWT_SECRET || 'development-participant-jwt';

  const hybridAuth = new HybridParticipantAuthMiddleware(
    prisma,
    userRepository,
    jwtUserSecret,
    jwtParticipantSecret
  );

  const uploadRoot = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }

  /** Multipart em memória → gravação na coluna `photo` (BYTEA), sem disco. */
  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
        cb(new Error('INVALID_FILE_TYPE'));
        return;
      }
      cb(null, true);
    }
  });

  const formRepo = new ParticipantFormRepository(prisma);
  const listGroupsUseCase = new ListParticipantPortalGroupsUseCase(prisma);
  const getFormUseCase = new GetParticipantPortalFormUseCase(formRepo);
  const getFormPhotoUseCase = new GetParticipantPortalFormPhotoUseCase(formRepo, uploadRoot);
  const upsertFormUseCase = new UpsertParticipantPortalFormUseCase(prisma, formRepo, baileys, uploadRoot);

  const controller = new ParticipantPortalController(
    listGroupsUseCase,
    getFormUseCase,
    getFormPhotoUseCase,
    upsertFormUseCase
  );

  router.get('/session', hybridAuth.authenticateUserOrParticipant, (req, res) =>
    controller.getSession(req as HybridAuthenticatedRequest, res)
  );

  router.get('/groups', hybridAuth.authenticateUserOrParticipant, (req, res) =>
    void controller.getGroups(req as HybridAuthenticatedRequest, res)
  );

  router.get('/form', hybridAuth.authenticateUserOrParticipant, (req, res) =>
    void controller.getForm(req as HybridAuthenticatedRequest, res)
  );

  router.get('/form/photo', hybridAuth.authenticateUserOrParticipant, (req, res) =>
    void controller.getFormPhoto(req as HybridAuthenticatedRequest, res)
  );

  router.put(
    '/form',
    hybridAuth.authenticateUserOrParticipant,
    (req: Request, res: Response, next) => {
      upload.single('photo')(req, res, err => {
        if (err instanceof multer.MulterError) {
          res.status(400).json({ error: 'Validation Error', message: 'Ficheiro demasiado grande ou inválido' });
          return;
        }
        if (err) {
          logger.info('Participant portal upload rejeitado', { message: String(err) });
          res.status(400).json({ error: 'Validation Error', message: 'Tipo de ficheiro não permitido' });
          return;
        }
        next();
      });
    },
    async (req, res) => {
      try {
        const parsed = portalFormBodySchema.parse(req.body);
        await controller.putForm(req as HybridAuthenticatedRequest & { file?: Express.Multer.File }, res, parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'Dados inválidos',
            details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          });
          return;
        }
        logger.error('Participant portal putForm route', { error });
        res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
      }
    }
  );

  return router;
}
