import { PrismaClient } from '@prisma/client';
import { QrCodeTry } from '@/domain/entities/QrCodeTry';
import {
  IQrCodeTryRepository,
  CreateQrCodeTryData
} from '@/domain/interfaces/repositories/IQrCodeTryRepository';

export class QrCodeTryRepository implements IQrCodeTryRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async create(data: CreateQrCodeTryData): Promise<QrCodeTry> {
    const qrCodeTry = await this.prisma.qrCodeTry.create({
      data: {
        userId: data.userId,
        ipAddress: data.ipAddress,
      }
    });

    return QrCodeTry.create({
      id: qrCodeTry.id,
      userId: qrCodeTry.userId,
      ipAddress: qrCodeTry.ipAddress,
      createdAt: qrCodeTry.createdAt
    });
  }

  async findById(id: string): Promise<QrCodeTry | null> {
    const qrCodeTry = await this.prisma.qrCodeTry.findUnique({
      where: { id }
    });

    if (!qrCodeTry) return null;

    return QrCodeTry.create({
      id: qrCodeTry.id,
      userId: qrCodeTry.userId,
      ipAddress: qrCodeTry.ipAddress,
      createdAt: qrCodeTry.createdAt
    });
  }

  async findByUserId(userId: string, limit: number = 10): Promise<QrCodeTry[]> {
    const qrCodeTries = await this.prisma.qrCodeTry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return qrCodeTries.map(qrCodeTry => QrCodeTry.create({
      id: qrCodeTry.id,
      userId: qrCodeTry.userId,
      ipAddress: qrCodeTry.ipAddress,
      createdAt: qrCodeTry.createdAt
    }));
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.qrCodeTry.count({
      where: { userId }
    });
  }

  async countByIpAddress(ipAddress: string, timeWindow?: number): Promise<number> {
    const where: any = { ipAddress };

    if (timeWindow) {
      const since = new Date(Date.now() - timeWindow * 60 * 1000);
      where.createdAt = { gte: since };
    }

    return await this.prisma.qrCodeTry.count({ where });
  }
}

