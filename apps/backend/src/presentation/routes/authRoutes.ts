import { Router } from 'express';
import { AuthController } from '@/presentation/controllers/AuthController';
import { AuthMiddleware } from '@/presentation/middlewares/authMiddleware';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { PrismaClient } from '@prisma/client';

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const authController = new AuthController(prisma);

  // Criar instância do middleware de autenticação
  const userRepository = new UserRepository(prisma);
  const authMiddleware = new AuthMiddleware(userRepository, process.env.JWT_SECRET!);

  /**
   * @route POST /api/auth/google
   * @desc Autenticação com Google OAuth
   * @access Public
   * @body { token: string }
   */
  router.post('/google', (req, res) => authController.googleAuth(req, res));

  /**
   * @route POST /api/auth/refresh
   * @desc Renovar access token usando refresh token
   * @access Public
   * @body { refreshToken?: string } (ou via cookie)
   */
  router.post('/refresh', (req, res) => authController.refreshToken(req, res));

  /**
   * @route POST /api/auth/logout
   * @desc Logout do usuário (limpa cookies)
   * @access Public
   */
  router.post('/logout', (req, res) => authController.logout(req, res));

  /**
   * @route GET /api/auth/profile
   * @desc Obter perfil do usuário autenticado
   * @access Private
   */
  router.get('/profile', authMiddleware.authenticate, (req, res) => authController.getProfile(req, res));

  return router;
}
