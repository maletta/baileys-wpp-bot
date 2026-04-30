# Estratégia e Guia de Testes

## Visão Geral

Este documento define a abordagem de testes para o projeto WhatsApp Baileys, incluindo estratégias, ferramentas e padrões para garantir qualidade e confiabilidade.

## Pirâmide de Testes

```
        /\
       /E2E\      <- Poucos testes, cenários críticos
      /____\
     /      \
    /Integration\ <- Testes moderados, APIs e fluxos
   /____________\
  /              \
 /      Unit      \ <- Muitos testes, lógica de negócio
/__________________\
```

### Distribuição Alvo

- **Unit Tests**: 70% da cobertura
- **Integration Tests**: 25% da cobertura
- **E2E Tests**: 5% da cobertura

## Cobertura de Testes

### Backend (Alvo: 80%+)

- **Domain Layer**: 95%+ (entidades e value objects)
- **Application Layer**: 90%+ (casos de uso e services)
- **Infrastructure Layer**: 75%+ (repositórios e integrações)
- **Presentation Layer**: 70%+ (controllers e middlewares)

### Frontend (Alvo: 70%+)

- **Components**: 80%+ (componentes reutilizáveis)
- **Hooks**: 85%+ (lógica customizada)
- **Utils**: 90%+ (funções utilitárias)
- **Pages**: 60%+ (integração básica)

## Ferramentas e Configuração

### Backend

```bash
# Dependências de teste
npm install --save-dev jest @types/jest ts-jest supertest
npm install --save-dev @testcontainers/postgresql

# Executar testes
npm run test              # Todos os testes
npm run test:watch        # Watch mode
npm run test:coverage     # Com cobertura
npm run test:integration  # Apenas integração
```

### Frontend

```bash
# Dependências de teste
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev cypress @cypress/react

# Executar testes
npm run test           # Unit tests
npm run test:e2e       # End-to-end
npm run test:watch     # Watch mode
```

## Estrutura de Testes

### Backend Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── integration/
│   │   ├── repositories/
│   │   └── services/
│   └── e2e/
│       └── api/
├── __mocks__/
│   ├── baileys.ts
│   ├── firebase.ts
│   └── prisma.ts
└── test-utils/
    ├── database.ts
    ├── fixtures.ts
    └── helpers.ts
```

### Frontend Structure

```
src/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── utils/
├── __mocks__/
│   ├── api.ts
│   ├── socket.ts
│   └── next-router.ts
├── cypress/
│   ├── e2e/
│   ├── fixtures/
│   └── support/
└── test-utils/
    ├── render.tsx
    ├── mocks.ts
    └── providers.tsx
```

## Padrões de Teste

### Nomenclatura

```typescript
// Padrão: describe > context > it
describe("UserRepository", () => {
  describe("findById", () => {
    context("when user exists", () => {
      it("should return user entity", async () => {
        // Test implementation
      });
    });

    context("when user does not exist", () => {
      it("should return null", async () => {
        // Test implementation
      });
    });
  });
});
```

### AAA Pattern (Arrange, Act, Assert)

```typescript
it("should create QR code successfully", async () => {
  // Arrange
  const userId = "user-123";
  const mockUser = createMockUser({ id: userId, role: "HIGH_LEVEL_ADMIN" });
  userRepository.findById.mockResolvedValue(mockUser);
  baileysService.getConnectionState.mockResolvedValue({ isConnected: false });
  baileysService.createConnection.mockResolvedValue("mock-qr-code");

  // Act
  const result = await createQrCodeUseCase.execute({ userId });

  // Assert
  expect(result).toEqual({
    sessionId: expect.any(String),
    qrCode: "mock-qr-code",
    message: "QR Code gerado com sucesso. Escaneie para conectar.",
  });
});
```

## Mocks e Fixtures

### Mocks Comuns

```typescript
// __mocks__/baileys.ts
export const mockBaileysSocket = {
  createConnection: jest.fn(),
  getConnectionState: jest.fn(),
  sendMessage: jest.fn(),
  disconnect: jest.fn(),
};

