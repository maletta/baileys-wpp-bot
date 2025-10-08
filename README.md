# 🚀 WhatsApp Baileys Management System

Sistema completo para gerenciamento de conexões WhatsApp utilizando a biblioteca Baileys, com interface administrativa para gestão de grupos, participantes e sistema de mensagens anônimas com aprovação.

## 📋 Índice

- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Documentation](#-api-documentation)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## ✨ Características

### 🔐 Autenticação e Autorização

- Login exclusivo via Google OAuth
- Sistema de roles (High Level Admin, Group Admin, Member, Developer)
- Middleware de autenticação JWT
- Controle granular de permissões

### 📱 Gestão de Conexões WhatsApp

- Conexão via QR Code usando Baileys
- Socket.IO para updates em tempo real
- Gerenciamento de múltiplas sessões
- Reconexão automática e tratamento de falhas

### 👥 Administração de Grupos

- Sincronização automática com WhatsApp
- Detecção de entrada/saída de participantes
- Gestão de permissões de admin
- Visualização e filtros avançados

### 💬 Sistema de Mensagens Anônimas

- Criação de mensagens com menções
- Workflow de aprovação por admins
- Envio automático via Baileys
- Audit trail completo

### 📝 Formulários de Participantes

- Páginas públicas para cadastro
- Sistema de verificação por token
- Upload de imagens para Firebase
- Validação robusta com Zod

## 🏗 Arquitetura

### Monorepo Structure

```
whatsapp-baileys-IA/
├── apps/
│   ├── backend/          # API Node.js/TypeScript
│   └── frontend/         # Interface Next.js
├── docs/                 # Documentação completa
├── specs/                # Especificações de features
└── .cursor/              # Regras IDE específicas
```

### Backend Architecture

```
src/
├── domain/               # Entidades e regras de negócio
├── application/          # Casos de uso e services
├── infrastructure/       # Repositórios e integrações
├── presentation/         # Controllers e rotas
└── shared/              # Utilities e helpers
```

### Frontend Architecture

```
src/
├── app/                 # Pages e layouts (App Router)
├── components/          # Componentes reutilizáveis
├── contexts/            # Context API para estado global
├── hooks/               # Custom hooks
├── lib/                 # Utilities e configurações
└── types/               # Definições TypeScript
```

## 🔧 Pré-requisitos

- **Node.js**: v22.20.0 LTS ou superior
- **PostgreSQL**: Para dados relacionais
- **MongoDB**: Para mensagens WhatsApp
- **Firebase**: Para upload de imagens
- **Google OAuth**: Para autenticação

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/whatsapp-baileys-IA.git
cd whatsapp-baileys-IA
```

### 2. Instale as Dependências

```bash
# Instalar dependências do monorepo
npm install

# Ou separadamente
npm install --workspace=apps/backend
npm install --workspace=apps/frontend
```

### 3. Configure o Banco de Dados

```bash
# Backend - Setup Prisma
cd apps/backend
npm run db:generate
npm run db:push
```

> **⚠️ Nota sobre Baileys v7.0.0**: Este projeto usa a nova versão oficial do Baileys. Se você estava usando uma versão anterior, consulte o [Guia de Migração](docs/baileys-migration.md) para instruções detalhadas.

## ⚙️ Configuração

### Backend Environment (.env)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_baileys_db"
MONGODB_URL="mongodb://localhost:27017/whatsapp_messages"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Firebase
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
FIREBASE_STORAGE_BUCKET="your-firebase-storage-bucket"

# WhatsApp/Baileys
SESSION_PATH="./sessions"
BAILEYS_BROWSER_NAME="Chrome"

# Server
PORT=4444
CORS_ORIGIN="http://localhost:3333"
```

### Frontend Environment (.env.local)

```bash
NEXT_PUBLIC_API_URL="http://localhost:4444/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4444"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
```

## 🎯 Uso

### Desenvolvimento

```bash
# Executar tudo simultaneamente
npm run dev

# Executar separadamente
npm run dev:backend   # API na porta 4444
npm run dev:frontend  # Interface na porta 3333
```

### Produção

```bash
# Build completo
npm run build

# Start em produção
npm run start
```

### Scripts Úteis

```bash
# Database
npm run db:generate   # Gerar Prisma client
npm run db:push       # Push schema para DB
npm run db:migrate    # Executar migrations
npm run db:studio     # Prisma Studio

# Testes
npm run test          # Executar todos os testes
npm run test:backend  # Testes do backend
npm run test:frontend # Testes do frontend

# Linting
npm run lint          # Verificar código
npm run lint:fix      # Corrigir automaticamente
```

## 📚 API Documentation

### Autenticação

```http
POST /api/auth/google
Content-Type: application/json

{
  "token": "google-oauth-token"
}
```

### Sessões WhatsApp

```http
# Criar QR Code (Admin apenas)
POST /api/session/create-qr-code
Authorization: Bearer <jwt-token>

# Verificar status da sessão
GET /api/session
Authorization: Bearer <jwt-token>

# Desconectar sessão
DELETE /api/session
Authorization: Bearer <jwt-token>
```

### Grupos

```http
# Listar grupos
GET /api/groups
Authorization: Bearer <jwt-token>

# Sincronizar grupos
POST /api/groups/sync
Authorization: Bearer <jwt-token>

# Sincronizar grupo específico (V2)
POST /api/v2/groups/{groupId}/sync
Authorization: Bearer <jwt-token>
```

### Mensagens Anônimas

```http
# Criar mensagem
POST /api/anonymous-messages
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "groupId": "group-uuid",
  "message": "Mensagem a ser enviada",
  "mentionedParticipants": ["participant-uuid"]
}

# Aprovar mensagem
POST /api/anonymous-messages/approve
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "messageId": "message-uuid"
}
```

### Formulários Públicos

```http
# Solicitar token de participante
POST /api/public/groups/{groupId}/request-token
Content-Type: application/json

{
  "cellphone": "+5511999999999"
}

# Validar token
POST /api/public/validate-token
Content-Type: application/json

{
  "token": "123456"
}

# Criar formulário de participante
POST /api/forms/participant
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

# FormData com campos do formulário + foto
```

## 🔌 Socket.IO Events

### Cliente → Servidor

```javascript
// Juntar-se à sessão
socket.emit("session-frontend-join", sessionId);
```

### Servidor → Cliente

```javascript
// Atualização de conexão
socket.on("connection-update", (state) => {
  console.log("Connection state:", state);
});

// Atualização de grupo
socket.on("group-update", (data) => {
  console.log("Group updated:", data);
});
```

## 🌐 Interface de Usuário

### Páginas Administrativas

- **`/login`** - Autenticação via Google
- **`/dispositivos`** - Gerenciamento de conexões WhatsApp
- **`/grupos`** - Visualização e gestão de grupos
- **`/mensagens`** - Sistema de mensagens anônimas
- **`/aprovacao`** - Aprovação de mensagens (admins)

### Páginas Públicas

- **`/formulario/{groupId}`** - Cadastro de participantes
- **`/verificacao`** - Verificação de token

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm run test

# Apenas backend
npm run test:backend
npm run test:backend:watch

# Apenas frontend
npm run test:frontend
npm run test:frontend:watch

# E2E tests
npm run test:e2e
```

### Cobertura

```bash
npm run test:coverage
```

Alvos de cobertura:

- **Backend**: 80%+
- **Frontend**: 70%+

## 📊 Monitoramento

### Logs

- Winston para logging estruturado
- Níveis: error, warn, info, debug
- Rotação automática de arquivos

### Métricas

- Health checks em `/health`
- Performance monitoring
- Error tracking

## 🚀 Deploy

### Staging

```bash
npm run build
npm run deploy:staging
```

### Produção

```bash
npm run build
npm run deploy:production
```

### Docker (Opcional)

```bash
docker-compose up -d
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Guidelines

- Seguir o [Style Guide](STYLEGUIDE.md)
- Ler o [Guia de Contribuição](CONTRIBUTING.md)
- Manter cobertura de testes acima de 80%
- Documentar mudanças significativas

## 📋 Roadmap

Consulte o [ROADMAP.md](ROADMAP.md) para planejamento detalhado de features futuras.

### Próximas Features

- [ ] Sistema multi-instância
- [ ] Dashboard de analytics
- [ ] API pública documentada
- [ ] Integrações com outras plataformas

## 🐛 Problemas Conhecidos

### WhatsApp/Baileys

- Reconexão pode falhar ocasionalmente
- Rate limiting do WhatsApp em envios em massa
- Mudanças no protocolo podem quebrar funcionalidades

### Soluções

- Monitoramento automático de conexão
- Retry logic implementado
- Updates regulares da biblioteca Baileys

## 🔧 Troubleshooting

### Problemas Comuns de Instalação

Se encontrar erros como `No matching version found for google-auth-library`:

```bash
# Limpeza completa e reinstalação
npm run clean-install
```

Para outros problemas, consulte o [Guia de Troubleshooting](docs/troubleshooting.md) completo.

## 📞 Suporte

- **Troubleshooting**: [Guia de Resolução de Problemas](docs/troubleshooting.md)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/whatsapp-baileys-IA/issues)
- **Documentação**: [/docs](./docs)
- **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/whatsapp-baileys-IA/discussions)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Biblioteca WhatsApp Web API v7.0.0
- [Next.js](https://nextjs.org/) - Framework React
- [Prisma](https://prisma.io/) - ORM TypeScript
- [Shadcn/UI](https://ui.shadcn.com/) - Componentes UI

---

**Desenvolvido com ❤️ usando Node.js, TypeScript, Next.js e Baileys**
