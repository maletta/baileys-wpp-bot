# WhatsApp Baileys Management System

Monorepo npm workspaces: bot WhatsApp com Baileys v7, painel admin Next.js 15, socket real-time.

## Comandos essenciais

```bash
npm run dev              # Backend (4444) + Frontend (3333) com hot reload
npm run build            # Compila backend e frontend
npm run lint             # ESLint em ambos os apps
npm run type-check       # tsc --noEmit em ambos os apps
npm run db:generate      # Prisma generate
npm run db:push          # Prisma db push (dev)
npm run db:studio        # Prisma Studio
npm test                 # Jest (raiz do workspace correspondente)
```

**Ordem**: `type-check` antes de `build`. `db:generate` roda automaticamente no `postinstall`.

## Estrutura do projeto

```
apps/backend/src/       # Clean Architecture: domain → application → infrastructure → presentation
apps/frontend/src/      # Next.js App Router: app/ components/ hooks/ lib/ types/ contexts/
.cursor/rules/          # Regras de padrão de código (5 arquivos .mdc)
docs/                   # Arquitetura, AI model strategy, troubleshooting
sessions/               # Credenciais Baileys (NUNCA commitar)
```

## Arquitetura Backend (Node.js + TypeScript + Express)

- **PRIORIZAR POO e Classes** ao invés de paradigma funcional
- Camadas: Domain (entidades, value objects, interfaces), Application (casos de uso, DTOs), Infrastructure (repositórios, Prisma, BaileysSocket), Presentation (controllers, middlewares, rotas)
- Padrões SOLID obrigatórios com injeção de dependência
- DTOs para comunicação entre camadas (nunca expor entidades diretamente)
- Classes de erro personalizadas; middleware centralizado de erro
- Winston para logging estruturado; nunca silenciar erros
- Prisma ORM com PostgreSQL (dados relacionais); MongoDB para mensagens WhatsApp
- JWT para auth admin + Google OAuth; middleware de validação em todas as rotas protegidas
- Socket.IO com namespaces separados, autenticação via JWT, eventos tipados
- Rate limiting em rotas públicas; sanitização de inputs com Zod

### Baileys WhatsApp Socket
- Classe `BaileysSocketManager` gerencia conexões, sessão multi-file auth
- Eventos: `groups.upsert`, `group-participants.update` (add/remove/promote/demote), `messages.upsert`
- Reconexão automática com retry de 5s; graceful shutdown preservando credenciais
- Sessão ativa marcada em `.active-session` para auto-restore no restart
- WhatsApp Web version cache 24h; high quality preview habilitado

## Frontend (React 19 + Next.js 15 App Router)

- Componentes funcionais TypeScript com interfaces Props explícitas
- Tailwind CSS + Shadcn/UI (Radix) como padrão de estilo
- Server Components quando possível; mobile-first responsivo
- Context API + Custom Hooks para estado (sem Redux); evitar estado global desnecessário
- useEffect com dependências exaustivas; memoização quando necessário
- React Hook Form + Zod para formulários e validação
- Socket.IO Client gerenciado via Context; estados: conectando → conectado → desconectado
- Nomes: PascalCase para componentes, `useNome.ts` para hooks, `NomeForm.tsx` para formulários

### Estrutura de componentes
- `/components/ui` - Shadcn/UI base
- `/components/shared` - Componentes reutilizáveis
- `/components/forms` - Formulários específicos
- `/app` - Pages e layouts (App Router)

## Database

- **PostgreSQL** via Prisma: 11 modelos (User, ParticipantsWpp, GroupsWpp, ParticipantGroupWpp, AnonymousMessage, ParticipantForm, etc.)
- **MongoDB** via Mongoose: mensagens WhatsApp (stub)
- Soft delete para remoções de participantes (`deleted: true, removedAt`)
- Migrations versionadas; seeds para dados iniciais; connection pooling

## Segurança (regras críticas)

- NUNCA commitar credenciais, tokens ou senhas
- Variáveis de ambiente para tudo sensível: `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_PARTICIPANT_SECRET`
- Rate limiting em todas as rotas públicas: OTP 40/15min, verificação 25/15min
- JWT com expiração: access 24h, refresh 7d; refresh token rotation
- Google OAuth como única forma de login admin; 4 roles: HIGH_LEVEL_ADMIN, GROUP_ADMIN, MEMBER, DEVELOPER
- Upload de imagens: max 5MB, apenas JPEG/PNG/WebP, validação MIME type
- Bloqueado: `eval()`, `Function()` constructor
- Logs de auditoria para operações críticas

## Testes

- Cobertura alvo: 80%+ backend, 70%+ frontend
- Pirâmide: Unit > Integration > E2E
- Backend: Jest + Supertest para API; mocks para Baileys Socket e Firebase
- Frontend: Jest + React Testing Library; Cypress para E2E críticos
- AAA (Arrange, Act, Assert); um conceito por teste; cleanup após cada teste
- TDD apropriado para lógica complexa

## Estratégia de Modelos de IA (OpenCode + DeepSeek)

Este projeto usa desenvolvimento assistido por IA. Prioridade: qualidade.

- **Implementação de features e refactors**: `deepseek/deepseek-v4-pro` (modelo padrão)
- **Decisões críticas de arquitetura, segurança, núcleo Baileys**: revisar com modelo de maior capacidade disponível
- **Tarefas mecânicas** (renames, micro-ajustes): modelo menor é aceitável, mas validar com lint + type-check
- **Antes de merge em código do WhatsApp core**: revisar reconexão, deduplicação, rate limiting, privacidade de dados

### Checklist pré-merge para código do núcleo WhatsApp/Baileys
- Reconexão automática funciona sem perder eventos
- Deduplicação de mensagens e eventos de grupo
- Rate limiting respeitado no envio
- Dados sensíveis não vazam em logs ou respostas de API

## Configuração de ambiente

Node.js >= 22.17.0. PostgreSQL obrigatório. MongoDB opcional (mensagens).
Copiar `.env.example` para `apps/backend/.env` e preencher variáveis.
Google Cloud OAuth 2.0 necessário para login admin.
