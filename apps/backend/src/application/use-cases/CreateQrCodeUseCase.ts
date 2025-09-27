import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { v4 as uuidv4 } from 'uuid';

export interface CreateQrCodeRequest {
  userId: string;
}

export interface CreateQrCodeResponse {
  sessionId: string;
  qrCode: string;
  message: string;
}

export class CreateQrCodeUseCase {
  constructor(
    private readonly baileysService: IBaileysSocketService,
    private readonly userRepository: IUserRepository
  ) { }

  async execute(request: CreateQrCodeRequest): Promise<CreateQrCodeResponse> {
    // Validar se usuário existe e tem permissão
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (!user.canManageConnections()) {
      throw new Error('Usuário não tem permissão para gerenciar conexões');
    }

    // Verificar se já existe conexão ativa
    const connectionState = await this.baileysService.getConnectionState();
    if (connectionState.isConnected) {
      throw new Error('Já existe uma conexão ativa');
    }

    // Gerar sessionId único
    const sessionId = uuidv4();

    // Criar conexão e obter QR code
    const qrCode = await this.baileysService.createConnection(sessionId);

    return {
      sessionId,
      qrCode,
      message: 'QR Code gerado com sucesso. Escaneie para conectar.'
    };
  }
}
