import { IQrCodeTryRepository } from '@/domain/interfaces/repositories/IQrCodeTryRepository';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { logger } from '@/shared/utils/logger';

export interface RegisterQrCodeTryRequest {
  userId?: string;
  ipAddress?: string;
}

export interface RegisterQrCodeTryResponse {
  tryId: string;
  message: string;
}

export class RegisterQrCodeTryUseCase {
  constructor(
    private readonly qrCodeTryRepository: IQrCodeTryRepository,
    private readonly userRepository: IUserRepository
  ) { }

  async execute(request: RegisterQrCodeTryRequest): Promise<RegisterQrCodeTryResponse> {
    try {
      // Validar se usuário existe (se userId foi fornecido)
      if (request.userId) {
        const user = await this.userRepository.findById(request.userId);
        if (!user) {
          throw new Error('Usuário não encontrado');
        }

        // Verificar se usuário tem permissão para gerenciar conexões
        if (!user.canManageConnections()) {
          throw new Error('Usuário não tem permissão para gerenciar conexões');
        }
      }

      // Registrar tentativa de QR code
      const qrCodeTry = await this.qrCodeTryRepository.create({
        userId: request.userId,
        ipAddress: request.ipAddress
      });

      logger.info('QR code try registered', {
        tryId: qrCodeTry.id,
        userId: request.userId,
        ipAddress: request.ipAddress
      });

      return {
        tryId: qrCodeTry.id,
        message: 'Tentativa de QR code registrada com sucesso'
      };
    } catch (error) {
      logger.error('Failed to register QR code try', { error, request });
      throw error;
    }
  }
}

