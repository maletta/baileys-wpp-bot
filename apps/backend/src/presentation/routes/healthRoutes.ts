import { Router } from 'express';
import { HealthController } from '@/presentation/controllers/HealthController';
import { HealthCheckUseCase } from '@/application/use-cases/HealthCheckUseCase';
import { PrismaClient } from '@prisma/client';
import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';

export function createHealthRoutes(
  prisma: PrismaClient,
  baileysService: IBaileysSocketService
): Router {
  const router = Router();

  // Criar instâncias
  const healthCheckUseCase = new HealthCheckUseCase(prisma, baileysService);
  const healthController = new HealthController(healthCheckUseCase);

  /**
   * @route GET /health
   * @desc Health check completo - verifica PostgreSQL, MongoDB e WhatsApp
   * @access Public
   * @response 200 - Todos os serviços saudáveis
   * @response 503 - Um ou mais serviços com problemas
   */
  router.get('/', (req, res) => healthController.healthCheck(req, res));

  /**
   * @route GET /health/liveness
   * @desc Liveness probe - verifica se o servidor está vivo
   * @access Public
   * @response 200 - Servidor está vivo
   * @note Usado por Kubernetes/Docker para verificar se o container deve ser reiniciado
   */
  router.get('/liveness', (req, res) => healthController.liveness(req, res));

  /**
   * @route GET /health/readiness
   * @desc Readiness probe - verifica se o servidor está pronto para tráfego
   * @access Public
   * @response 200 - Servidor está pronto
   * @response 503 - Servidor não está pronto
   * @note Usado por Kubernetes/Docker para verificar se deve enviar tráfego
   */
  router.get('/readiness', (req, res) => healthController.readiness(req, res));

  return router;
}