// __mocks__/prisma.ts
export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  group: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};
```

### Fixtures

```typescript
// test-utils/fixtures.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: "user-123",
  googleId: "google-123",
  email: "test@example.com",
  displayName: "Test User",
  role: UserRole.MEMBER,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockGroup = (overrides?: Partial<Group>): Group => ({
  id: "group-123",
  whatsappRegistry: "120363421187224057@g.us",
  name: "Test Group",
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

## Database Testing

### Test Database Setup

```typescript
// test-utils/database.ts
import { PrismaClient } from "@prisma/client";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

export class TestDatabase {
  private container: PostgreSqlContainer;
  private prisma: PrismaClient;

  async setup(): Promise<void> {
    this.container = await new PostgreSqlContainer()
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_pass")
      .start();

    const connectionString = this.container.getConnectionUri();
    this.prisma = new PrismaClient({
      datasources: { db: { url: connectionString } },
    });

    // Run migrations
    await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    await this.container.stop();
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
```

## Testes de Integração

### API Testing

```typescript
// __tests__/integration/session.test.ts
import request from "supertest";
import { app } from "../../src/app";

describe("Session API", () => {
  describe("POST /api/session/create-qr-code", () => {
    it("should create QR code for admin user", async () => {
      const token = await createAuthToken({ role: "HIGH_LEVEL_ADMIN" });

      const response = await request(app)
        .post("/api/session/create-qr-code")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.qrCode).toBeDefined();
    });

    it("should reject request from non-admin user", async () => {
      const token = await createAuthToken({ role: "MEMBER" });

      await request(app)
        .post("/api/session/create-qr-code")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });
});
```

### Component Testing

```typescript
// __tests__/components/QrCodeDisplay.test.tsx
import { render, screen } from "@testing-library/react";
import { QrCodeDisplay } from "../../src/components/QrCodeDisplay";
import { TestProviders } from "../test-utils/providers";

describe("QrCodeDisplay", () => {
  it("should display QR code when provided", () => {
    const mockQrCode = "data:image/png;base64,mock-qr-code";

    render(
      <TestProviders>
        <QrCodeDisplay qrCode={mockQrCode} />
      </TestProviders>
    );

    expect(screen.getByRole("img", { name: /qr code/i })).toBeInTheDocument();
    expect(screen.getByText(/escaneie o código/i)).toBeInTheDocument();
  });

  it("should show loading state when no QR code", () => {
    render(
      <TestProviders>
        <QrCodeDisplay qrCode={null} loading={true} />
      </TestProviders>
    );

    expect(screen.getByText(/gerando qr code/i)).toBeInTheDocument();
  });
});
```

## Testes E2E

### Cypress Configuration

```typescript
// cypress.config.ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3333",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: false,
    screenshotOnRunFailure: true,
  },
});
```

### E2E Test Example

```typescript
// cypress/e2e/whatsapp-connection.cy.ts
describe("WhatsApp Connection Management", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit("/dispositivos");
  });

  it("should create and display QR code", () => {
    cy.get('[data-testid="connect-button"]').click();
    cy.get('[data-testid="qr-code"]').should("be.visible");
    cy.get('[data-testid="session-id"]').should("contain.text", "Sessão:");
  });

  it("should show connected device info", () => {
    cy.mockConnectedDevice();
    cy.visit("/dispositivos");

    cy.get('[data-testid="device-info"]').should("be.visible");
    cy.get('[data-testid="disconnect-button"]').should("be.enabled");
  });
});
```

## Performance Testing

### Frontend Performance

```typescript
// __tests__/performance/component-render.test.ts
import { render } from "@testing-library/react";
import { performance } from "perf_hooks";

describe("Component Performance", () => {
  it("should render GroupList under 100ms", () => {
    const start = performance.now();

    render(<GroupList groups={createMockGroups(100)} />);

    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

### API Performance

```typescript
// __tests__/performance/api-response.test.ts
describe("API Performance", () => {
  it("should respond to group sync under 5 seconds", async () => {
    const start = Date.now();

    await request(app)
      .post("/api/groups/sync")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22.20.0"
      - run: npm install
      - run: npm run test:backend
      - run: npm run test:coverage

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22.20.0"
      - run: npm install
      - run: npm run test:frontend
      - run: npm run test:e2e
```

## Métricas e Relatórios

### Coverage Thresholds

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./src/domain/": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

### Relatórios

- Coverage reports em HTML
- Test results em JUnit XML
- Performance benchmarks
- Integration com SonarQube (opcional)

## Melhores Práticas

### Testes Determinísticos

- Sempre usar dados fixos em testes
- Mockar Date.now() quando necessário
- Evitar dependências de rede em unit tests
- Limpar estado entre testes

### Isolamento

- Cada teste deve ser independente
- Setup e teardown adequados
- Não compartilhar estado entre testes
- Usar containers para testes de integração

### Manutenibilidade

- Testes simples e focados
- Nomes descritivos e expressivos
- Evitar duplicação de código de teste
- Documentar cenários complexos

### Performance

- Parallelização quando possível
- Mocks para operações caras
- Cleanup de recursos
- Timeouts apropriados
