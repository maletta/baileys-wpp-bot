import { Router, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { GroupWppRepository } from '@/infrastructure/repositories/GroupWppRepository';
import { logger } from '@/shared/utils/logger';

export function createFormSlugRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const groupRepo = new GroupWppRepository(prisma);

  /**
   * GET /api/public/form-slug/:slug
   * Valida um slug de grupo/comunidade e retorna suas informações.
   * Usado pelo frontend em /formulario/[slug] para exibir GroupHeader.
   */
  router.get('/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      if (!slug || slug.length < 2 || slug.length > 80) {
        res.status(400).json({ valid: false, error: 'Slug inválido' });
        return;
      }

      const group = await groupRepo.findByFormSlug(slug);
      if (!group) {
        res.status(404).json({ valid: false, error: 'Grupo não encontrado' });
        return;
      }

      // Se for comunidade, também retornar o notificationGroupId
      let notificationGroupId: string | null = null;
      if (group.isCommunity) {
        const prismaGroup = await prisma.communityConfig.findUnique({
          where: { groupWppId: group.id }
        });
        notificationGroupId = prismaGroup?.notificationGroupId ?? null;
      }

      res.status(200).json({
        valid: true,
        group: {
          id: group.id,
          name: group.name,
          imageUrl: group.imageUrl,
          whatsappRegistry: group.whatsappRegistry,
          isCommunity: group.isCommunity,
          notificationGroupId
        }
      });
    } catch (error) {
      logger.error('Form slug validation failed', { error, slug: req.params.slug });
      res.status(500).json({ valid: false, error: 'Erro interno do servidor' });
    }
  });

  return router;
}
