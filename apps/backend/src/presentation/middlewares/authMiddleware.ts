import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { logger } from '@/shared/utils/logger';

const PARTICIPANT_SECRET = process.env.JWT_PARTICIPANT_SECRET || process.env.JWT_SECRET || 'development-participant-jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  /** Presente quando auth via phone dashboard JWT. */
  participantId?: string;
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

      const token = authHeader.substring(7);

      // Tenta JWT de phone dashboard primeiro (authKind: phone_dashboard)
      try {
        const phoneDecoded = jwt.verify(token, PARTICIPANT_SECRET) as any;
        if (phoneDecoded.authKind === 'phone_dashboard' && phoneDecoded.participantId) {
          req.user = {
            id: phoneDecoded.participantId,
            email: '',
            role: phoneDecoded.role || 'MEMBER'
          };
          req.participantId = phoneDecoded.participantId;
          next();
          return;
        }
      } catch {
        // Não é JWT de phone, continua para tentar Google JWT
      }

      // Tenta JWT Google
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (!decoded.userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token inválido'
        });
        return;
      }

      const user = await this.userRepository.findById(decoded.userId);

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Usuário não encontrado'
        });
        return;
      }

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

  requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Autenticação requerida'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Permissão negada'
        });
        return;
      }

      next();
    };
  };
}
