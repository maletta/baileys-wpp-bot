import makeWASocket, {
  ConnectionState as WAConnectionState,
  WASocket,
  useMultiFileAuthState,
  DisconnectReason,
  GroupMetadata,
  proto
} from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import QRCodeTerminal from 'qrcode-terminal';
import path from 'path';
import {
  IBaileysSocketService,
  ConnectionState,
  BaileysGroupData,
  BaileysParticipantData,
  SendMessageOptions
} from '@/domain/interfaces/services/IBaileysSocketService';
import { logger } from '@/shared/utils/logger';

export class BaileysSocketService implements IBaileysSocketService {
  private socket: WASocket | null = null;
  private connectionState: ConnectionState = { isConnected: false };
  private currentSessionId: string | null = null;

  // Event callbacks
  private connectionUpdateCallbacks: Array<(state: ConnectionState) => void> = [];
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
      this.currentSessionId = sessionId;
      const sessionDir = path.join(this.sessionPath, sessionId);

      // Setup authentication state
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      // Create socket connection
      this.socket = makeWASocket({
        auth: state,
        version: [2, 2429, 4], // Versão do WhatsApp Web compatível
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        browser: [this.browserName, 'Desktop', this.browserVersion],
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        getMessage: this.getMessageFromMongoDB.bind(this),
        syncFullHistory: false,
        maxMsgRetryCount: 3,
        logger: logger as any
      });

      // Setup event listeners
      this.setupEventListeners(saveCreds);

      // Return promise that resolves when QR code is generated
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for QR code'));
        }, 30000);

        this.socket!.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            clearTimeout(timeout);
            try {
              // Generate QR code string
              const qrCodeString = await QRCode.toDataURL(qr);

              // Print QR code in terminal
              QRCodeTerminal.generate(qr, { small: true });

              logger.info('QR Code generated', { sessionId });
              resolve(qrCodeString);
            } catch (error) {
              reject(error);
            }
          }

          if (connection === 'close') {
            clearTimeout(timeout);
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
              logger.info('Connection closed, attempting to reconnect', { sessionId });
              // Could implement reconnection logic here
            } else {
              logger.info('Connection closed permanently', { sessionId });
              reject(new Error('Connection closed'));
            }
          } else if (connection === 'open') {
            clearTimeout(timeout);
            logger.info('WhatsApp connection established', { sessionId });
            this.updateConnectionState({
              isConnected: true,
              sessionId,
              deviceInfo: {
                id: this.socket!.user?.id || '',
                name: this.socket!.user?.name || '',
                platform: 'WhatsApp'
              }
            });
          }
        });
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
    if (this.socket) {
      await this.socket.logout();
      this.socket = null;
      this.updateConnectionState({ isConnected: false });
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
    this.socket.ev.on('group-participants.update', (update) => {
      const { id: groupId, participants, action } = update;

      switch (action) {
        case 'add':
          participants.forEach(participantId => {
            this.participantJoinCallbacks.forEach(callback => callback(groupId, participantId));
          });
          break;

        case 'remove':
          this.participantLeaveCallbacks.forEach(callback => callback(groupId, participants));
          break;

        case 'promote':
        case 'demote':
          this.groupUpdateCallbacks.forEach(callback => callback(groupId, action, participants));
          break;
      }
    });

    // Messages (for participant join/leave detection via message stubs)
    this.socket.ev.on('messages.upsert', (messageUpdate) => {
      messageUpdate.messages.forEach(message => {
        // Handle message stub types for participant events
        if (message.messageStubType === 27) { // Participant joined
          const groupId = message.key.remoteJid!;
          const participantId = message.participant!;
          this.participantJoinCallbacks.forEach(callback => callback(groupId, participantId));
        }
      });
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
}
