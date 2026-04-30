# Configuração do Google OAuth

Este documento descreve como configurar o sistema de autenticação Google OAuth no projeto WhatsApp Baileys.

## 📋 Pré-requisitos

1. **Conta Google Cloud Platform**
2. **Projeto criado no Google Cloud Console**
3. **Credenciais OAuth 2.0 configuradas**

## 🔧 Configuração do Google Cloud Console

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID**

### 2. Habilitar Google+ API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure por "Google+ API" e habilite
3. Procure por "Google Identity" e habilite

### 3. Configurar OAuth 2.0

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure a tela de consentimento OAuth se necessário:
   - **Application type**: Web application
   - **Name**: WhatsApp Baileys Auth
   - **Authorized JavaScript origins**:
     - `http://localhost:3333` (desenvolvimento)
     - `https://yourdomain.com` (produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3333/login` (desenvolvimento)
     - `https://yourdomain.com/login` (produção)

4. Após criar, anote:
   - **Client ID**
   - **Client Secret**

## 🔐 Configuração das Variáveis de Ambiente

### Backend (.env)

Copie o arquivo `apps/backend/env.example` para `apps/backend/.env` e configure:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_baileys_db"

# JWT Secrets (MUDE ESTES VALORES EM PRODUÇÃO!)
JWT_SECRET="sua-chave-secreta-jwt-super-segura-aqui"
JWT_REFRESH_SECRET="sua-chave-secreta-refresh-jwt-super-segura-aqui"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"

# Server Configuration
PORT=4444
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3333"
```

### Frontend (.env.local)

Copie o arquivo `apps/frontend/env.example` para `apps/frontend/.env.local` e configure:

```bash
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:4444/api"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"

# App Configuration
NEXT_PUBLIC_APP_NAME="WhatsApp Baileys"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## 🗃️ Configuração do Banco de Dados

### 1. Executar Migrações

```bash
cd apps/backend
npm run db:push
```

### 2. Verificar Tabelas

Certifique-se de que a tabela `users` foi criada com os campos:

- `id` (String, Primary Key)
- `googleId` (String, Unique)
- `email` (String, Unique)
- `displayName` (String, Optional)
- `profilePicture` (String, Optional)
- `role` (Enum: HIGH_LEVEL_ADMIN, GROUP_ADMIN, MEMBER, DEVELOPER)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🚀 Executando o Sistema

### 1. Instalar Dependências

```bash
# Na raiz do projeto
npm install

# Ou individualmente
cd apps/backend && npm install
cd apps/frontend && npm install
```

### 2. Executar em Desenvolvimento

```bash
# Na raiz do projeto (executa backend e frontend)
npm run dev

# Ou individualmente
npm run dev:backend
npm run dev:frontend
```

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:3333
- **Backend API**: http://localhost:4444/api
- **Health Check**: http://localhost:4444/health

## 🔄 Fluxo de Autenticação

### 1. Processo de Login

1. Usuário acessa `/login`
2. Clica em "Entrar com Google"
3. É redirecionado para o Google OAuth
4. Após autorização, recebe um token JWT do Google
5. Frontend envia o token para `/api/auth/google`
6. Backend valida o token com o Google
7. Se válido:
   - Busca usuário por `googleId`
   - Se não existe, cria novo usuário
   - Se existe, atualiza informações
   - Retorna JWT próprio + dados do usuário
8. Frontend armazena JWT e redireciona para `/dashboard`

### 2. Proteção de Rotas

- Todas as rotas protegidas verificam o JWT no header `Authorization: Bearer <token>`
- O middleware `authMiddleware` valida o token e adiciona `req.user`
- Roles podem ser verificadas com `requireRole(['ADMIN', 'DEVELOPER'])`

### 3. Refresh Token

- Refresh tokens são armazenados em cookies httpOnly
- Endpoint `/api/auth/refresh` renova o access token
- Access tokens expiram em 24h, refresh tokens em 7 dias

## 🛡️ Segurança

### Recomendações de Produção

1. **JWT Secrets**: Use chaves aleatórias de pelo menos 256 bits
2. **HTTPS**: Sempre use HTTPS em produção
3. **CORS**: Configure CORS_ORIGIN para seu domínio específico
4. **Rate Limiting**: Já configurado no backend
5. **Cookies**: Refresh tokens são httpOnly e secure em produção

### Exemplo de Geração de Secrets

```bash
# Gerar chaves seguras
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🧪 Testando a Integração

### 1. Teste Manual

1. Acesse http://localhost:3333/login
2. Clique em "Entrar com Google"
3. Autorize a aplicação
4. Verifique se foi redirecionado para `/dashboard`
5. Verifique se os dados do usuário aparecem corretamente

### 2. Teste de API

```bash
# Health check
curl http://localhost:4444/health

# Teste de autenticação (após login)
curl -H "Authorization: Bearer SEU_JWT_TOKEN" http://localhost:4444/api/auth/profile
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **"Token do Google inválido"**
   - Verifique se o GOOGLE_CLIENT_ID está correto
   - Confirme se o domínio está autorizado no Google Console

2. **"CORS Error"**
   - Verifique se CORS_ORIGIN está configurado corretamente
   - Confirme se o frontend está rodando na porta correta

3. **"JWT Error"**
   - Verifique se JWT_SECRET está definido
   - Confirme se o token não expirou

4. **"Database Error"**
   - Verifique se DATABASE_URL está correto
   - Execute `npm run db:push` para criar as tabelas

### Logs

- Backend logs estão disponíveis no console
- Erros de autenticação são logados com detalhes
- Use LOG_LEVEL="debug" para mais informações

## 📚 Endpoints da API

### Autenticação

- `POST /api/auth/google` - Login com Google
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Obter perfil do usuário

### Outros

- `GET /health` - Health check
- `POST /api/session/create-qr-code` - Criar QR Code WhatsApp (requer auth)
- `GET /api/session` - Status da sessão WhatsApp (requer auth)

## 🎯 Próximos Passos

Após configurar o Google OAuth, você pode:

1. **Configurar Roles**: Definir quais usuários têm acesso a quais funcionalidades
2. **Integrar WhatsApp**: Conectar com a API do Baileys
3. **Adicionar Funcionalidades**: Gerenciamento de grupos, mensagens, etc.
4. **Deploy**: Configurar para produção com HTTPS e domínio próprio

---

**Nota**: Este sistema foi desenvolvido para ser seguro e escalável. Sempre mantenha as dependências atualizadas e siga as melhores práticas de segurança.
