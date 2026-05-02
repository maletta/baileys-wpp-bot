export interface ConnectionState {
  isConnected: boolean;
  deviceInfo?: {
    id: string;
    name: string;
    platform: string;
  };
  qrCode?: string;
  sessionId?: string;
}

export interface BaileysGroupData {
  id: string;
  subject: string;
  linkedParent?: string;
  participants: BaileysParticipantData[];
  creation?: number;
  owner?: string;
  desc?: string;
}

export interface BaileysParticipantData {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
  /** JID PN completo quando o Baileys preenche (ex.: groupMetadata). */
  phoneNumber?: string;
  lid?: string;
}

/** Referência a um participante em eventos `group-participants.update` (remove / promote / demote). */
export interface BaileysParticipantRef {
  id: string;
  phoneNumber?: string;
}

/** Origem do callback `onParticipantJoin` — persistir só em `group-participants-update-add`. */
export interface ParticipantJoinContext {
  source: 'group-participants-update-add' | 'messages-upsert-stub-27';
  /** JID `...@s.whatsapp.net` quando presente no payload. */
  participantPnJid?: string;
  /** Se o membro entra já como admin (superadmin conta como admin na BD). */
  membershipAdmin?: boolean;
}

export interface SendMessageOptions {
  groupId: string;
  message: string;
  mentions?: string[];
}

export interface IBaileysSocketService {
  // Connection Management
  createConnection(sessionId: string): Promise<string>; // Returns QR code
  getConnectionState(): Promise<ConnectionState>;
  disconnect(): Promise<void>;
  /**
   * Fecha o socket Baileys sem logout no WhatsApp e sem apagar credenciais em disco.
   * Usar em SIGINT/SIGTERM para poder restaurar a sessão após reiniciar o processo.
   */
  shutdownPreservingCredentials(): Promise<void>;
  /** Recria o socket Baileys a partir de credenciais em disco (após reinício do processo). */
  tryRestorePersistedSession(): Promise<void>;

  // Group Operations
  getGroupData(groupId: string): Promise<BaileysGroupData>;
  getAllGroups(): Promise<BaileysGroupData[]>;
  /** URL da foto do grupo ou contacto; devolve null se indisponível. */
  getProfilePictureUrl(jid: string): Promise<string | null>;
  sendMessage(options: SendMessageOptions): Promise<boolean>;

  // Event Listeners
  onConnectionUpdate(callback: (state: ConnectionState) => void): void;
  onQrCodeGenerated(callback: (qrCode: string, sessionId: string) => void): void;
  onConnectionEstablished(callback: (sessionId: string, deviceInfo: any) => void): void;
  onConnectionFailed(callback: (sessionId: string, error: string) => void): void;
  onGroupJoin(callback: (groupData: BaileysGroupData) => void): void;
  onParticipantJoin(
    callback: (
      groupId: string,
      participantId: string,
      context?: ParticipantJoinContext
    ) => void
  ): void;
  onParticipantLeave(callback: (groupId: string, participants: BaileysParticipantRef[]) => void): void;
  onGroupUpdate(
    callback: (
      groupId: string,
      action: 'promote' | 'demote',
      participants: BaileysParticipantRef[]
    ) => void
  ): void;
}
