import { OAuth2Client } from 'google-auth-library';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { User, UserRole } from '@/domain/entities/User';
import { PrismaClient } from '@prisma/client';

export interface GoogleAuthRequest {
  token: string;
}

export interface GoogleAuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface GoogleUserInfo {
  sub: string; // Google ID
  email: string;
  name?: string;
  picture?: string;
  email_verified: boolean;
}

export class GoogleAuthUseCase {
  private googleClient: OAuth2Client;
  private userRepository: UserRepository;

  constructor(prisma: PrismaClient) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    this.userRepository = new UserRepository(prisma);
  }

  async execute(request: GoogleAuthRequest): Promise<GoogleAuthResponse> {
    try {
      // Verificar o token do Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: request.token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Token do Google inválido');
      }

      const googleUserInfo: GoogleUserInfo = {
        sub: payload.sub,
        email: payload.email!,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified || false,
      };

      // Verificar se o email foi verificado pelo Google
      if (!googleUserInfo.email_verified) {
        throw new Error('Email não verificado pelo Google');
      }

      // Buscar usuário existente pelo googleId ou email
      let user = await this.userRepository.findByGoogleId(googleUserInfo.sub);

      if (!user) {
        // Verificar se existe usuário com o mesmo email
        const existingUserByEmail = await this.userRepository.findByEmail(googleUserInfo.email);

        if (existingUserByEmail) {
          // Atualizar usuário existente com googleId
          user = await this.userRepository.update(existingUserByEmail.id, {
            googleId: googleUserInfo.sub,
            displayName: googleUserInfo.name || existingUserByEmail.displayName || undefined,
            profilePicture: googleUserInfo.picture || existingUserByEmail.profilePicture || undefined,
          });
        } else {
          // Criar novo usuário
          user = await this.userRepository.create({
            googleId: googleUserInfo.sub,
            email: googleUserInfo.email,
            displayName: googleUserInfo.name || undefined,
            profilePicture: googleUserInfo.picture || undefined,
            role: UserRole.MEMBER,
          });
        }
      } else {
        // Atualizar informações do usuário existente
        user = await this.userRepository.update(user.id, {
          displayName: googleUserInfo.name || user.displayName || undefined,
          profilePicture: googleUserInfo.picture || user.profilePicture || undefined,
        });
      }

      // Gerar JWT token
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Erro na autenticação Google:', error);

      if (error instanceof Error) {
        throw new Error(`Falha na autenticação: ${error.message}`);
      }

      throw new Error('Falha na autenticação com Google');
    }
  }

  private generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
    }

    return jwt.sign(
      payload,
      secret,
      {
        expiresIn: '24h',
        issuer: 'whatsapp-baileys-api',
        subject: user.id,
      }
    );
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      type: 'refresh',
    };

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET não está definido nas variáveis de ambiente');
    }

    return jwt.sign(
      payload,
      refreshSecret,
      {
        expiresIn: '7d',
        issuer: 'whatsapp-baileys-api',
        subject: user.id,
      }
    );
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET não está definido nas variáveis de ambiente');
      }

      const decoded = jwt.verify(refreshToken, refreshSecret) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Token de refresh inválido');
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw new Error('Token de refresh inválido ou expirado');
    }
  }
}
