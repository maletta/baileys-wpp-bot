import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { User, UserRole } from '@/domain/entities/User';
import jwt from 'jsonwebtoken';

export interface AuthenticateUserRequest {
  googleToken: string;
}

export interface AuthenticateUserResponse {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    profilePicture: string | null;
    role: UserRole;
  };
  accessToken: string;
}

export interface GoogleUserData {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export class AuthenticateUserWithGoogleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtSecret: string
  ) { }

  async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    // Validar token do Google e extrair dados do usuário
    const googleUserData = await this.validateGoogleToken(request.googleToken);

    // Verificar se usuário já existe
    let user = await this.userRepository.findByGoogleId(googleUserData.id);

    if (!user) {
      // Criar novo usuário
      user = await this.userRepository.create({
        googleId: googleUserData.id,
        email: googleUserData.email,
        displayName: googleUserData.name,
        profilePicture: googleUserData.picture,
        role: UserRole.MEMBER // Role padrão
      });
    }

    // Gerar JWT token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        role: user.role
      },
      accessToken
    };
  }

  private async validateGoogleToken(token: string): Promise<GoogleUserData> {
    // TODO: Implementar validação real do token Google
    // Por enquanto, simular dados para desenvolvimento
    throw new Error('Google token validation not implemented');
  }
}
