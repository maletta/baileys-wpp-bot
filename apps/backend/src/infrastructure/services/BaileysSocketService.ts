import makeWASocket, {
  ConnectionState as WAConnectionState,
  WASocket,
  useMultiFileAuthState,
  DisconnectReason,
  GroupMetadata,
  proto,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import QRCodeTerminal from 'qrcode-terminal';
import pino from 'pino';
import path from 'path';
import {
  IBaileysSocketService,
  ConnectionState,
  BaileysGroupData,
  BaileysParticipantData,
  SendMessageOptions
} from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';

// Logger do Pino para Baileys (mais silencioso)
const baileysLogger = pino({
  level: process.env.BAILEYS_LOG_LEVEL || 'silent' // Opções: 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'
});

export class BaileysSocketService implements IBaileysSocketService {
  private socket: WASocket | null = null;
  private connectionState: ConnectionState = { isConnected: false };
  private currentSessionId: string | null = null;
  private qrCodeGenerationTimeout: NodeJS.Timeout | null = null;
  private qrCodePromiseResolve: ((value: string) => void) | null = null;
  private qrCodePromiseReject: ((reason: any) => void) | null = null;

  // Event callbacks
  private connectionUpdateCallbacks: Array<(state: ConnectionState) => void> = [];
  private qrCodeCallbacks: Array<(qrCode: string, sessionId: string) => void> = [];
  private connectionEstablishedCallbacks: Array<(sessionId: string, deviceInfo: any) => void> = [];
  private connectionFailedCallbacks: Array<(sessionId: string, error: string) => void> = [];
  private groupJoinCallbacks: Array<(groupData: BaileysGroupData) => void> = [];
  private participantJoinCallbacks: Array<(groupId: string, participantId: string) => void> = [];
  private participantLeaveCallbacks: Array<(groupId: string, participantIds: string[]) => void> = [];
  private groupUpdateCallbacks: Array<(groupId: string, action: 'promote' | 'demote', participantIds: string[]) => void> = [];

  constructor(
    private readonly sessionPath: string,
    private readonly browserName: string = 'Chrome',
    private readonly browserVersion: string = '1.0.0'
  ) { }

  async createConnection(sessionId: string): Promise<string> {
    try {
      // Verificar se já existe uma conexão ativa
      if (this.socket && this.connectionState.isConnected) {
        throw new Error('Já existe uma conexão ativa');
      }

      this.currentSessionId = sessionId;
      const sessionDir = path.join(this.sessionPath, sessionId);

      // Setup authentication state
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      // Buscar versão mais recente do WhatsApp Web
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info('Using WhatsApp Web version', { version: version.join('.'), isLatest });

      // Create socket connection
      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
        },
        printQRInTerminal: false,
        browser: ['WhatsApp Bot', 'Chrome', '120.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: this.getMessageFromMongoDB.bind(this),
        logger: baileysLogger,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 250,
        connectTimeoutMs: 60_000,
        qrTimeout: 40_000,
      });

      // Setup event listeners
      this.setupEventListeners(saveCreds);
      this.setupConnectionEventListener(sessionId);

      // Return promise that resolves when QR code is generated
      return new Promise((resolve, reject) => {
        this.qrCodePromiseResolve = resolve;
        this.qrCodePromiseReject = reject;

        this.qrCodeGenerationTimeout = setTimeout(() => {
          this.qrCodePromiseResolve = null;
          this.qrCodePromiseReject = null;
          reject(new Error('Timeout waiting for QR code'));
        }, 60000); // 60 segundos timeout
      });

    } catch (error) {
      logger.error('Failed to create Baileys connection', { error, sessionId });
      throw error;
    }
  }

  async getConnectionState(): Promise<ConnectionState> {
    return this.connectionState;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.qrCodeGenerationTimeout) {
        clearTimeout(this.qrCodeGenerationTimeout);
        this.qrCodeGenerationTimeout = null;
      }

      if (this.socket) {
        // Guardar sessionId antes de limpar
        const sessionIdToClean = this.currentSessionId;

        await this.socket.logout();
        this.socket = null;
        this.currentSessionId = null;
        this.updateConnectionState({ isConnected: false });

        // Limpar pasta de sessão
        if (sessionIdToClean) {
          const sessionDir = path.join(this.sessionPath, sessionIdToClean);
          this.clearSessionDir(sessionDir);
        }
      }
    } catch (error) {
      logger.error('Error disconnecting', { error });
      throw error;
    }
  }

  async getGroupData(groupId: string): Promise<BaileysGroupData> {
    if (!this.socket) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const groupMetadata = await this.socket.groupMetadata(groupId);
      return this.convertGroupMetadata(groupMetadata);
    } catch (error) {
      logger.error('Failed to get group data', { error, groupId });
      throw error;
    }
  }

  async getAllGroups(): Promise<BaileysGroupData[]> {
    if (!this.socket) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const groups = await this.socket.groupFetchAllParticipating();
      return Object.values(groups).map(group => this.convertGroupMetadata(group));
    } catch (error) {
      logger.error('Failed to get all groups', { error });
      throw error;
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<boolean> {
    if (!this.socket) {
      throw new Error('WhatsApp not connected');
    }

    try {
      let message = options.message;

      // Add mentions if provided
      if (options.mentions && options.mentions.length > 0) {
        const mentionText = options.mentions.map(id => `@${id.split('@')[0]}`).join(' ');
        message = `${mentionText}\n\n${message}`;
      }

      await this.socket.sendMessage(options.groupId, {
        text: message,
        mentions: options.mentions
      });

      logger.info('Message sent successfully', {
        groupId: options.groupId,
        mentionsCount: options.mentions?.length || 0
      });

      return true;
    } catch (error) {
      logger.error('Failed to send message', { error, options });
      return false;
    }
  }

  // Event listener setup methods
  onConnectionUpdate(callback: (state: ConnectionState) => void): void {
    this.connectionUpdateCallbacks.push(callback);
  }

  onQrCodeGenerated(callback: (qrCode: string, sessionId: string) => void): void {
    this.qrCodeCallbacks.push(callback);
  }

  onConnectionEstablished(callback: (sessionId: string, deviceInfo: any) => void): void {
    this.connectionEstablishedCallbacks.push(callback);
  }

  onConnectionFailed(callback: (sessionId: string, error: string) => void): void {
    this.connectionFailedCallbacks.push(callback);
  }

  onGroupJoin(callback: (groupData: BaileysGroupData) => void): void {
    this.groupJoinCallbacks.push(callback);
  }

  onParticipantJoin(callback: (groupId: string, participantId: string) => void): void {
    this.participantJoinCallbacks.push(callback);
  }

  onParticipantLeave(callback: (groupId: string, participantIds: string[]) => void): void {
    this.participantLeaveCallbacks.push(callback);
  }

  onGroupUpdate(callback: (groupId: string, action: 'promote' | 'demote', participantIds: string[]) => void): void {
    this.groupUpdateCallbacks.push(callback);
  }

  private setupConnectionEventListener(sessionId: string): void {
    if (!this.socket) return;

    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code gerado
      if (qr) {
        try {
          if (this.qrCodeGenerationTimeout) {
            clearTimeout(this.qrCodeGenerationTimeout);
            this.qrCodeGenerationTimeout = null;
          }

          // Generate QR code data URL
          const qrCodeString = await QRCode.toDataURL(qr);

          // Print QR code in terminal para debug
          QRCodeTerminal.generate(qr, { small: true });

          logger.info('QR Code generated', { sessionId });

          // Resolver a Promise de createConnection
          if (this.qrCodePromiseResolve) {
            this.qrCodePromiseResolve(qrCodeString);
            this.qrCodePromiseResolve = null;
            this.qrCodePromiseReject = null;
          }

          // Notificar todos os listeners de QR code
          this.qrCodeCallbacks.forEach(callback => callback(qrCodeString, sessionId));
        } catch (error) {
          logger.error('Error generating QR code', { error, sessionId });

          // Rejeitar a Promise de createConnection
          if (this.qrCodePromiseReject) {
            this.qrCodePromiseReject(error);
            this.qrCodePromiseResolve = null;
            this.qrCodePromiseReject = null;
          }

          this.connectionFailedCallbacks.forEach(callback =>
            callback(sessionId, 'Erro ao gerar QR code')
          );
        }
      }

      // Conexão fechada
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Boom)?.message || 'Conexão fechada';

        // Determinar se deve reconectar baseado no motivo da desconexão
        const shouldReconnect = this.shouldReconnect(statusCode);

        logger.info('Connection closed', {
          sessionId,
          shouldReconnect,
          errorMessage,
          statusCode,
          reason: this.getDisconnectReason(statusCode)
        });

        this.updateConnectionState({ isConnected: false });

        // Rejeitar a Promise se ainda estiver pendente (apenas se não vai reconectar)
        if (this.qrCodePromiseReject && !shouldReconnect) {
          this.qrCodePromiseReject(new Error(errorMessage));
          this.qrCodePromiseResolve = null;
          this.qrCodePromiseReject = null;
        }

        if (shouldReconnect) {
          // Reconectar automaticamente após 5 segundos
          logger.info('Attempting to reconnect', { sessionId, delaySeconds: 5 });
          setTimeout(async () => {
            try {
              logger.info('Reconnecting to WhatsApp', { sessionId });
              const sessionDir = path.join(this.sessionPath, sessionId);
              const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
              const { version } = await fetchLatestBaileysVersion();

              this.socket = makeWASocket({
                version,
                auth: {
                  creds: state.creds,
                  keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
                },
                printQRInTerminal: false,
                browser: ['WhatsApp Bot', 'Chrome', '120.0.0'],
                syncFullHistory: false,
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                getMessage: this.getMessageFromMongoDB.bind(this),
                logger: baileysLogger,
                defaultQueryTimeoutMs: 60000,
              });

              this.setupEventListeners(saveCreds);
              this.setupConnectionEventListener(sessionId);
            } catch (error) {
              logger.error('Failed to reconnect', { error, sessionId });
              this.connectionFailedCallbacks.forEach(callback =>
                callback(sessionId, `Erro ao reconectar: ${errorMessage}`)
              );
            }
          }, 5000);
        } else {
          // Conexão foi deslogada ou erro crítico - limpar dados da sessão
          logger.warn('Connection requires new session', {
            sessionId,
            statusCode,
            reason: this.getDisconnectReason(statusCode),
            message: 'Sessão será limpa. Um novo QR code será necessário.'
          });

          const sessionDir = path.join(this.sessionPath, sessionId);
          this.clearSessionDir(sessionDir);

          this.connectionFailedCallbacks.forEach(callback =>
            callback(sessionId, errorMessage)
          );

          // Limpar socket
          this.socket = null;
          this.currentSessionId = null;
        }
      }

      // Conexão estabelecida com sucesso
      if (connection === 'open') {
        logger.info('WhatsApp connection established', { sessionId });

        const deviceInfo = {
          id: this.socket!.user?.id || '',
          name: this.socket!.user?.name || '',
          platform: 'WhatsApp'
        };

        this.updateConnectionState({
          isConnected: true,
          sessionId,
          deviceInfo
        });

        // Notificar todos os listeners de conexão estabelecida
        this.connectionEstablishedCallbacks.forEach(callback =>
          callback(sessionId, deviceInfo)
        );
      }
    });
  }

  private setupEventListeners(saveCreds: () => Promise<void>): void {
    if (!this.socket) return;

    // Credentials update
    this.socket.ev.on('creds.update', saveCreds);

    // Group events
    this.socket.ev.on('groups.upsert', (groups) => {
      groups.forEach(group => {
        const groupData = this.convertGroupMetadata(group);
        this.groupJoinCallbacks.forEach(callback => callback(groupData));
      });
    });

    // Group participant updates
    this.socket.ev.on('group-participants.update', async (update) => {
      // ========================================
      // LOG COMPLETO DO EVENTO DE PARTICIPANTES
      // ========================================
      console.log('\n\n========== GROUP PARTICIPANTS UPDATE EVENT ==========');
      console.log('OBJETO COMPLETO DO EVENTO:');
      console.log(JSON.stringify(update, null, 2));
      console.log('====================================================\n');

      const { id: groupId, participants, action } = update;
      const participantIds = participants.map((p: any) => typeof p === 'string' ? p : p.id);

      switch (action) {
        case 'add':
          console.log('\n🟢 EVENTO: PARTICIPANTE(S) ADICIONADO(S) AO GRUPO');
          console.log('Group ID:', groupId);
          console.log('Participants IDs:', participantIds);

          // Buscar dados completos do grupo
          try {
            console.log('\n--- Buscando metadados completos do grupo ---');
            const groupMetadata = await this.socket!.groupMetadata(groupId);
            console.log('METADADOS COMPLETOS DO GRUPO:');
            console.log(JSON.stringify(groupMetadata, null, 2));
          } catch (error) {
            console.error('Erro ao buscar metadados do grupo:', error);
          }

          // Para cada participante que entrou, buscar dados individuais
          for (const participantId of participantIds) {
            console.log(`\n--- Dados do participante: ${participantId} ---`);

            try {
              // Verificar se o número está no WhatsApp e obter informações
              console.log('Tentando buscar dados com onWhatsApp()...');
              const onWhatsAppData = await this.socket!.onWhatsApp(participantId);
              console.log('RESULTADO onWhatsApp():');
              console.log(JSON.stringify(onWhatsAppData, null, 2));
            } catch (error) {
              console.error('Erro ao buscar onWhatsApp:', error);
            }

            try {
              // Buscar foto de perfil do participante
              console.log('Tentando buscar foto de perfil...');
              const profilePicUrl = await this.socket!.profilePictureUrl(participantId, 'image');
              console.log('URL DA FOTO DE PERFIL:', profilePicUrl);
            } catch (error) {
              console.error('Erro ao buscar foto de perfil (pode não ter):', error);
            }

            try {
              // Buscar status do participante
              console.log('Tentando buscar status...');
              const status = await this.socket!.fetchStatus(participantId);
              console.log('STATUS DO PARTICIPANTE:');
              console.log(JSON.stringify(status, null, 2));
            } catch (error) {
              console.error('Erro ao buscar status:', error);
            }

            // Buscar informações do participante no grupo
            try {
              console.log('Buscando informações atualizadas do grupo para ver dados do participante...');
              const updatedGroupMeta = await this.socket!.groupMetadata(groupId);
              const participantInGroup = updatedGroupMeta.participants.find(p => p.id === participantId);
              console.log('DADOS DO PARTICIPANTE NO GRUPO:');
              console.log(JSON.stringify(participantInGroup, null, 2));
            } catch (error) {
              console.error('Erro ao buscar dados do participante no grupo:', error);
            }

            console.log(`--- Fim dos dados de ${participantId} ---\n`);
          }

          // Chamar callbacks originais
          participantIds.forEach(participantId => {
            this.participantJoinCallbacks.forEach(callback => callback(groupId, participantId));
          });
          break;

        case 'remove':
          console.log('\n🔴 EVENTO: PARTICIPANTE(S) REMOVIDO(S) DO GRUPO');
          console.log('Group ID:', groupId);
          console.log('Participants IDs:', participantIds);

          this.participantLeaveCallbacks.forEach(callback => callback(groupId, participantIds));
          break;

        case 'promote':
        case 'demote':
          console.log(`\n⚪ EVENTO: PARTICIPANTE(S) ${action.toUpperCase()}`);
          console.log('Group ID:', groupId);
          console.log('Participants IDs:', participantIds);

          this.groupUpdateCallbacks.forEach(callback => callback(groupId, action, participantIds));
          break;
      }

      console.log('\n========== FIM DO EVENTO ==========\n\n');
    });

    // Messages (for participant join/leave detection via message stubs)
    this.socket.ev.on('messages.upsert', async (messageUpdate) => {
      console.log('\n\n========== MESSAGES UPSERT EVENT ==========');
      console.log('OBJETO COMPLETO DO MESSAGE UPDATE:');
      console.log(JSON.stringify(messageUpdate, null, 2));
      console.log('==========================================\n');

      for (const message of messageUpdate.messages) {
        // Handle message stub types for participant events
        console.log('\nVerificando message stub type:', message.messageStubType);

        if (message.messageStubType === 27) { // Participant joined
          console.log('\n🟢 MESSAGE STUB: PARTICIPANTE ENTROU (tipo 27)');
          console.log('MENSAGEM COMPLETA:');
          console.log(JSON.stringify(message, null, 2));

          const groupId = message.key.remoteJid!;
          const participantId = message.participant!;

          console.log('Group ID:', groupId);
          console.log('Participant ID:', participantId);

          // Buscar dados do participante via message stub
          try {
            console.log('\n--- Buscando dados do participante que entrou ---');

            // messageStubParameters pode conter informações adicionais
            if (message.messageStubParameters) {
              console.log('MESSAGE STUB PARAMETERS:');
              console.log(JSON.stringify(message.messageStubParameters, null, 2));
            }

            // Buscar metadados do grupo
            const groupMetadata = await this.socket!.groupMetadata(groupId);
            const participantInGroup = groupMetadata.participants.find(p => p.id === participantId);
            console.log('PARTICIPANTE NO GRUPO:');
            console.log(JSON.stringify(participantInGroup, null, 2));

            // Tentar buscar informações adicionais
            try {
              const onWhatsAppData = await this.socket!.onWhatsApp(participantId);
              console.log('DADOS onWhatsApp:');
              console.log(JSON.stringify(onWhatsAppData, null, 2));
            } catch (error) {
              console.error('Erro ao buscar onWhatsApp:', error);
            }

          } catch (error) {
            console.error('Erro ao buscar dados do participante:', error);
          }

          this.participantJoinCallbacks.forEach(callback => callback(groupId, participantId));
        }

        // Logar outros tipos de message stubs relacionados a grupos
        if (message.messageStubType) {
          const stubTypes: Record<number, string> = {
            27: 'Participante entrou',
            28: 'Participante saiu',
            29: 'Participante removido',
            30: 'Participante promovido a admin',
            31: 'Participante removido de admin',
            32: 'Grupo criado',
            // Adicione mais conforme necessário
          };

          if (stubTypes[message.messageStubType]) {
            console.log(`\nMESSAGE STUB DETECTADO: ${stubTypes[message.messageStubType]} (tipo ${message.messageStubType})`);
          }
        }
      }

      console.log('\n========== FIM DO MESSAGES EVENT ==========\n\n');
    });
  }

  private convertGroupMetadata(group: GroupMetadata): BaileysGroupData {
    return {
      id: group.id,
      subject: group.subject,
      linkedParent: group.linkedParent,
      participants: group.participants.map(p => ({
        id: p.id,
        admin: p.admin,
        phoneNumber: p.id.split('@')[0],
        lid: (p as any).lid
      })),
      creation: group.creation,
      owner: group.owner || '',
      desc: group.desc
    };
  }

  private updateConnectionState(newState: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...newState };
    this.connectionUpdateCallbacks.forEach(callback => callback(this.connectionState));
  }

  private async getMessageFromMongoDB(key: proto.IMessageKey): Promise<proto.IMessage | undefined> {
    // TODO: Implement MongoDB message retrieval
    logger.debug('Getting message from MongoDB', { key });
    return undefined;
  }

  /**
   * Determina se deve reconectar baseado no código de status da desconexão
   */
  private shouldReconnect(statusCode: number | undefined): boolean {
    if (!statusCode) return true; // Sem código específico, tenta reconectar

    // Não reconectar em casos específicos que requerem novo QR code
    const doNotReconnect = [
      DisconnectReason.loggedOut,           // Usuário fez logout
      DisconnectReason.badSession,          // Sessão inválida/corrompida
      DisconnectReason.restartRequired,     // Requer reinício completo com novo QR code
    ];

    return !doNotReconnect.includes(statusCode);
  }

  /**
   * Obtém descrição do motivo de desconexão
   */
  private getDisconnectReason(statusCode: number | undefined): string {
    if (!statusCode) return 'Desconhecido';

    // Nota: connectionLost e timedOut têm o mesmo valor (408), então só incluímos um
    const reasons: Record<number, string> = {
      [DisconnectReason.badSession]: 'Sessão Inválida',
      [DisconnectReason.connectionClosed]: 'Conexão Fechada',
      [DisconnectReason.timedOut]: 'Tempo Esgotado / Conexão Perdida', // 408 (connectionLost tem mesmo valor)
      [DisconnectReason.connectionReplaced]: 'Conexão Substituída (outro dispositivo)',
      [DisconnectReason.loggedOut]: 'Deslogado',
      [DisconnectReason.restartRequired]: 'Reinício Necessário',
      [DisconnectReason.unavailableService]: 'Serviço Indisponível',
      403: 'Acesso Negado (Forbidden)',
      411: 'Incompatibilidade Multi-Dispositivo'
    };

    return reasons[statusCode] || `Código ${statusCode} - Desconhecido`;
  }

  private clearSessionDir(sessionDir: string): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info('Session directory cleared', { sessionDir });
      }
    } catch (error) {
      logger.warn('Could not clear session directory', { error, sessionDir });
    }
  }
}
