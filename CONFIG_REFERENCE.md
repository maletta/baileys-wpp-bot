# 📖 Referência Rápida de Configuração

## 🎯 Valores para GCP (Google Cloud Console)

### Criação de Credenciais OAuth 2.0

| Campo                  | Valor                         |
| ---------------------- | ----------------------------- |
| **Tipo de aplicativo** | Aplicativo da Web             |
| **Nome**               | WhatsApp Baileys - Web Client |

---

## 🌐 Origens JavaScript Autorizadas

### Desenvolvimento (adicionar todos):

```
http://localhost:3333
http://127.0.0.1:3333
```

### Produção (adicionar quando fizer deploy):

```
https://seudominio.com
https://www.seudominio.com
```

**⚠️ Atenção:**

- Não adicione `/` no final
- Em produção, use apenas `https://` (nunca `http://`)
- Adicione ambas versões (com e sem `www`)

---

## 🚫 URIs de Redirecionamento

**Para o seu projeto: DEIXE EM BRANCO**

Você está usando Google Identity Services (GIS) que não precisa de redirect URI.

---

## 🔐 Variáveis de Ambiente

### Frontend

```bash
# apps/frontend/.env.local (criar este arquivo)

NEXT_PUBLIC_APP_URL="http://localhost:3333"
NEXT_PUBLIC_API_URL="http://localhost:4444/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="cole-aqui-o-client-id-do-gcp"
NEXT_PUBLIC_APP_NAME="WhatsApp Baileys"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Backend

```bash
# apps/backend/.env (criar este arquivo)

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_baileys_db"
MONGODB_URL="mongodb://localhost:27017/whatsapp_messages"

# JWT - GERE KEYS FORTES!
JWT_SECRET="min-32-caracteres-aleatorios-super-seguros"
JWT_REFRESH_SECRET="outra-chave-diferente-min-32-caracteres"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth - USE O MESMO CLIENT_ID DO FRONTEND!
GOOGLE_CLIENT_ID="cole-o-mesmo-client-id-do-frontend"
GOOGLE_CLIENT_SECRET="cole-o-client-secret-do-gcp"
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3333"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
LOG_FILE_PATH="./logs"
```

---

## ⚠️ CRÍTICO: Valores que DEVEM ser IGUAIS

| O que            | Frontend                       | Backend            | Google Cloud                   |
| ---------------- | ------------------------------ | ------------------ | ------------------------------ |
| **Client ID**    | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` | Client ID do OAuth             |
| **URL Frontend** | `NEXT_PUBLIC_APP_URL`          | `CORS_ORIGIN`      | Origens JavaScript Autorizadas |

---

## 📝 Checklist Rápido

### Google Cloud Console

- [ ] Acessar: https://console.cloud.google.com/apis/credentials
- [ ] Criar "ID do cliente OAuth"
- [ ] Tipo: "Aplicativo da Web"
- [ ] Adicionar em "Origens JavaScript autorizadas":
  - [ ] `http://localhost:3333`
  - [ ] `http://127.0.0.1:3333`
- [ ] Deixar "URIs de redirecionamento" vazio
- [ ] Copiar o Client ID gerado

### Configuração Local

- [ ] Criar `apps/frontend/.env.local`
- [ ] Colar o Client ID em `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Criar `apps/backend/.env`
- [ ] Colar o MESMO Client ID em `GOOGLE_CLIENT_ID`
- [ ] Colar o Client Secret em `GOOGLE_CLIENT_SECRET`
- [ ] Configurar JWT_SECRET (mínimo 32 caracteres)

### Testar

- [ ] Iniciar backend: `cd apps/backend && npm run dev`
- [ ] Iniciar frontend: `cd apps/frontend && npm run dev`
- [ ] Abrir: http://localhost:3333/login
- [ ] Clicar em "Entrar com Google"
- [ ] Login deve funcionar!

---

## 🎯 Exemplo Real

Suponha que o Google gerou este Client ID para você:

```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### No Frontend (.env.local):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID="123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
```

### No Backend (.env):

```bash
GOOGLE_CLIENT_ID="123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
```

### No Google Cloud Console:

**Origens JavaScript autorizadas:**

```
http://localhost:3333
http://127.0.0.1:3333
```

**URIs de redirecionamento autorizados:**

```
(vazio)
```

---

## 🔗 Links Úteis

- [Google Cloud Console](https://console.cloud.google.com/)
- [Credenciais OAuth](https://console.cloud.google.com/apis/credentials)
- [Documentação GIS](https://developers.google.com/identity/gsi/web)

---

Qualquer dúvida, consulte o arquivo `GOOGLE_OAUTH_SETUP.md` para instruções detalhadas.
