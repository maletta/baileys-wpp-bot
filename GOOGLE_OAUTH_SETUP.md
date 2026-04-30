# 🔐 Guia de Configuração - Google OAuth 2.0

Este guia te ajuda a configurar o OAuth do Google no projeto WhatsApp Baileys.

---

## 📋 Passo 1: Criar Credenciais no Google Cloud Console

### 1.1. Acesse o Console

1. Vá para: https://console.cloud.google.com/
2. Selecione seu projeto ou crie um novo
3. Navegue para: **APIs e serviços** → **Credenciais**

### 1.2. Criar ID do Cliente OAuth 2.0

1. Clique em **+ CRIAR CREDENCIAIS**
2. Selecione **ID do cliente OAuth**
3. Escolha tipo: **Aplicativo da Web**
4. Dê um nome: `WhatsApp Baileys - Web Client`

---

## 🌐 Passo 2: Configurar URIs no Google Cloud

### Para DESENVOLVIMENTO:

#### **Origens JavaScript autorizadas** (obrigatório):

```
http://localhost:3333
http://127.0.0.1:3333
```

#### **URIs de redirecionamento autorizados** (deixar vazio):

```
(não adicionar nada)
```

### Para PRODUÇÃO (adicionar depois):

#### **Origens JavaScript autorizadas**:

```
https://seudominio.com
https://www.seudominio.com
```

---

## 📝 Passo 3: Copiar as Credenciais

Após criar, o Google vai mostrar:

- ✅ **Client ID**: algo como `123456789-abc...xyz.apps.googleusercontent.com`
- ⚠️ **Client Secret**: `GOCSPX-abc123...` (não é usado no fluxo atual, mas guarde)

---

## 🔧 Passo 4: Configurar Variáveis de Ambiente

### Frontend (.env ou .env.local)

Crie o arquivo `apps/frontend/.env.local`:

```bash
# DESENVOLVIMENTO
NEXT_PUBLIC_APP_URL="http://localhost:3333"
NEXT_PUBLIC_API_URL="http://localhost:4444/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="SEU_CLIENT_ID_AQUI.apps.googleusercontent.com"
NEXT_PUBLIC_APP_NAME="WhatsApp Baileys"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Backend (.env)

Crie o arquivo `apps/backend/.env`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_baileys_db"
MONGODB_URL="mongodb://localhost:27017/whatsapp_messages"

# JWT (gere secrets fortes!)
JWT_SECRET="sua-chave-secreta-super-forte-aqui-min-32-chars"
JWT_REFRESH_SECRET="outra-chave-secreta-diferente-min-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth (USE O MESMO CLIENT_ID DO FRONTEND!)
GOOGLE_CLIENT_ID="SEU_CLIENT_ID_AQUI"
GOOGLE_CLIENT_SECRET="SEU_CLIENT_SECRET_AQUI"
GOOGLE_REDIRECT_URI="http://localhost:4444/auth/google/callback"

# Server
PORT=4444
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

## ⚠️ IMPORTANTE: Valores que DEVEM ser iguais

| Variável         | Frontend                       | Backend            | GCP                 |
| ---------------- | ------------------------------ | ------------------ | ------------------- |
| **Client ID**    | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` | ID do Cliente OAuth |
| **Frontend URL** | `NEXT_PUBLIC_APP_URL`          | `CORS_ORIGIN`      | Origens JavaScript  |

---

## 🚀 Passo 5: Testar a Configuração

### 5.1. Iniciar os servidores

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

### 5.2. Acessar e testar

1. Abra: http://localhost:3333/login
2. Clique em "Entrar com Google"
3. Popup do Google deve abrir
4. Faça login e autorize
5. Deve ser redirecionado para o dashboard

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

- ✅ **Causa**: URI não está nas Origens JavaScript autorizadas
- 🔧 **Solução**: Adicione `http://localhost:3333` no GCP

### Erro: "idpiframe_initialization_failed"

- ✅ **Causa**: Cookies de terceiros bloqueados
- 🔧 **Solução**: Habilite cookies no navegador (temporariamente para dev)

### Erro: "Invalid client ID"

- ✅ **Causa**: Client ID incorreto ou não copiado corretamente
- 🔧 **Solução**: Verifique se copiou o ID completo do GCP

### Erro: "Token inválido" no backend

- ✅ **Causa**: Client IDs diferentes entre frontend e backend
- 🔧 **Solução**: Garanta que ambos usam o MESMO Client ID

---

## 🌍 Passo 6: Configuração de Produção

### 6.1. Atualizar URIs no GCP

Adicione suas URLs de produção:

```
https://seuapp.com
https://www.seuapp.com
```

### 6.2. Atualizar variáveis de ambiente

**Frontend (Vercel/Netlify/etc):**

```bash
NEXT_PUBLIC_APP_URL="https://seuapp.com"
NEXT_PUBLIC_API_URL="https://api.seuapp.com/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="SEU_CLIENT_ID"
```

**Backend (Heroku/AWS/etc):**

```bash
NODE_ENV="production"
CORS_ORIGIN="https://seuapp.com"
GOOGLE_CLIENT_ID="SEU_CLIENT_ID"
# ... demais variáveis
```

---

## 📚 Recursos Adicionais

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 for Client-side Web](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Configurar tela de consentimento OAuth](https://support.google.com/cloud/answer/10311615)

---

## ✅ Checklist Final

- [ ] Projeto criado no Google Cloud Console
- [ ] Credenciais OAuth 2.0 criadas
- [ ] Origens JavaScript autorizadas configuradas
- [ ] Client ID copiado para ambos .env (frontend e backend)
- [ ] Servidores iniciados e testados
- [ ] Login com Google funcionando
- [ ] (Opcional) Tela de consentimento OAuth configurada para produção

---

**🎉 Pronto! Seu OAuth do Google está configurado!**
