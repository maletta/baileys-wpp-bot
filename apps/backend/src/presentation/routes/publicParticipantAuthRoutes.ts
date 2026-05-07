import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  ParticipantAuthorizationContext,
  ParticipantTemporaryTokenType
} from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { IParticipantWppRepository } from '@/domain/interfaces/repositories/IParticipantWppRepository';
import { ParticipantTemporaryTokenRepository } from '@/infrastructure/repositories/ParticipantTemporaryTokenRepository';
import type { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { IssueParticipantOtpUseCase } from '@/application/use-cases/publicParticipantAuth/IssueParticipantOtpUseCase';
import {
  NoActiveOtpError,
  ResendLimitExceededError,
  ResendParticipantOtpUseCase,
  ResendTooSoonError
} from '@/application/use-cases/publicParticipantAuth/ResendParticipantOtpUseCase';
import {
  VerifyParticipantOtpInvalidError,
  VerifyParticipantOtpUseCase
} from '@/application/use-cases/publicParticipantAuth/VerifyParticipantOtpUseCase';
import { logger } from '@/shared/utils/logger';

const contextSchema = z.enum([ParticipantAuthorizationContext.PUBLIC_FORM]);
const tokenTypeSchema = z.enum([ParticipantTemporaryTokenType.AUTHORIZE_PARTICIPANT]);

function toDigits(value: string): string {
  return value.replace(/\D/g, '');
}

const cellphoneInputSchema = z
  .string()
  .min(1, 'Telefone é obrigatório')
  .max(32, 'Telefone inválido')
  .transform(toDigits)
  .pipe(z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'));

const requestOtpBodySchema = z.object({
  cellphone: cellphoneInputSchema,
  context: contextSchema,
  type: tokenTypeSchema
});

const verifyOtpBodySchema = z.object({
  cellphone: cellphoneInputSchema,
  otp: z.string().regex(/^\d{6}$/, 'Código deve ter 6 dígitos'),
  context: contextSchema,
  type: tokenTypeSchema
});

function buildMessagingConfig() {
  const appDisplayName = process.env.APP_DISPLAY_NAME || 'Aplicação';
  const formLabel = process.env.PUBLIC_AUTH_LABEL_PUBLIC_FORM || 'Formulário';
  return {
    appDisplayName,
    labelForContext(ctx: ParticipantAuthorizationContext): string {
      if (ctx === ParticipantAuthorizationContext.PUBLIC_FORM) {
        return formLabel;
      }
      return formLabel;
    }
  };
}

function buildAuthNumeric(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface PublicParticipantAuthRoutesDeps {
  prisma: PrismaClient;
  participantRepo: IParticipantWppRepository;
  baileys: IBaileysSocketService;
}

export function createPublicParticipantAuthRoutes(deps: PublicParticipantAuthRoutesDeps): Router {
  const router = Router();
  const tokenRepo = new ParticipantTemporaryTokenRepository(deps.prisma);
  const messaging = buildMessagingConfig();

  const issueConfig = {
    otpTtlMs: buildAuthNumeric('PUBLIC_AUTH_OTP_TTL_MS', 24 * 60 * 60 * 1000),
    issueMinIntervalMs: buildAuthNumeric('PUBLIC_AUTH_ISSUE_MIN_INTERVAL_MS', 90_000)
  };

  const resendConfig = {
    otpTtlMs: buildAuthNumeric('PUBLIC_AUTH_OTP_TTL_MS', 24 * 60 * 60 * 1000),
    resendCooldownMs: buildAuthNumeric('PUBLIC_AUTH_RESEND_COOLDOWN_MS', 60_000),
    resendMaxPerChain: buildAuthNumeric('PUBLIC_AUTH_RESEND_MAX', 10)
  };

  const verifyConfig = {
    jwtParticipantSecret:
      process.env.JWT_PARTICIPANT_SECRET || process.env.JWT_SECRET || 'development-participant-jwt',
    jwtParticipantExpiresInSec: buildAuthNumeric('JWT_PARTICIPANT_EXPIRES_SEC', 24 * 60 * 60)
  };

  if (!process.env.JWT_PARTICIPANT_SECRET && process.env.NODE_ENV === 'production') {
    logger.error('JWT_PARTICIPANT_SECRET não definido em produção — defina um segredo dedicado.');
  }

  const issueUseCase = new IssueParticipantOtpUseCase(
    deps.participantRepo,
    tokenRepo,
    deps.baileys,
    messaging,
    issueConfig
  );

  const resendUseCase = new ResendParticipantOtpUseCase(
    deps.participantRepo,
    tokenRepo,
    deps.baileys,
    messaging,
    resendConfig
  );

  const verifyUseCase = new VerifyParticipantOtpUseCase(
    deps.participantRepo,
    tokenRepo,
    verifyConfig
  );

  const windowMs = buildAuthNumeric('PUBLIC_AUTH_RATE_WINDOW_MS', 15 * 60 * 1000);
  const maxIssue = buildAuthNumeric('PUBLIC_AUTH_RATE_MAX_ISSUE', 40);
  const maxVerify = buildAuthNumeric('PUBLIC_AUTH_RATE_MAX_VERIFY', 25);

  const issueLimiter = rateLimit({
    windowMs,
    limit: maxIssue,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Public participant auth rate limit (issue)', {
        path: req.path,
        ip: req.ip
      });
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Muitas tentativas. Aguarde e tente novamente.'
      });
    }
  });

  const verifyLimiter = rateLimit({
    windowMs,
    limit: maxVerify,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Public participant auth rate limit (verify)', {
        path: req.path,
        ip: req.ip
      });
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Muitas tentativas. Aguarde e tente novamente.'
      });
    }
  });

  router.post('/request-otp', issueLimiter, async (req: Request, res: Response) => {
    try {
      const body = requestOtpBodySchema.parse(req.body);
      const result = await issueUseCase.execute({
        cellphoneDigits: body.cellphone,
        context: body.context,
        type: body.type
      });
      res.status(200).json({
        ok: true,
        otpSent: result.otpSent,
        nextRequestAfterSec: result.nextRequestAfterSec
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.info('Public participant auth validation error (request-otp)', {
          issues: error.errors.map(e => ({ path: e.path.join('.'), code: e.code }))
        });
        res.status(400).json({
          error: 'Validation Error',
          message: 'Dados inválidos',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
        return;
      }
      logger.error('Public participant auth request-otp failed', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  });

  router.post('/resend-otp', issueLimiter, async (req: Request, res: Response) => {
    try {
      const body = requestOtpBodySchema.parse(req.body);
      const result = await resendUseCase.execute({
        cellphoneDigits: body.cellphone,
        context: body.context,
        type: body.type
      });
      res.status(200).json({
        ok: true,
        otpSent: result.otpSent,
        nextRequestAfterSec: result.nextRequestAfterSec
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Dados inválidos',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
        return;
      }
      if (error instanceof ResendTooSoonError) {
        res.set('Retry-After', String(error.retryAfterSec));
        res.status(429).json({
          error: 'Too Many Requests',
          message: error.message,
          retryAfterSec: error.retryAfterSec
        });
        return;
      }
      if (error instanceof ResendLimitExceededError) {
        res.status(429).json({ error: 'Too Many Requests', message: error.message });
        return;
      }
      if (error instanceof NoActiveOtpError) {
        res.status(400).json({ error: 'Bad Request', message: error.message });
        return;
      }
      logger.error('Public participant auth resend-otp failed', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  });

  router.post('/verify-otp', verifyLimiter, async (req: Request, res: Response) => {
    try {
      const body = verifyOtpBodySchema.parse(req.body);
      const result = await verifyUseCase.execute({
        cellphoneDigits: body.cellphone,
        otp: body.otp,
        context: body.context,
        type: body.type
      });
      res.status(200).json({ ok: true, accessToken: result.accessToken });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Dados inválidos',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
        return;
      }
      if (error instanceof VerifyParticipantOtpInvalidError) {
        res.status(401).json({ error: 'Unauthorized', message: error.message });
        return;
      }
      logger.error('Public participant auth verify-otp failed', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  });

  return router;
}
