import type { GroupMetadata } from '@whiskeysockets/baileys';

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
  /** Comunidade raiz (metadado WhatsApp `GroupMetadata.isCommunity`). */
  isCommunity?: boolean;
  /** Grupo de anúncios ligado a uma comunidade (`GroupMetadata.isCommunityAnnounce`). */
  isCommunityAnnounce?: boolean;
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

/** Contexto do callback `onParticipantJoin` (sempre `group-participants.update`, action `add`). */
export interface ParticipantJoinContext {
  /** JID `...@s.whatsapp.net` quando presente no payload. */
  participantPnJid?: string;
  /** Se o membro entra já como admin (superadmin conta como admin na BD). */
  membershipAdmin?: boolean;
  /** Quem entrou é o utilizador desta sessão (instância Baileys atual). */
  sessionUserJoin?: boolean;
}

/** Payload de `socket.ev('groups.update')` — array de metadados parciais. */
export type BaileysGroupsUpdatePayload = Partial<GroupMetadata>[];

export interface SendMessageOptions {
  groupId: string;
  message: string;
  mentions?: string[];
}

export interface SendGroupFormMessageOptions {
  /** JID do grupo (ex.: `...@g.us`). */
  groupJid: string;
  caption: string;
  imageBuffer?: Buffer;
  /** Ex.: image/jpeg */
  imageMimetype?: string;
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
  /**
   * Indica se o identificador corresponde ao utilizador desta sessão (compara PN/LID em `creds.me`).
   */
  isSessionUserParticipant(participantId: string, participantPnJid?: string): boolean;
  sendMessage(options: SendMessageOptions): Promise<boolean>;
  /** Mensagem de texto para chat privado (JID PN ou `@lid`). */
  sendPrivateText(jid: string, text: string): Promise<boolean>;
  /** Resumo do formulário no grupo: legenda + imagem opcional. */
  sendGroupFormMessage(options: SendGroupFormMessageOptions): Promise<boolean>;

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
  /**
   * Disparado após o processamento interno de `groups.update` (logs + profilePicture).
   * Útil para persistir `desc` / foto em `groups_wpp`.
   */
  onGroupsUpdate(
    callback: (updates: BaileysGroupsUpdatePayload) => void | Promise<void>
  ): void;
}
