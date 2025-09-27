import { Response } from 'express';
import { AuthenticatedRequest } from '@/presentation/middlewares/authMiddleware';
import { CreateQrCodeUseCase } from '@/application/use-cases/CreateQrCodeUseCase';
import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';

export class SessionController {
  constructor(
    private readonly createQrCodeUseCase: CreateQrCodeUseCase,
    private readonly baileysService: IBaileysSocketService
  ) { }

  async createQrCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'Token inválido' });
        return;
      }

      const result = await this.createQrCodeUseCase.execute({ userId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error creating QR code', { error, userId: req.user?.id });

      res.status(400).json({
        error: 'Bad Request',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async getSessionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const connectionState = await this.baileysService.getConnectionState();

      if (connectionState.isConnected) {
        res.status(200).json({
          success: true,
          data: {
            connected: true,
            device: connectionState.deviceInfo,
            sessionId: connectionState.sessionId
          }
        });
      } else {
        res.status(200).json({
          success: true,
          data: {
            connected: false,
            message: 'Nenhum dispositivo conectado'
          }
        });
      }
    } catch (error) {
      logger.error('Error getting session status', { error });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao verificar status da sessão'
      });
    }
  }

  async disconnectSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'Token inválido' });
        return;
      }

      // Verificar permissões do usuário seria feito aqui
      await this.baileysService.disconnect();

      res.status(200).json({
        success: true,
        message: 'Sessão desconectada com sucesso'
      });
    } catch (error) {
      logger.error('Error disconnecting session', { error, userId: req.user?.id });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao desconectar sessão'
      });
    }
  }
}
