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
import { GroupWppRepository } from '@/infrastructure/repositories/GroupWppRepository';
import { ParticipantWppRepository } from '@/infrastructure/repositories/ParticipantWppRepository';
import { ParticipantGroupWppRepository } from '@/infrastructure/repositories/ParticipantGroupWppRepository';

// Import application
import { CreateQrCodeUseCase } from '@/application/use-cases/CreateQrCodeUseCase';
import { UpsertGroupFromBaileysUseCase } from '@/application/use-cases/UpsertGroupFromBaileysUseCase';
import { EnsureParticipantAndMembershipOnJoinUseCase } from '@/application/use-cases/EnsureParticipantAndMembershipOnJoinUseCase';
import {
  MarkParticipantLeftInGroupUseCase,
  SetParticipantAdminInGroupUseCase
} from '@/application/use-cases/WppParticipantGroupAdminUseCases';
import { PatchGroupFromGroupsUpdateUseCase } from '@/application/use-cases/PatchGroupFromGroupsUpdateUseCase';
import { SyncGroupMembersAfterBotJoinUseCase } from '@/application/use-cases/SyncGroupMembersAfterBotJoinUseCase';

// Import domain
import type { BaileysGroupData } from '@/domain/interfaces/services/IBaileysSocketService';

// Import presentation
import { SessionController } from '@/presentation/controllers/SessionController';
import { SessionSocketController } from '@/presentation/controllers/SessionSocketController';
import { AuthMiddleware } from '@/presentation/middlewares/authMiddleware';
import { createAuthRoutes } from '@/presentation/routes/authRoutes';
import { createHealthRoutes } from '@/presentation/routes/healthRoutes';
import { createPublicParticipantAuthRoutes } from '@/presentation/routes/publicParticipantAuthRoutes';
import { createParticipantPortalRoutes } from '@/presentation/routes/participantPortalRoutes';

// Import shared
import { logger } from '@/shared/utils/logger';
import { toPnJidIfPossible } from '@/shared/utils/whatsappJid';
import util from 'util';
import fs from 'fs';
import path from 'path';

class App {
  private express: express.Application;
  private server: any;
  private io: Server;
  private prisma!: PrismaClient;

  // Services
  private baileysService!: BaileysSocketService;
  private userRepository!: UserRepository;
  private qrCodeTryRepository!: QrCodeTryRepository;
  private groupWppRepository!: GroupWppRepository;
  private participantWppRepository!: ParticipantWppRepository;
  private participantGroupWppRepository!: ParticipantGroupWppRepository;
  private authMiddleware!: AuthMiddleware;

  // Use Cases
  private createQrCodeUseCase!: CreateQrCodeUseCase;
  private upsertGroupFromBaileysUseCase!: UpsertGroupFromBaileysUseCase;
  private ensureParticipantAndMembershipOnJoinUseCase!: EnsureParticipantAndMembershipOnJoinUseCase;
  private markParticipantLeftInGroupUseCase!: MarkParticipantLeftInGroupUseCase;
  private setParticipantAdminInGroupUseCase!: SetParticipantAdminInGroupUseCase;
  private patchGroupFromGroupsUpdateUseCase!: PatchGroupFromGroupsUpdateUseCase;
  private syncGroupMembersAfterBotJoinUseCase!: SyncGroupMembersAfterBotJoinUseCase;

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
    this.groupWppRepository = new GroupWppRepository(this.prisma);
    this.participantWppRepository = new ParticipantWppRepository(this.prisma);
    this.participantGroupWppRepository = new ParticipantGroupWppRepository(this.prisma);

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

    this.upsertGroupFromBaileysUseCase = new UpsertGroupFromBaileysUseCase(
      this.groupWppRepository,
      this.baileysService
    );

    this.ensureParticipantAndMembershipOnJoinUseCase =
      new EnsureParticipantAndMembershipOnJoinUseCase(this.prisma, this.baileysService);

    this.markParticipantLeftInGroupUseCase = new MarkParticipantLeftInGroupUseCase(
      this.baileysService,
      this.groupWppRepository,
      this.participantWppRepository,
      this.participantGroupWppRepository
    );

    this.setParticipantAdminInGroupUseCase = new SetParticipantAdminInGroupUseCase(
      this.baileysService,
      this.groupWppRepository,
      this.participantWppRepository,
      this.participantGroupWppRepository
    );

    this.patchGroupFromGroupsUpdateUseCase = new PatchGroupFromGroupsUpdateUseCase(
      this.groupWppRepository,
      this.baileysService
    );

