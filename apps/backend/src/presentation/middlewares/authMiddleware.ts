import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { logger } from '@/shared/utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class AuthMiddleware {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtSecret: string
  ) { }

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token de acesso requerido'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (!decoded.userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token inválido'
        });
        return;
      }

      // Get user from database
      const user = await this.userRepository.findById(decoded.userId);

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      logger.error('Authentication error', { error });

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token inválido'
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  };

  requireRole = (requiredRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Autenticação requerida'
        });
        return;
      }

      if (!requiredRoles.includes(req.user.role)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Permissão insuficiente'
        });
        return;
      }

      next();
    };
  };
}
