import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { storage } from '@/lib/utils';
import type {
  ApiResponse,
  AuthResponse,
  User,
  ConnectionState,
  QrCodeResponse,
  Group,
  Participant,
  AnonymousMessage,
  CreateAnonymousMessageRequest,
  ApproveMessageRequest,
  TokenRequest,
  TokenValidation,
  TokenResponse,
  CreateParticipantFormRequest,
  ParticipantForm
} from '@/types/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = storage.get('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          storage.remove('accessToken');
          storage.remove('user');

          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async googleAuth(token: string): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/google', {
      token
    });
    return response.data.data!;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.client.get<ApiResponse<{ user: User }>>('/auth/profile');
    return response.data.data!;
  }

  // Session endpoints
  async createQrCode(): Promise<QrCodeResponse> {
    const response = await this.client.post<ApiResponse<QrCodeResponse>>('/session/create-qr-code');
    return response.data.data!;
  }

  async getSessionStatus(): Promise<ConnectionState> {
    const response = await this.client.get<ApiResponse<ConnectionState>>('/session');
    return response.data.data!;
  }

  async disconnectSession(): Promise<void> {
    await this.client.delete('/session');
  }

  // Group endpoints
  async getGroups(): Promise<Group[]> {
    const response = await this.client.get<ApiResponse<Group[]>>('/groups');
    return response.data.data!;
  }

  async getGroup(id: string): Promise<Group> {
    const response = await this.client.get<ApiResponse<Group>>(`/groups/${id}`);
    return response.data.data!;
  }

  async syncGroups(groupIds?: string[]): Promise<{ groupsUpdated: number; participantsUpdated: number }> {
    const response = await this.client.post<ApiResponse<{ groupsUpdated: number; participantsUpdated: number }>>('/groups/sync', {
      groupIds
    });
    return response.data.data!;
  }

  async syncGroupV2(groupId: string): Promise<{ participantsUpdated: number }> {
    const response = await this.client.post<ApiResponse<{ participantsUpdated: number }>>(`/v2/groups/${groupId}/sync`);
    return response.data.data!;
  }

  // Participant endpoints
  async getParticipants(filters?: {
    search?: string;
    groupId?: string;
    cellphone?: string;
    whatsappRegistry?: string;
  }): Promise<Participant[]> {
    const response = await this.client.get<ApiResponse<Participant[]>>('/participants', {
      params: filters
    });
    return response.data.data!;
  }

  async getGroupParticipants(groupId: string): Promise<Participant[]> {
    const response = await this.client.get<ApiResponse<Participant[]>>(`/groups/${groupId}/participants`);
    return response.data.data!;
  }

  // Token endpoints
  async requestParticipantToken(data: TokenRequest): Promise<TokenResponse> {
    const response = await this.client.post<ApiResponse<TokenResponse>>('/participants/request-token', data);
    return response.data.data!;
  }

  async validateParticipantToken(data: TokenValidation): Promise<TokenResponse> {
    const response = await this.client.post<ApiResponse<TokenResponse>>('/participants/validate-token', data);
    return response.data.data!;
  }

  async getUserParticipants(): Promise<Array<{
    name: string;
    cellphone: string;
    linkId: string;
    expiresAt: string;
  }>> {
    const response = await this.client.get<ApiResponse<Array<{
      name: string;
      cellphone: string;
      linkId: string;
      expiresAt: string;
    }>>>('/user/participants');
    return response.data.data!;
  }

  // Anonymous message endpoints
  async createAnonymousMessage(data: CreateAnonymousMessageRequest): Promise<AnonymousMessage> {
    const response = await this.client.post<ApiResponse<AnonymousMessage>>('/anonymous-messages', data);
    return response.data.data!;
  }

  async getPendingMessages(groupId: string): Promise<AnonymousMessage[]> {
    const response = await this.client.get<ApiResponse<AnonymousMessage[]>>(`/anonymous-messages/pending/${groupId}`);
    return response.data.data!;
  }

  async approveMessage(data: ApproveMessageRequest): Promise<void> {
    await this.client.post('/anonymous-messages/approve', data);
  }

  async rejectMessage(messageId: string): Promise<void> {
    await this.client.post('/anonymous-messages/reject', { messageId });
  }

  // Participant form endpoints (public)
  async createParticipantForm(data: CreateParticipantFormRequest): Promise<ParticipantForm> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('pronoun', data.pronoun);
    formData.append('relationship', data.relationship);
    formData.append('birthday', data.birthday);
    formData.append('location', data.location);
    formData.append('sexualOrientation', data.sexualOrientation);
    if (data.instagram) formData.append('instagram', data.instagram);
    formData.append('photo', data.photo);

    const response = await this.client.post<ApiResponse<ParticipantForm>>('/forms/participant', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async updateParticipantForm(id: string, data: Partial<CreateParticipantFormRequest>): Promise<ParticipantForm> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await this.client.patch<ApiResponse<ParticipantForm>>(`/forms/participant/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  async getParticipantForm(participantId: string): Promise<ParticipantForm> {
    const response = await this.client.get<ApiResponse<ParticipantForm>>(`/forms/participant/${participantId}`);
    return response.data.data!;
  }

  async deleteParticipantForm(participantId: string): Promise<void> {
    await this.client.delete(`/forms/participant/${participantId}`);
  }

  // Public endpoints (no auth required)
  async requestGroupParticipantToken(groupId: string, cellphone: string): Promise<TokenResponse> {
    const response = await this.client.post<ApiResponse<TokenResponse>>(`/public/groups/${groupId}/request-token`, {
      cellphone
    });
    return response.data.data!;
  }

  async validateGroupParticipantToken(token: string): Promise<{ success: boolean; jwt?: string }> {
    const response = await this.client.post<ApiResponse<{ success: boolean; jwt?: string }>>('/public/validate-token', {
      token
    });
    return response.data.data!;
  }

  async getPublicGroup(groupId: string): Promise<Group> {
    const response = await this.client.get<ApiResponse<Group>>(`/public/groups/${groupId}`);
    return response.data.data!;
  }
}

export const api = new ApiClient();
