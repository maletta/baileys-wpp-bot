import { User } from '@/domain/entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: CreateUserData): Promise<User>;
  update(id: string, userData: Partial<UpdateUserData>): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface CreateUserData {
  googleId: string;
  email: string;
  displayName?: string;
  profilePicture?: string;
  role?: string;
}

export interface UpdateUserData {
  displayName?: string;
  profilePicture?: string;
  role?: string;
}
