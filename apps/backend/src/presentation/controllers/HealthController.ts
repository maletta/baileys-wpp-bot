import { Request, Response } from 'express';
import { HealthCheckUseCase } from '@/application/use-cases/HealthCheckUseCase';
import { logger } from '@/shared/utils/logger';

export class HealthController {
  constructor(
    private readonly healthCheckUseCase: HealthCheckUseCase
  ) { }

  /**
   * @route GET /health
   * @desc Verificação de saúde dos serviços
   * @access Public
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthCheckUseCase.execute();

      // Determinar código HTTP baseado no status
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: healthStatus.status === 'healthy',
        data: healthStatus
      });
    } catch (error) {
      logger.error('Error checking health', { error });

      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: 0,
          services: {
            postgres: { status: 'down' },
            mongodb: { status: 'down' },
            whatsapp: { status: 'down' }
          },
          version: process.env.BAILEYS_VERSION || '7.0.0-rc.3',
          environment: process.env.NODE_ENV || 'development'
        },
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Erro ao verificar saúde dos serviços'
      });
    }
  }

  /**
   * @route GET /health/liveness
   * @desc Verificação simples se o servidor está vivo
   * @access Public
   */
  async liveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * @route GET /health/readiness
   * @desc Verificação se o servidor está pronto para receber requisições
   * @access Public
   */
  async readiness(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthCheckUseCase.execute();

      // Considera ready se não estiver completamente unhealthy
      const isReady = healthStatus.status !== 'unhealthy';
      const statusCode = isReady ? 200 : 503;

      res.status(statusCode).json({
        success: isReady,
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        services: healthStatus.services
      });
    } catch (error) {
      logger.error('Error checking readiness', { error });

      res.status(503).json({
        success: false,
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed',
        message: error instanceof Error ? error.message : 'Erro ao verificar prontidão'
      });
    }
  }
}

