import { QrCodeTry } from '@/domain/entities/QrCodeTry';

export interface CreateQrCodeTryData {
  userId?: string;
  ipAddress?: string;
}

export interface IQrCodeTryRepository {
  create(data: CreateQrCodeTryData): Promise<QrCodeTry>;
  findById(id: string): Promise<QrCodeTry | null>;
  findByUserId(userId: string, limit?: number): Promise<QrCodeTry[]>;
  countByUserId(userId: string): Promise<number>;
  countByIpAddress(ipAddress: string, timeWindow?: number): Promise<number>;
}

