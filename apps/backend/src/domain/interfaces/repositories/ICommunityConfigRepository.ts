import { CommunityConfig } from '@/domain/entities/CommunityConfig';

export interface CreateCommunityConfigData {
  groupWppId: string;
  notificationGroupId?: string;
  welcomeMessageTemplate?: string;
}

export interface UpdateCommunityConfigData {
  notificationGroupId?: string | null;
  welcomeMessageTemplate?: string | null;
}

export interface ICommunityConfigRepository {
  findByGroupWppId(groupWppId: string): Promise<CommunityConfig | null>;
  findByNotificationGroup(groupId: string): Promise<CommunityConfig[]>;
  create(data: CreateCommunityConfigData): Promise<CommunityConfig>;
  update(groupWppId: string, data: UpdateCommunityConfigData): Promise<CommunityConfig>;
  delete(groupWppId: string): Promise<void>;
}
