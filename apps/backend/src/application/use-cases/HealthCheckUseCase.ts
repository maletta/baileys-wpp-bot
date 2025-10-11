import { PrismaClient } from '@prisma/client';
import { IBaileysSocketService } from '@/domain/interfaces/services/IBaileysSocketService';
import mongoose from 'mongoose';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    postgres: ServiceStatus;
    mongodb: ServiceStatus;
    whatsapp: ServiceStatus;
  };
  version: string;
  environment: string;
}

interface ServiceStatus {
  status: 'up' | 'down' | 'not_configured';
  message?: string;
  details?: any;
}

export class HealthCheckUseCase {
  private startTime: number;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly baileysService: IBaileysSocketService
  ) {
    this.startTime = Date.now();
  }

  async execute(): Promise<HealthCheckResponse> {
    const [postgresStatus, mongodbStatus, whatsappStatus] = await Promise.allSettled([
      this.checkPostgres(),
      this.checkMongoDB(),
      this.checkWhatsApp()
    ]);

    const services = {
      postgres: postgresStatus.status === 'fulfilled'
        ? postgresStatus.value
        : { status: 'down' as const, message: 'Erro ao verificar PostgreSQL' },
      mongodb: mongodbStatus.status === 'fulfilled'
        ? mongodbStatus.value
        : { status: 'down' as const, message: 'Erro ao verificar MongoDB' },
      whatsapp: whatsappStatus.status === 'fulfilled'
        ? whatsappStatus.value
        : { status: 'down' as const, message: 'Erro ao verificar WhatsApp' }
    };

    // Determinar status geral
    const allServicesUp = Object.values(services).every(s => s.status === 'up' || s.status === 'not_configured');
    const anyServiceDown = Object.values(services).some(s => s.status === 'down');

    const overallStatus = anyServiceDown ? 'degraded' : allServicesUp ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services,
      version: process.env.BAILEYS_VERSION || '7.0.0-rc.3',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  private async checkPostgres(): Promise<ServiceStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        message: 'Conectado ao PostgreSQL'
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Erro ao conectar no PostgreSQL'
      };
    }
  }

  private async checkMongoDB(): Promise<ServiceStatus> {
    try {
      // Verificar se MongoDB está configurado
      if (!process.env.MONGODB_URL) {
        return {
          status: 'not_configured',
          message: 'MongoDB não configurado'
        };
      }

      // Se já está conectado
      if (mongoose.connection.readyState === 1) {
        return {
          status: 'up',
          message: 'Conectado ao MongoDB',
          details: {
            host: mongoose.connection.host,
            name: mongoose.connection.name
          }
        };
      }

      // Se não está conectado, tentar conectar
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URL, {
          serverSelectionTimeoutMS: 3000
        });

        return {
          status: 'up',
          message: 'Conectado ao MongoDB',
          details: {
            host: mongoose.connection.host,
            name: mongoose.connection.name
          }
        };
      }

      return {
        status: 'down',
        message: 'MongoDB em estado desconhecido'
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Erro ao conectar no MongoDB'
      };
    }
  }

  private async checkWhatsApp(): Promise<ServiceStatus> {
    try {
      const connectionState = await this.baileysService.getConnectionState();

      if (connectionState.isConnected) {
        return {
          status: 'up',
          message: 'WhatsApp conectado',
          details: {
            sessionId: connectionState.sessionId,
            device: connectionState.deviceInfo?.name || 'Desconhecido'
          }
        };
      }

      return {
        status: 'down',
        message: 'WhatsApp não conectado'
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Erro ao verificar WhatsApp'
      };
    }
  }
}

