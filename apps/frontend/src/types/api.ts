// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  timestamp?: string;
}

// User Types
export enum UserRole {
  HIGH_LEVEL_ADMIN = 'HIGH_LEVEL_ADMIN',
  GROUP_ADMIN = 'GROUP_ADMIN',
  MEMBER = 'MEMBER',
  DEVELOPER = 'DEVELOPER'
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  profilePicture: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// WhatsApp Connection Types
export interface ConnectionState {
  connected: boolean;
  device?: {
    id: string;
    name: string;
    platform: string;
  };
  sessionId?: string;
  message?: string;
}

export interface QrCodeResponse {
  sessionId: string;
  qrCode: string;
  message: string;
}

// Group Types
export interface Group {
  id: string;
  whatsappRegistry: string;
  name: string;
  linkedParent?: string;
  imageUrl?: string;
  notifyNewUserDetail: boolean;
  onlyRegisteredUserMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupWithParticipants extends Group {
  participants: GroupParticipant[];
}

// Participant Types
export interface Participant {
  id: string;
  whatsappRegistry: string;
  cellphone: string;
  infoName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupParticipant {
  id: string;
  groupId: string;
  participantId: string;
  name?: string;
  linkedParent?: string;
  admin: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  removedAt?: string;
  participant: Participant;
}

// Form Types
export interface ParticipantForm {
  id: string;
  participantId: string;
  name: string;
  pronoun: 'Ele' | 'Ela' | 'Ele/Ela';
  relationship: 'Solteiro(a)' | 'Em relacionamento' | 'Em relacionamento (não mono)';
  birthday: string;
  location: string;
  sexualOrientation: 'Bissexual' | 'Gay' | 'Hétero' | 'Lésbica' | 'Não-binário' | 'Pan';
  /** «Qual seu rolê favorito?» */
  favoriteActivity: string;
  instagram?: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantFormRequest {
  name: string;
  pronoun: string;
  relationship: string;
  birthday: string;
  location: string;
  sexualOrientation: string;
  favoriteActivity: string;
  instagram?: string;
  photo: File;
}

// Token Types
export enum TokenType {
  PARTICIPANT_REGISTER_TOKEN = 'PARTICIPANT_REGISTER_TOKEN',
  PARTICIPANT_ON_GROUP_TOKEN = 'PARTICIPANT_ON_GROUP_TOKEN'
}

export interface TokenRequest {
  cellphone: string;
  groupId?: string;
}

export interface TokenValidation {
  token: string;
}

export interface TokenResponse {
  success: boolean;
  message: string;
  participantInfo?: {
    name: string;
    cellphone: string;
    linkId: string;
    expiresAt: string;
  };
}

// Anonymous Message Types
export interface AnonymousMessage {
  id: string;
  groupId: string;
  message: string;
  approved: boolean;
  createdAt: string;
  sentAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  mentionedParticipants: string[];
  group: Group;
  approvedByUser?: User;
}

export interface CreateAnonymousMessageRequest {
  groupId: string;
  message: string;
  mentionedParticipants: string[];
}

export interface ApproveMessageRequest {
  messageId: string;
}

// Socket Events
export interface SocketEvents {
  'session-frontend-join': (sessionId: string) => void;
  'connection-update': (state: ConnectionState) => void;
  'group-update': (data: { groupId: string; action: string }) => void;
  'participant-update': (data: { groupId: string; participantId: string; action: string }) => void;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface GroupFilter {
  search?: string;
  hasParticipants?: boolean;
}

export interface ParticipantFilter {
  search?: string;
  groupId?: string;
  admin?: boolean;
  deleted?: boolean;
}
