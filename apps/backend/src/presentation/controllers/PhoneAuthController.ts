import type { Response } from 'express';
import type { Request } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ParticipantWppRepository } from '@/infrastructure/repositories/ParticipantWppRepository';
import { ParticipantTemporaryTokenRepository } from '@/infrastructure/repositories/ParticipantTemporaryTokenRepository';
import type { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';
import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';

const PARTICIPANT_SECRET = process.env.JWT_PARTICIPANT_SECRET || process.env.JWT_SECRET || 'development-participant-jwt';
const DASHBOARD_TOKEN_EXPIRES_SEC = 24 * 60 * 60; // 24h
const REGISTRATION_TTL_MS = 15 * 60 * 1000; // 15 min
const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3333';
const BOT_PHONE = process.env.BOT_PHONE || '5511999999999';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function generateRegToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = 'REG-';
  for (let i = 0; i < 6; i++) {
    token += chars[randomInt(chars.length)];
  }
  return token;
}

export class PhoneAuthController {
  private participantRepo: ParticipantWppRepository;
  private tokenRepo: ParticipantTemporaryTokenRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly baileys: IBaileysSocketService
  ) {
    this.participantRepo = new ParticipantWppRepository(this.prisma);
    this.tokenRepo = new ParticipantTemporaryTokenRepository(this.prisma);
  }

  /**
   * POST /api/auth/initiate
   * Body: { cellphone: string }
   * Response: { flow: 'otp' | 'registration', ... }
   */
  async initiate(req: Request, res: Response): Promise<void> {
    try {
      const rawPhone = req.body.cellphone;
      const cellphone = onlyDigits(rawPhone);
      if (!cellphone || cellphone.length < 10) {
        res.status(400).json({ error: 'Validation Error', message: 'Número de telefone inválido' });
        return;
      }

      const participant = await this.participantRepo.findByCellphoneDigits(cellphone);

      if (participant) {
        // Flow 1: Participante existe → gerar OTP
        const otp = randomInt(100_000, 1_000_000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);

        // Soft delete tokens anteriores
        await this.tokenRepo.softDeleteActiveForParticipant(
          participant.id,
          'AUTHORIZE_PARTICIPANT' as any,
          'PUBLIC_FORM' as any
        );

        // Criar novo token
        await this.tokenRepo.create({
          idParticipantWpp: participant.id,
          type: 'AUTHORIZE_PARTICIPANT' as any,
          context: 'PUBLIC_FORM' as any,
          otpHash,
          expiresAt,
          lastSentAt: new Date(),
          resendCount: 0
        });

        // Enviar OTP via WhatsApp
        const jid = participant.jid || `${participant.whatsappRegistry}`;
        const sent = await this.baileys.sendPrivateText(jid, `Seu código de acesso ao dashboard: ${otp}`);

        res.status(200).json({
          flow: 'otp',
          otpSent: sent,
          participantId: participant.id,
          message: sent ? 'Código enviado para seu WhatsApp' : 'Falha ao enviar código'
        });
      } else {
        // Flow 2: Não existe → criar PendingRegistration
        const token = generateRegToken();
        const expiresAt = new Date(Date.now() + REGISTRATION_TTL_MS);

        await this.prisma.pendingRegistration.create({
          data: { cellphoneDigits: cellphone, token, expiresAt }
        });

        const waLink = `https://wa.me/${onlyDigits(BOT_PHONE)}?text=Quero%20me%20registrar%20${token}`;

        res.status(200).json({
          flow: 'registration',
          token,
          waLink,
          expiresAt: expiresAt.toISOString(),
          message: 'Envie a mensagem no WhatsApp para se registrar'
        });
      }
    } catch (error) {
      logger.error('PhoneAuth initiate', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /api/auth/register-status/:token
   * Polling: returns { done: true, participantId } when registration is complete
   */
  async registerStatus(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token?.startsWith('REG-')) {
        res.status(400).json({ done: false, error: 'Token inválido' });
        return;
      }

      const pending = await this.prisma.pendingRegistration.findUnique({
        where: { token }
      });

      if (!pending) {
        res.status(404).json({ done: false, error: 'Token não encontrado' });
        return;
      }

      if (pending.consumedAt) {
        // Token consumido → registro completo. Buscar participantId pelo cellphone
        const participant = await this.participantRepo.findByCellphoneDigits(pending.cellphoneDigits);
        if (participant) {
          res.status(200).json({ done: true, participantId: participant.id });
          return;
        }
      }

      if (pending.expiresAt < new Date()) {
        res.status(200).json({ done: false, expired: true, message: 'Token expirado. Solicite novamente.' });
        return;
      }

      res.status(200).json({ done: false });
    } catch (error) {
      logger.error('PhoneAuth registerStatus', { error });
      res.status(500).json({ done: false, error: 'Erro interno' });
    }
  }

  /**
   * POST /api/auth/verify-phone
   * Body: { participantId: string, otp: string }
   * Response: { accessToken: string, participantId: string, role: string }
   */
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const { participantId, otp } = req.body;

      if (!participantId || !otp || otp.length !== 6) {
        res.status(400).json({ error: 'Validation Error', message: 'Dados inválidos' });
        return;
      }

      // Buscar token ativo
      const token = await this.prisma.participantTemporaryToken.findFirst({
        where: {
          idParticipantWpp: participantId,
          type: 'AUTHORIZE_PARTICIPANT',
          context: 'PUBLIC_FORM',
          consumedAt: null,
          deletedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!token) {
        res.status(401).json({ error: 'Unauthorized', message: 'Nenhum código válido encontrado' });
        return;
      }

      const valid = await bcrypt.compare(otp, token.otpHash);
      if (!valid) {
        res.status(401).json({ error: 'Unauthorized', message: 'Código inválido' });
        return;
      }

      // Marcar como consumido
      await this.prisma.participantTemporaryToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() }
      });

      // Buscar participante para pegar a role
      const participant = await this.participantRepo.findByCellphoneDigits(
        // We need the cellphone. Let's search by ID directly
        (await this.prisma.participantsWpp.findUnique({ where: { id: participantId }, select: { cellphone: true } }))?.cellphone || ''
      );

      const role = participant ? (participant as any).role || 'MEMBER' : 'MEMBER';

      // Gerar JWT dashboard
      const payload = {
        participantId,
        role,
        authKind: 'phone_dashboard'
      };

      const accessToken = jwt.sign(
        payload,
        PARTICIPANT_SECRET,
        { expiresIn: DASHBOARD_TOKEN_EXPIRES_SEC, subject: participantId } as SignOptions
      );

      res.status(200).json({
        accessToken,
        participantId,
        role,
        authKind: 'phone_dashboard'
      });
    } catch (error) {
      logger.error('PhoneAuth verify', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    }
  }
}
