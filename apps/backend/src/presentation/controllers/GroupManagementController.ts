import type { Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '@/presentation/middlewares/authMiddleware';
import type { IGroupWppRepository } from '@/domain/interfaces/repositories/IGroupWppRepository';
import type { ICommunityConfigRepository } from '@/domain/interfaces/repositories/ICommunityConfigRepository';
import { logger } from '@/shared/utils/logger';

export class GroupManagementController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly groupRepo: IGroupWppRepository,
    private readonly communityConfigRepo: ICommunityConfigRepository
  ) { }

  /**
   * GET /api/groups/manage
   * Lista grupos/comunidades onde o usuário autenticado é admin.
   */
  async listManageable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'Usuário não autenticado' });
        return;
      }

      // Buscar memberships onde o usuário é admin
      const adminMemberships = await this.prisma.participantGroupWpp.findMany({
        where: {
          admin: true,
          deleted: false,
          participant: {
            userLinks: {
              some: { idUser: userId }
            }
          }
        },
        include: {
          group: true
        }
      });

      const groupIds = [...new Set(adminMemberships.map(m => m.idGroupWpp))];
      const groups = await this.groupRepo.findByIds(groupIds);

      const result = await Promise.all(
        groups.map(async (g) => {
          let config = null;
          if (g.isCommunity) {
            const cc = await this.communityConfigRepo.findByGroupWppId(g.id);
            if (cc) {
              config = {
                notificationGroupId: cc.notificationGroupId,
                welcomeMessageTemplate: cc.welcomeMessageTemplate
              };
            }
          }
          return {
            id: g.id,
            name: g.name,
            whatsappRegistry: g.whatsappRegistry,
            isCommunity: g.isCommunity,
            formSlug: g.formSlug,
            imageUrl: g.imageUrl,
            config
          };
        })
      );

      res.status(200).json({ ok: true, groups: result });
    } catch (error) {
      logger.error('GroupManagement listManageable', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }

  /**
   * PUT /api/groups/:id/manage
   * Atualiza formSlug, notificationGroupId e welcomeMessageTemplate.
   */
  async updateManageable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { formSlug, notificationGroupId, welcomeMessageTemplate } = req.body;

      // Validar slug único
      if (formSlug !== undefined && formSlug !== null) {
        const existing = await this.groupRepo.findByFormSlug(formSlug);
        if (existing && existing.id !== id) {
          res.status(409).json({ error: 'Conflict', message: 'Slug já está em uso por outro grupo.' });
          return;
        }
      }

      // Atualizar GroupWpp
      if (formSlug !== undefined) {
        await this.groupRepo.update(id, { formSlug: formSlug || null });
      }

      // Atualizar CommunityConfig se for comunidade
      const group = await this.groupRepo.findById(id);
      if (group?.isCommunity) {
        const existingConfig = await this.communityConfigRepo.findByGroupWppId(id);
        if (existingConfig) {
          await this.communityConfigRepo.update(id, {
            notificationGroupId: notificationGroupId !== undefined ? notificationGroupId : undefined,
            welcomeMessageTemplate: welcomeMessageTemplate !== undefined ? welcomeMessageTemplate : undefined
          });
        } else if (notificationGroupId || welcomeMessageTemplate) {
          await this.communityConfigRepo.create({
            groupWppId: id,
            notificationGroupId: notificationGroupId || undefined,
            welcomeMessageTemplate: welcomeMessageTemplate || undefined
          });
        }
      }

      res.status(200).json({ ok: true, message: 'Configurações atualizadas.' });
    } catch (error) {
      logger.error('GroupManagement updateManageable', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }
}
