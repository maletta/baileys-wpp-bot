# Style Guide - WhatsApp Baileys Project

## Princípios Gerais

- **Consistência**: Manter padrões uniformes em todo o codebase
- **Clareza**: Código autodocumentado e expressivo
- **Simplicidade**: Evitar over-engineering
- **Performance**: Considerar impacto em todas as decisões

## TypeScript

### Configuração

- Strict mode habilitado
- ESLint + Prettier configurados
- Path mapping para imports limpos

### Naming Conventions

```typescript
// Interfaces - PascalCase com 'I' prefix opcional
interface UserData {}
interface IUserRepository {}

// Types - PascalCase
type UserRole = "admin" | "member";

// Classes - PascalCase
class BaileysSocketManager {}

// Methods/Functions - camelCase
function createQrCode() {}
const handleGroupJoin = () => {};

// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;

// Variables - camelCase
const userName = "John";
let groupParticipants = [];

// Files - kebab-case
baileys - socket - manager.ts;
user - repository.ts;
```

### Type Definitions

```typescript
// Sempre definir tipos explícitos para parâmetros públicos
function sendMessage(groupId: string, message: string): Promise<boolean>;

// Usar union types para estados específicos
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// Interfaces para objetos complexos
interface CreateGroupRequest {
  name: string;
  participants: string[];
  isPrivate?: boolean;
}

// Evitar any, usar unknown quando necessário
function processWebhookData(data: unknown): ProcessedData {
  // Type guards aqui
}
```

## Backend (Node.js)

### Estrutura de Arquivos

```
src/
├── domain/
│   ├── entities/          # User.ts, Group.ts
│   ├── value-objects/     # PhoneNumber.ts, Token.ts
│   └── interfaces/        # repositories, services
├── application/
│   ├── use-cases/         # CreateQrCodeUseCase.ts
│   ├── services/          # BaileysService.ts
│   └── dtos/              # request/response objects
├── infrastructure/
│   ├── repositories/      # UserRepository.ts
│   ├── external/          # GoogleOAuth.ts, Firebase.ts
│   └── database/          # prisma, migrations
└── presentation/
    ├── controllers/       # SessionController.ts
    ├── routes/           # session.routes.ts
    └── middlewares/      # auth.middleware.ts
```

### Classes e Métodos

```typescript
// Classes sempre em PascalCase
class BaileysSocketManager {
  private connection: WASocket | null = null;

  // Métodos públicos first, privados depois
  public async createConnection(): Promise<void> {}
  public async sendMessage(groupId: string, text: string): Promise<void> {}

  private handleConnectionUpdate(): void {}
  private saveCredentials(): void {}
}

// Use Cases como classes
class CreateQrCodeUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private baileysService: IBaileysService
  ) {}

  async execute(request: CreateQrCodeRequest): Promise<CreateQrCodeResponse> {
    // Implementation
  }
}
```

### Error Handling

```typescript
// Classes de erro customizadas
class WhatsAppConnectionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WhatsAppConnectionError";
  }
}

// Sempre propagar erros adequadamente
try {
  await baileysService.connect();
} catch (error) {
  logger.error("Failed to connect to WhatsApp", { error });
  throw new WhatsAppConnectionError("Connection failed", "CONN_001");
}
```

### Database (Prisma)

```typescript
// Sempre camelCase para colunas
model User {
  id              String   @id @default(cuid())
  googleId        String   @unique
  email           String   @unique
  displayName     String?
  profilePicture  String?
  role            UserRole @default(MEMBER)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  participantLinks ParticipantUserLink[]

  @@map("users")
}

// Relacionamentos claros
model ParticipantUserLink {
  id            String    @id @default(cuid())
  userId        String
  participantId String
  expiresAt     DateTime
  createdAt     DateTime  @default(now())

  user        User              @relation(fields: [userId], references: [id])
  participant ParticipantsWpp   @relation(fields: [participantId], references: [id])

  @@map("participant_user_links")
}
```

## Frontend (Next.js + React)

### Estrutura de Componentes

```tsx
// Componentes funcionais sempre
interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size = "md",
  onClick,
  children,
  disabled = false,
}) => {
  return (
    <button
      className={cn(
        "rounded-md font-medium transition-colors",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### Hooks Customizados

```tsx
// Use prefix 'use' sempre
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/groups");
      setGroups(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { groups, loading, error, fetchGroups };
}
```

### Context API

```tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### Formulários com Zod

```tsx
const createGroupSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export function CreateGroupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
  });

  const onSubmit = async (data: CreateGroupForm) => {
    // Submit logic
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* Form fields */}</form>;
}
```

## Tailwind CSS

### Padrões de Estilo

```tsx
// Responsive first - mobile para desktop
<div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">

// Usar design tokens do Shadcn/UI
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">

// Conditional classes com cn() utility
<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  variant === 'large' && 'size-large'
)}>
```

### Organização CSS

- Utility classes first
- Custom CSS apenas quando necessário
- CSS Modules para estilos complexos
- CSS Variables para theming

## Padrões de API

### Request/Response

```typescript
// Request DTOs
interface CreateQrCodeRequest {
  sessionId?: string;
}

// Response DTOs
interface CreateQrCodeResponse {
  sessionId: string;
  qrCode: string;
  expiresAt: string;
}

// Error responses padronizadas
interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  timestamp: string;
}
```

### Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

## Logs e Debugging

### Structured Logging

```typescript
logger.info("User authenticated", {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});

logger.error("WhatsApp connection failed", {
  error: error.message,
  sessionId,
  retryCount,
  stack: error.stack,
});
```

### Debug Patterns

```typescript
// Use debug namespace
const debug = createDebug("whatsapp:baileys");

debug("Processing group join event", { groupId, participantId });
```

## Performance

### Backend

- Usar connection pooling
- Implementar rate limiting
- Cache para dados frequentes
- Batch operations quando possível

### Frontend

- Lazy loading de componentes
- Memoização com React.memo
- useCallback/useMemo adequadamente
- Code splitting por rotas

## Segurança

### Validação

```typescript
// Sempre validar inputs
const phoneSchema = z.string().regex(/^\+\d{10,15}$/, "Invalid phone number");

// Sanitizar outputs
const sanitizedMessage = DOMPurify.sanitize(userMessage);
```

### Environment Variables

```bash
# Sempre usar env vars para configurações sensíveis
DATABASE_URL="postgresql://..."
JWT_SECRET="random-secret-here"
GOOGLE_CLIENT_ID="your-client-id"
```
