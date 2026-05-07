import { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { logger } from '@/shared/utils/logger';

/** Sessão OTP (formulário público) — claims emitidos em `VerifyParticipantOtpUseCase`. */
export type ParticipantJwtAuthState = {
  kind: 'participant_jwt';
  participantId: string;
};

/** Utilizador Google com um ou mais participantes vinculados (`ParticipantUserLink`). */
export type UserJwtParticipantAuthState = {
  kind: 'user_jwt';
  user: { id: string; email: string; role: string };
  participantIds: string[];
};

export type ParticipantPortalAuthState = ParticipantJwtAuthState | UserJwtParticipantAuthState;

export interface HybridAuthenticatedRequest extends Request {
  participantPortal?: ParticipantPortalAuthState;
}

export interface ParticipantSessionRequest extends Request {
  participantSession?: { participantId: string };
}

function isParticipantSessionPayload(
  decoded: JwtPayload
): decoded is JwtPayload & { authKind: 'participant_session'; participantId: string } {
  return (
    decoded.authKind === 'participant_session' &&
    typeof decoded.participantId === 'string' &&
    decoded.participantId.length > 0 &&
    (decoded.tokenType === undefined || decoded.tokenType === 'temporary')
  );
}

function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    return null;
  }
  return h.slice(7).trim() || null;
}

export class HybridParticipantAuthMiddleware {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userRepository: IUserRepository,
    private readonly jwtUserSecret: string,
    private readonly jwtParticipantSecret: string
  ) {}

  /**
   * Apenas JWT de participante (OTP). Injeta `req.participantSession.participantId`.
   */
  authenticateParticipantSession = async (
    req: ParticipantSessionRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = bearerToken(req);
      if (!token) {
        res.status(401).json({ error: 'Unauthorized', message: 'Token de acesso requerido' });
        return;
      }

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, this.jwtParticipantSecret) as JwtPayload;
      } catch {
        logger.info('Participant session auth: JWT inválido (assinatura/exp)');
        res.status(401).json({ error: 'Unauthorized', message: 'Token inválido ou expirado' });
        return;
      }

      if (!isParticipantSessionPayload(decoded)) {
        logger.info('Participant session auth: payload inesperado');
        res.status(401).json({ error: 'Unauthorized', message: 'Token inválido' });
        return;
      }

      const row = await this.prisma.participantsWpp.findUnique({
        where: { id: decoded.participantId },
        select: { id: true }
      });
      if (!row) {
        logger.warn('Participant session auth: participante inexistente', {
          participantTail: decoded.participantId.slice(-6)
        });
        res.status(401).json({ error: 'Unauthorized', message: 'Sessão inválida' });
        return;
      }

      req.participantSession = { participantId: row.id };
      next();
    } catch (error) {
      logger.error('Participant session auth: erro inesperado', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  };

  /**
   * JWT de participante (OTP) **ou** JWT de utilizador Google com links ativos.
   * Injeta `req.participantPortal`.
   */
  authenticateUserOrParticipant = async (
    req: HybridAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = bearerToken(req);
      if (!token) {
        res.status(401).json({ error: 'Unauthorized', message: 'Token de acesso requerido' });
        return;
      }

      let decodedParticipant: JwtPayload | null = null;
      try {
        decodedParticipant = jwt.verify(token, this.jwtParticipantSecret) as JwtPayload;
      } catch {
        decodedParticipant = null;
      }

      if (decodedParticipant && isParticipantSessionPayload(decodedParticipant)) {
        const row = await this.prisma.participantsWpp.findUnique({
          where: { id: decodedParticipant.participantId },
          select: { id: true }
        });
        if (!row) {
          logger.warn('Hybrid participant auth: JWT participante sem registo', {
            participantTail: decodedParticipant.participantId.slice(-6)
          });
          res.status(401).json({ error: 'Unauthorized', message: 'Sessão inválida' });
          return;
        }
        req.participantPortal = { kind: 'participant_jwt', participantId: row.id };
        next();
        return;
      }

      let decodedUser: JwtPayload;
      try {
        decodedUser = jwt.verify(token, this.jwtUserSecret) as JwtPayload;
      } catch {
        logger.info('Hybrid participant auth: token não é utilizador nem participante válido');
        res.status(401).json({ error: 'Unauthorized', message: 'Token inválido ou expirado' });
        return;
      }

      const userId = typeof decodedUser.userId === 'string' ? decodedUser.userId : null;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'Token inválido' });
        return;
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized', message: 'Utilizador não encontrado' });
        return;
      }

      const now = new Date();
      const links = await this.prisma.participantUserLink.findMany({
        where: {
          idUser: user.id,
          expiresAt: { gt: now }
        },
        select: { idParticipant: true }
      });

      const participantIds = [...new Set(links.map(l => l.idParticipant))];
      if (participantIds.length === 0) {
        logger.info('Hybrid participant auth: utilizador sem participante vinculado', {
          userTail: user.id.slice(-6)
        });
        res.status(403).json({
          error: 'Forbidden',
          message: 'Nenhum participante WhatsApp vinculado a esta conta. Vincule um participante para continuar.'
        });
        return;
      }

      req.participantPortal = {
        kind: 'user_jwt',
        user: { id: user.id, email: user.email, role: user.role },
        participantIds
      };
      next();
    } catch (error) {
      logger.error('Hybrid participant auth: erro inesperado', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  };
}
