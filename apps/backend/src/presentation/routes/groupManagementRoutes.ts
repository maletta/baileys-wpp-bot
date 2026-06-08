import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { GroupWppRepository } from '@/infrastructure/repositories/GroupWppRepository';
import { CommunityConfigRepository } from '@/infrastructure/repositories/CommunityConfigRepository';
import { GroupManagementController } from '@/presentation/controllers/GroupManagementController';

export function createGroupManagementRoutes(
  prisma: PrismaClient,
  authMiddleware: any
): Router {
  const router = Router();
  const groupRepo = new GroupWppRepository(prisma);
  const communityConfigRepo = new CommunityConfigRepository(prisma);
  const controller = new GroupManagementController(prisma, groupRepo, communityConfigRepo);

  router.get(
    '/',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['HIGH_LEVEL_ADMIN', 'GROUP_ADMIN', 'DEVELOPER']),
    (req, res) => void controller.listManageable(req as any, res)
  );

  router.put(
    '/:id',
    authMiddleware.authenticate,
    authMiddleware.requireRole(['HIGH_LEVEL_ADMIN', 'GROUP_ADMIN', 'DEVELOPER']),
    (req, res) => void controller.updateManageable(req as any, res)
  );

  return router;
}
