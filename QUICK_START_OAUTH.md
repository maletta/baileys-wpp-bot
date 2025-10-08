# ⚡ Quick Start - Google OAuth

## 📋 TL;DR: O que configurar no GCP

### 🎯 Painel: Google Cloud Console → Credenciais → + Criar Credenciais → ID do cliente OAuth

```
┌─────────────────────────────────────────────────────┐
│  Tipo de aplicativo: Aplicativo da Web             │
├─────────────────────────────────────────────────────┤
│  Nome: WhatsApp Baileys - Web Client               │
├─────────────────────────────────────────────────────┤
│  Origens JavaScript autorizadas:                    │
│  ✅ http://localhost:3333                           │
│  ✅ http://127.0.0.1:3333                           │
├─────────────────────────────────────────────────────┤
│  URIs de redirecionamento autorizados:              │
│  ⛔ (deixar vazio / não adicionar nada)             │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Variáveis que você precisa configurar

### Frontend: `apps/frontend/.env.local` (criar este arquivo)

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3333"
NEXT_PUBLIC_API_URL="http://localhost:4444/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="cole-aqui-o-client-id-do-gcp"
```

### Backend: `apps/backend/.env` (criar este arquivo)

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/whatsapp_baileys_db"
MONGODB_URL="mongodb://localhost:27017/whatsapp_messages"

# JWT (gere chaves fortes!)
JWT_SECRET="sua-chave-min-32-chars"
JWT_REFRESH_SECRET="outra-chave-min-32-chars"

# Google - USE O MESMO CLIENT_ID!
GOOGLE_CLIENT_ID="cole-o-mesmo-client-id-do-frontend"
GOOGLE_CLIENT_SECRET="cole-o-secret-do-gcp"

# Server
PORT=4444
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3333"
```

---

## ⚠️ Valores que DEVEM SER IGUAIS

```
Frontend (NEXT_PUBLIC_GOOGLE_CLIENT_ID)  ────┐
                                               ├─── MESMO VALOR
Backend (GOOGLE_CLIENT_ID)               ────┘
```

---

## 🚀 Testar

```bash
# Terminal 1
cd apps/backend
npm run dev

# Terminal 2
cd apps/frontend
npm run dev

# Navegador
http://localhost:3333/login
```

---

## 📚 Documentação Completa

- Detalhes: `GOOGLE_OAUTH_SETUP.md`
- Referência: `CONFIG_REFERENCE.md`
