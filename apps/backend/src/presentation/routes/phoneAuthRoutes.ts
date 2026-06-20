import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { PhoneAuthController } from '@/presentation/controllers/PhoneAuthController';

export function createPhoneAuthRoutes(
  prisma: PrismaClient,
  baileys: IBaileysSocketService
): Router {
  const router = Router();
  const controller = new PhoneAuthController(prisma, baileys);

  router.post('/initiate', (req, res) => void controller.initiate(req, res));
  router.get('/register-status/:token', (req, res) => void controller.registerStatus(req, res));
  router.post('/verify-phone', (req, res) => void controller.verify(req, res));

  return router;
}
