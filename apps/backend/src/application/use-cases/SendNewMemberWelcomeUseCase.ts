import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { IGroupWppRepository } from '@/domain/interfaces/repositories/IGroupWppRepository';
import { ICommunityConfigRepository } from '@/domain/interfaces/repositories/ICommunityConfigRepository';
import { logger } from '@/shared/utils/logger';

const DEFAULT_WELCOME_TEMPLATE =
  'Bem-vindo(a)! 🎉\n\nPreencha seu cadastro no formulário abaixo para que todos possam te conhecer melhor:\n{link}';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3333';

/**
 * Envia mensagem de boas-vindas para o grupo adequado quando um novo membro entra.
 *
 * Regras:
 * - Se o grupo pertence a uma comunidade:
 *   - Só envia mensagem se este grupo for o `notificationGroupId` da comunidade
 *   - A mensagem é enviada PARA este grupo
 *   - O link do formulário usa o slug da comunidade
 * - Se o grupo é standalone (sem linkedParent):
 *   - Envia mensagem para o próprio grupo
 *   - O link do formulário usa o slug do próprio grupo
 */
export class SendNewMemberWelcomeUseCase {
  constructor(
    private readonly groupRepo: IGroupWppRepository,
    private readonly communityConfigRepo: ICommunityConfigRepository,
    private readonly baileys: IBaileysSocketService
  ) { }

  /**
   * @param groupRegistry JID do grupo onde o membro entrou (ex.: "120363426026043948@g.us")
   * @param participantId JID do participante que entrou (ex.: "5511986293165@s.whatsapp.net")
   */
  async execute(groupRegistry: string, participantId: string): Promise<void> {
    try {
      // 1. Buscar o grupo onde o membro entrou
      const group = await this.groupRepo.findByWhatsappRegistry(groupRegistry);
      if (!group) {
        logger.warn('SendNewMemberWelcome: grupo não encontrado', { groupRegistry });
        return;
      }

      // 2. Determinar se deve enviar notificação e para qual grupo
      let targetGroupId: string; // internal DB id of group to send to
      let formSlug: string | undefined;

      if (group.linkedParent) {
        // Grupo pertence a uma comunidade
        const community = await this.groupRepo.findByWhatsappRegistry(group.linkedParent);
        if (!community) {
          logger.warn('SendNewMemberWelcome: comunidade pai não encontrada', {
            groupRegistry,
            linkedParent: group.linkedParent
          });
          return;
        }

        const config = await this.communityConfigRepo.findByGroupWppId(community.id);
        if (!config) {
          logger.info('SendNewMemberWelcome: comunidade sem config', { communityId: community.id });
          return;
        }

        // Só envia notificação se este grupo for o notificationGroupId da comunidade
        if (config.notificationGroupId !== group.id) {
          logger.info('SendNewMemberWelcome: grupo não é notificationGroupId, ignorando', {
            groupId: group.id,
            notificationGroupId: config.notificationGroupId
          });
          return;
        }

        targetGroupId = group.id;
        formSlug = community.formSlug ?? undefined;
      } else {
        // Grupo standalone — envia para si mesmo
        targetGroupId = group.id;
        formSlug = group.formSlug ?? undefined;
      }

      if (!formSlug) {
        logger.warn('SendNewMemberWelcome: grupo sem formSlug, não é possível gerar link', {
          groupRegistry,
          targetGroupId
        });
        return;
      }

      // 3. Buscar o JID do grupo alvo (whatsappRegistry) para enviar a mensagem
      const targetGroup = await this.groupRepo.findById(targetGroupId);
      if (!targetGroup) {
        logger.warn('SendNewMemberWelcome: grupo alvo não encontrado', { targetGroupId });
        return;
      }

      // 4. Buscar a config da comunidade (se houver) para pegar o template
      let welcomeMessage = DEFAULT_WELCOME_TEMPLATE;
      if (group.linkedParent) {
        const community = await this.groupRepo.findByWhatsappRegistry(group.linkedParent);
        if (community) {
          const config = await this.communityConfigRepo.findByGroupWppId(community.id);
          if (config?.welcomeMessageTemplate?.trim()) {
            welcomeMessage = config.welcomeMessageTemplate.trim();
          }
        }
      }

      const formLink = `${FRONTEND_URL}/formulario/${formSlug}`;
      const text = welcomeMessage.replace(/\{link\}/g, formLink);

      // 5. Enviar a mensagem
      const mentions = [participantId];
      await this.baileys.sendMessage({
        groupId: targetGroup.whatsappRegistry,
        message: text,
        mentions
      });

      logger.info('SendNewMemberWelcome: mensagem enviada', {
        targetGroupRegistry: targetGroup.whatsappRegistry,
        participantId: participantId.split('@')[0]?.slice(-4),
        formSlug
      });
    } catch (error) {
      logger.error('SendNewMemberWelcomeUseCase falhou', { error, groupRegistry, participantId });
    }
  }
}
