import { Request, Response } from 'express';
import { GoogleAuthUseCase } from '@/application/use-cases/GoogleAuthUseCase';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const googleAuthSchema = z.object({
  token: z.string().min(1, 'Token do Google é obrigatório'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export class AuthController {
  private googleAuthUseCase: GoogleAuthUseCase;

  constructor(prisma: PrismaClient) {
    this.googleAuthUseCase = new GoogleAuthUseCase(prisma);
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      // Validar dados de entrada
      const validatedData = googleAuthSchema.parse(req.body);

      // Executar caso de uso
      const result = await this.googleAuthUseCase.execute({
        token: validatedData.token,
      });

      // Definir cookie httpOnly para o refresh token (opcional, mais seguro)
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });
      }

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            displayName: result.user.displayName,
            profilePicture: result.user.profilePicture,
            role: result.user.role,
            createdAt: result.user.createdAt,
          },
          accessToken: result.accessToken,
          // Não enviar refreshToken no body por segurança (vai no cookie)
        },
      });
    } catch (error) {
      console.error('Erro no login Google:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Tentar pegar refresh token do cookie primeiro, depois do body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token não fornecido',
        });
        return;
      }

      // Validar refresh token
      const validatedData = refreshTokenSchema.parse({ refreshToken });

      // Renovar access token
      const result = await this.googleAuthUseCase.refreshAccessToken(validatedData.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Token de refresh inválido ou expirado',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Limpar cookie do refresh token
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      console.error('Erro no logout:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // O usuário já está disponível no req.user através do middleware de auth
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Perfil do usuário',
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            profilePicture: user.profilePicture,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
}
