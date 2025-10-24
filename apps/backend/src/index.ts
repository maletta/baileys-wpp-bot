import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

// Import infrastructure
import { BaileysSocketService } from '@/infrastructure/services/BaileysSocketService';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { QrCodeTryRepository } from '@/infrastructure/repositories/QrCodeTryRepository';

// Import application
import { CreateQrCodeUseCase } from '@/application/use-cases/CreateQrCodeUseCase';

// Import presentation
import { SessionController } from '@/presentation/controllers/SessionController';
import { SessionSocketController } from '@/presentation/controllers/SessionSocketController';
import { AuthMiddleware } from '@/presentation/middlewares/authMiddleware';
import { createAuthRoutes } from '@/presentation/routes/authRoutes';
import { createHealthRoutes } from '@/presentation/routes/healthRoutes';

// Import shared
import { logger } from '@/shared/utils/logger';

class App {
  private express: express.Application;
  private server: any;
  private io: Server;
  private prisma!: PrismaClient;

  // Services
  private baileysService!: BaileysSocketService;
  private userRepository!: UserRepository;
  private qrCodeTryRepository!: QrCodeTryRepository;
  private authMiddleware!: AuthMiddleware;

  // Use Cases
  private createQrCodeUseCase!: CreateQrCodeUseCase;

  // Controllers
  private sessionController!: SessionController;
  private sessionSocketController!: SessionSocketController;

  constructor() {
    this.express = express();
    this.server = createServer(this.express);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3333",
        methods: ["GET", "POST"]
      }
    });

    this.initializeDatabase();
    this.initializeServices();
    this.initializeUseCases();
    this.initializeControllers();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeBaileysEvents();
  }

  private initializeDatabase(): void {
    this.prisma = new PrismaClient();
  }

  private initializeServices(): void {
    // Initialize repositories
    this.userRepository = new UserRepository(this.prisma);
    this.qrCodeTryRepository = new QrCodeTryRepository(this.prisma);

    // Initialize middleware
    this.authMiddleware = new AuthMiddleware(
      this.userRepository,
      process.env.JWT_SECRET || 'default-secret'
    );

    // Initialize Baileys service
    this.baileysService = new BaileysSocketService(
      process.env.SESSION_PATH || './sessions',
      process.env.BAILEYS_BROWSER_NAME || 'Chrome',
      process.env.BAILEYS_BROWSER_VERSION || '1.0.0'
    );
  }

  private initializeUseCases(): void {
    this.createQrCodeUseCase = new CreateQrCodeUseCase(
      this.baileysService,
      this.userRepository
    );
  }

  private initializeControllers(): void {
    this.sessionController = new SessionController(
      this.createQrCodeUseCase,
      this.baileysService
    );

    // Initialize Socket.IO controller for session management
    this.sessionSocketController = new SessionSocketController(
      this.io,
      this.baileysService,
      this.userRepository,
      this.qrCodeTryRepository,
      process.env.JWT_SECRET || 'default-secret'
    );
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.express.use(helmet());
    this.express.use(cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3333",
      credentials: true
    }));

    // Logging
    this.express.use(morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) }
    }));

    // Body parsing
    this.express.use(express.json({ limit: '10mb' }));
    this.express.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parsing
    this.express.use(cookieParser());
  }

  private initializeRoutes(): void {
    // Health check routes
    this.express.use('/health', createHealthRoutes(this.prisma, this.baileysService));

    // Auth routes
    this.express.use('/api/auth', createAuthRoutes(this.prisma));

    // Session routes
    this.express.post('/api/session/create-qr-code',
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRole(['HIGH_LEVEL_ADMIN', 'DEVELOPER']),
      this.sessionController.createQrCode.bind(this.sessionController)
    );

    this.express.get('/api/session',
      this.authMiddleware.authenticate,
      this.sessionController.getSessionStatus.bind(this.sessionController)
    );

    this.express.delete('/api/session',
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRole(['HIGH_LEVEL_ADMIN', 'DEVELOPER']),
      this.sessionController.disconnectSession.bind(this.sessionController)
    );

    // 404 handler
    this.express.use('*', (req, res) => {
      res.status(404).json({ error: 'Not Found', message: 'Rota não encontrada' });
    });

    // Error handler
    this.express.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro interno do servidor' });
    });
  }

  private initializeSocketIO(): void {
    // Socket.IO is now handled by SessionSocketController
    // The controller is initialized in initializeControllers()
    logger.info('Socket.IO initialized via SessionSocketController');
  }

  private initializeBaileysEvents(): void {
    // Connection state updates
    this.baileysService.onConnectionUpdate((state) => {
      logger.info('Baileys connection state updated', { state });
      this.io.emit('connection-update', state);
    });

    // Group events
    this.baileysService.onGroupJoin((groupData) => {
      logger.info('Bot joined group', { groupId: groupData.id, groupName: groupData.subject });
      // Handle group join logic here
    });

    this.baileysService.onParticipantJoin((groupId, participantId) => {
      logger.info('Participant joined group', { groupId, participantId });
      // Handle participant join logic here
    });

    this.baileysService.onParticipantLeave((groupId, participantIds) => {
      logger.info('Participants left group', { groupId, participantIds });
      // Handle participant leave logic here
    });

    this.baileysService.onGroupUpdate((groupId, action, participantIds) => {
      logger.info('Group participants updated', { groupId, action, participantIds });
      // Handle group update logic here
    });
  }

  public async start(): Promise<void> {
    const port = process.env.PORT || 3001;

    try {
      // Connect to database
      await this.prisma.$connect();
      logger.info('Database connected successfully');

      // Start server
      this.server.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down server...');

    try {
      await this.baileysService.disconnect();
      await this.prisma.$disconnect();
      this.server.close();
      logger.info('Server shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown', { error });
    }
  }
}

// Initialize and start the application
const app = new App();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await app.stop();
  process.exit(0);
});

// Start the application
app.start().catch((error) => {
  logger.error('Failed to start application', { error });
  process.exit(1);
});