    this.syncGroupMembersAfterBotJoinUseCase = new SyncGroupMembersAfterBotJoinUseCase(
      this.prisma,
      this.baileysService
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
    const uploadRoot = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadRoot)) {
      fs.mkdirSync(uploadRoot, { recursive: true });
    }
    this.express.use('/uploads', express.static(uploadRoot));

    // Health check routes
    this.express.use('/health', createHealthRoutes(this.prisma, this.baileysService));

    // Auth routes
    this.express.use('/api/auth', createAuthRoutes(this.prisma));

    // Participante — OTP público (formulário sem Google)
    this.express.use(
      '/api/public/participant-auth',
      createPublicParticipantAuthRoutes({
        prisma: this.prisma,
        participantRepo: this.participantWppRepository,
        baileys: this.baileysService
      })
    );

    // Portal participante (JWT Google ou JWT temporário OTP)
    this.express.use(
      '/api/participant-portal',
      createParticipantPortalRoutes(this.prisma, this.baileysService)
    );

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

  /**
   * Em `groups.upsert` o Baileys envia os participantes; quando o bot entra no grupo,
   * por vezes só este evento chega (sem `group-participants.update` add). Comparação
   * alinhada com `BaileysSocketService` / `group-participants.update`.
   */
  private sessionUserIsAmongGroupUpsertParticipants(groupData: BaileysGroupData): boolean {
    for (const p of groupData.participants) {
      const pnRaw = p.phoneNumber;
      const pnJid =
        pnRaw?.endsWith('@s.whatsapp.net') ? pnRaw : toPnJidIfPossible(pnRaw);
      if (this.baileysService.isSessionUserParticipant(p.id, pnJid)) {
        return true;
      }
    }
    return false;
  }

  private traceApp(handlerName: string, data: unknown): void {
    console.log(`\n========== APP handler: ${handlerName} ==========`);
    console.log(
      util.inspect(data, {
        depth: null,
        colors: false,
        maxArrayLength: null,
        maxStringLength: null,
        breakLength: 120
      })
    );
    console.log(`========== fim APP ${handlerName} ==========\n`);
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

    // Group events — sincronização Postgres (ver docs/assets/backend-wpp-baileys-sync-spec.md)
    this.baileysService.onGroupJoin((groupData) => {
      this.traceApp('onGroupJoin (via BaileysSocketService.register onGroupJoin)', groupData);
      void this.upsertGroupFromBaileysUseCase.execute(groupData);
      if (this.sessionUserIsAmongGroupUpsertParticipants(groupData)) {
        void this.syncGroupMembersAfterBotJoinUseCase.execute(groupData.id);
      }
    });

    this.baileysService.onParticipantJoin((groupId, participantId, context) => {
      this.traceApp('onParticipantJoin', {
        groupId,
        participantId,
        context
      });
      /**
       * Entrada do próprio bot (`sessionUserJoin`): ignoramos este callback porque o upsert
       * unitário (`EnsureParticipantAndMembershipOnJoinUseCase`) não se aplica aqui — o grupo
       * e todos os membros são tratados em `onGroupJoin` via `SyncGroupMembersAfterBotJoinUseCase`.
       * Para outros participantes, `onParticipantJoin` só persiste esse membro e garante o grupo.
       */
      if (context?.sessionUserJoin) {
        return;
      }
      void this.ensureParticipantAndMembershipOnJoinUseCase.execute({
        groupRegistry: groupId,
        eventParticipantId: participantId,
        participantPnJid: context?.participantPnJid,
        membershipAdmin: context?.membershipAdmin,
        context
      });
    });

    this.baileysService.onParticipantLeave((groupId, participants) => {
      this.traceApp('onParticipantLeave', { groupId, participants });
      void this.markParticipantLeftInGroupUseCase.execute(groupId, participants);
    });

    this.baileysService.onGroupUpdate((groupId, action, participants) => {
      this.traceApp('onGroupUpdate', { groupId, action, participants });
      void this.setParticipantAdminInGroupUseCase.execute(
        groupId,
        participants,
        action === 'promote'
      );
    });

    this.baileysService.onGroupsUpdate((updates) => {
      this.traceApp('onGroupsUpdate', updates);
      void this.patchGroupFromGroupsUpdateUseCase.execute(updates);
    });
  }

  public async start(): Promise<void> {
    const port = process.env.PORT || 3001;

    try {
      // Connect to database
      await this.prisma.$connect();
      logger.info('Database connected successfully');

      await this.baileysService.tryRestorePersistedSession();

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
      await this.baileysService.shutdownPreservingCredentials();
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
