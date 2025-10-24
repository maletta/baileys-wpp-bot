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
  phoneNumber?: string;
  lid?: string;
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

  // Group Operations
  getGroupData(groupId: string): Promise<BaileysGroupData>;
  getAllGroups(): Promise<BaileysGroupData[]>;
  sendMessage(options: SendMessageOptions): Promise<boolean>;

  // Event Listeners
  onConnectionUpdate(callback: (state: ConnectionState) => void): void;
  onQrCodeGenerated(callback: (qrCode: string, sessionId: string) => void): void;
  onConnectionEstablished(callback: (sessionId: string, deviceInfo: any) => void): void;
  onConnectionFailed(callback: (sessionId: string, error: string) => void): void;
  onGroupJoin(callback: (groupData: BaileysGroupData) => void): void;
  onParticipantJoin(callback: (groupId: string, participantId: string) => void): void;
  onParticipantLeave(callback: (groupId: string, participantIds: string[]) => void): void;
  onGroupUpdate(callback: (groupId: string, action: 'promote' | 'demote', participantIds: string[]) => void): void;
}
