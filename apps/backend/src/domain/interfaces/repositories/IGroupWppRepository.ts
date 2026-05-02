import { GroupWpp } from '@/domain/entities/GroupWpp';

export interface IGroupWppRepository {
  findById(id: string): Promise<GroupWpp | null>;
  findByWhatsappRegistry(whatsappRegistry: string): Promise<GroupWpp | null>;
  findAll(): Promise<GroupWpp[]>;
  create(groupData: CreateGroupWppData): Promise<GroupWpp>;
  update(id: string, groupData: Partial<UpdateGroupWppData>): Promise<GroupWpp>;
  delete(id: string): Promise<void>;
  findByIds(ids: string[]): Promise<GroupWpp[]>;
}

export interface CreateGroupWppData {
  whatsappRegistry: string;
  name: string;
  description?: string;
  linkedParent?: string;
  imageUrl?: string;
  notifyNewUserDetail?: boolean;
  onlyRegisteredUserMode?: boolean;
}

export interface UpdateGroupWppData {
  name?: string;
  description?: string | null;
  linkedParent?: string;
  imageUrl?: string | null;
  notifyNewUserDetail?: boolean;
  onlyRegisteredUserMode?: boolean;
}
