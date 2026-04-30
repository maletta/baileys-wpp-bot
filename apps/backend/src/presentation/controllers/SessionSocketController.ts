import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { IQrCodeTryRepository } from '@/domain/interfaces/repositories/IQrCodeTryRepository';
import { RegisterQrCodeTryUseCase } from '@/application/use-cases/RegisterQrCodeTryUseCase';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class SessionSocketController {
  private activeSessionRequests: Map<string, string> = new Map(); // sessionId -> socketId

  constructor(
    private readonly io: Server,
    private readonly baileysService: IBaileysSocketService,
    private readonly userRepository: IUserRepository,
    private readonly qrCodeTryRepository: IQrCodeTryRepository,
    private readonly jwtSecret: string
  ) {
    this.setupSocketListeners();
    this.setupBaileysListeners();
  }

  private setupSocketListeners(): void {
    // Middleware de autenticação para conexões socket
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Token de autenticação não fornecido'));
        }

        const decoded = verify(token, this.jwtSecret) as any;

        if (!decoded.userId) {
          return next(new Error('Token inválido'));
        }

        // Verificar se usuário existe
        const user = await this.userRepository.findById(decoded.userId);
        if (!user) {
          return next(new Error('Usuário não encontrado'));
        }

        // Adicionar informações do usuário ao socket
        socket.userId = user.id;
        socket.userRole = user.role;

        next();
      } catch (error) {
        logger.error('Socket authentication error', { error });
        next(new Error('Falha na autenticação'));
      }
    });

    // Evento de conexão
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('Socket client connected', {
        socketId: socket.id,
        userId: socket.userId
      });

      // Handler para requisição de QR code
      socket.on('session:request-qr', async (callback) => {
        await this.handleRequestQrCode(socket, callback);
      });

      // Handler para verificar status da sessão
      socket.on('session:check-status', async (callback) => {
        await this.handleCheckStatus(socket, callback);
      });

      // Handler para desconectar sessão
      socket.on('session:disconnect', async (callback) => {
        await this.handleDisconnect(socket, callback);
      });

      // Handler para desconexão do socket
      socket.on('disconnect', () => {
        logger.info('Socket client disconnected', {
          socketId: socket.id,
          userId: socket.userId
        });

        // Remover sessão ativa se existir
        for (const [sessionId, socketId] of this.activeSessionRequests.entries()) {
          if (socketId === socket.id) {
            this.activeSessionRequests.delete(sessionId);
            break;
          }
        }
      });
    });
  }

  private setupBaileysListeners(): void {
    // Listener para QR codes gerados
    this.baileysService.onQrCodeGenerated((qrCode: string, sessionId: string) => {
      const socketId = this.activeSessionRequests.get(sessionId);

      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);

        if (socket) {
          logger.info('Emitting QR code to client', { socketId, sessionId });
          socket.emit('session:qr-code', { qrCode, sessionId });
        }
      }
    });

    // Listener para conexão estabelecida
    this.baileysService.onConnectionEstablished((sessionId: string, deviceInfo: any) => {
      const socketId = this.activeSessionRequests.get(sessionId);

      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);

        if (socket) {
          logger.info('Emitting connection established to client', { socketId, sessionId });
          socket.emit('session:connected', {
            sessionId,
            device: deviceInfo,
            message: 'Dispositivo conectado com sucesso!'
          });

          // Remover da lista de sessões ativas
          this.activeSessionRequests.delete(sessionId);
        }
      }
    });

    // Listener para falha de conexão
    this.baileysService.onConnectionFailed((sessionId: string, error: string) => {
      const socketId = this.activeSessionRequests.get(sessionId);

      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);

        if (socket) {
          logger.info('Emitting connection failed to client', { socketId, sessionId, error });
          socket.emit('session:error', {
            sessionId,
            error,
            message: 'Falha ao conectar dispositivo'
          });

          // Remover da lista de sessões ativas
          this.activeSessionRequests.delete(sessionId);
        }
      }
    });
  }

  private async handleRequestQrCode(socket: AuthenticatedSocket, callback: Function): Promise<void> {
    try {
      // Verificar se usuário tem permissão (DEVELOPER ou HIGH_LEVEL_ADMIN)
      if (socket.userRole !== 'DEVELOPER' && socket.userRole !== 'HIGH_LEVEL_ADMIN') {
        return callback({
          success: false,
          error: 'Permissão negada. Apenas desenvolvedores podem gerenciar conexões.'
        });
      }

      // Verificar se já existe uma conexão ativa
      const connectionState = await this.baileysService.getConnectionState();
      if (connectionState.isConnected) {
        return callback({
          success: false,
          error: 'Já existe uma conexão ativa',
          connected: true,
          device: connectionState.deviceInfo
        });
      }

      // Registrar tentativa de QR code
      const registerQrCodeTryUseCase = new RegisterQrCodeTryUseCase(
        this.qrCodeTryRepository,
        this.userRepository
      );

      const ipAddress = socket.handshake.address;
      await registerQrCodeTryUseCase.execute({
        userId: socket.userId,
        ipAddress
      });

      // Gerar novo session ID
      const sessionId = uuidv4();

      // Registrar socket como aguardando QR code
      this.activeSessionRequests.set(sessionId, socket.id);

      // Criar conexão do Baileys (isso irá gerar o QR code)
      try {
        await this.baileysService.createConnection(sessionId);

        callback({
          success: true,
          sessionId,
          message: 'Aguardando geração do QR code...'
        });
      } catch (error: any) {
        this.activeSessionRequests.delete(sessionId);
        throw error;
      }

    } catch (error: any) {
      logger.error('Error handling request QR code', { error, userId: socket.userId });
      callback({
        success: false,
        error: error.message || 'Erro ao gerar QR code'
      });
    }
  }

  private async handleCheckStatus(socket: AuthenticatedSocket, callback: Function): Promise<void> {
    try {
      const connectionState = await this.baileysService.getConnectionState();

      callback({
        success: true,
        connected: connectionState.isConnected,
        device: connectionState.deviceInfo,
        sessionId: connectionState.sessionId
      });
    } catch (error: any) {
      logger.error('Error checking session status', { error, userId: socket.userId });
      callback({
        success: false,
        error: error.message || 'Erro ao verificar status da sessão'
      });
    }
  }

  private async handleDisconnect(socket: AuthenticatedSocket, callback: Function): Promise<void> {
    try {
      // Verificar permissões
      if (socket.userRole !== 'DEVELOPER' && socket.userRole !== 'HIGH_LEVEL_ADMIN') {
        return callback({
          success: false,
          error: 'Permissão negada'
        });
      }

      await this.baileysService.disconnect();

      logger.info('Session disconnected by user', { userId: socket.userId });

      callback({
        success: true,
        message: 'Sessão desconectada com sucesso'
      });
    } catch (error: any) {
      logger.error('Error disconnecting session', { error, userId: socket.userId });
      callback({
        success: false,
        error: error.message || 'Erro ao desconectar sessão'
      });
    }
  }
}

