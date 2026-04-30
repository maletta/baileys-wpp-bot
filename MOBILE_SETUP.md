# 📱 Configuração para Acesso Mobile via ADB

Guia completo para acessar o frontend e backend no celular Android durante desenvolvimento.

## 🎯 Problema

Quando você acessa `localhost:4444` no navegador do celular, ele busca no **próprio celular**, não no seu PC.

## ✅ Solução: ADB Reverse

O `adb reverse` cria um "túnel reverso" que faz o celular redirecionar conexões locais para o PC.

---

## 📋 Passo a Passo

### 1️⃣ **Verificar Portas Configuradas**

**Backend:**

```bash
grep "PORT=" apps/backend/.env
# Resultado esperado: PORT=4444
```

**Frontend:**

```bash
grep "NEXT_PUBLIC_API_URL" apps/frontend/.env.local 2>/dev/null || echo "Arquivo não existe"
# Deve apontar para: http://localhost:4444/api
```

---

### 2️⃣ **Criar/Atualizar `.env.local` do Frontend**

Crie o arquivo `apps/frontend/.env.local` com:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3333"
NEXT_PUBLIC_API_URL="http://localhost:4444/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="seu-google-client-id-aqui"
NEXT_PUBLIC_APP_NAME="WhatsApp Baileys"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

⚠️ **IMPORTANTE:** Use `http://localhost:4444/api` (porta do backend)

---

### 3️⃣ **Configurar ADB Reverse**

Execute estes comandos **com o celular conectado via USB ou em modo depuração WIFI sem USB** :

```bash
# 1. Mapear porta do frontend (Next.js)
adb reverse tcp:3333 tcp:3333

# 2. Mapear porta do backend (Express/API)
adb reverse tcp:4444 tcp:4444

# 3. (Opcional) Habilitar conexão via WiFi
adb tcpip 5555

# 4. (Opcional) Desconectar USB e conectar via IP
# Descubra o IP do celular em: Configurações > Sobre > Status
adb connect 192.168.1.XXX:5555
```

---

### 4️⃣ **Verificar Configurações**

**Confirmar ADB reverse ativo:**

```bash
adb reverse --list
```

**Resultado esperado:**

```
tcp:3333 tcp:3333
tcp:4444 tcp:4444
```

---

### 5️⃣ **Testar Acesso**

**No navegador do celular, acesse:**

1. **Frontend:** `http://localhost:3333`
   - ✅ Deve carregar a aplicação

2. **Backend Health Check:** `http://localhost:4444/health`
   - ✅ Deve retornar JSON com status dos serviços

3. **API de Auth:** `http://localhost:4444/api/auth/profile`
   - ⚠️ Pode retornar 401 (normal se não estiver autenticado)

---

## 🔧 Solução Alternativa: IP da Rede

Se você **não quiser usar** `adb reverse`:

### 1. Descubra o IP do seu PC:

```bash
hostname -I | awk '{print $1}'
# Exemplo: 192.168.1.100
```

### 2. Crie `.env.local` no frontend:

```env
NEXT_PUBLIC_APP_URL="http://192.168.1.100:3333"
NEXT_PUBLIC_API_URL="http://192.168.1.100:4444/api"
```

### 3. Configure o backend para aceitar conexões externas:

```env
# apps/backend/.env
CORS_ORIGIN="http://192.168.1.100:3333"
```

### 4. No celular, acesse:

- Frontend: `http://192.168.1.100:3333`
- Backend: `http://192.168.1.100:4444/health`

⚠️ **Requisitos:**

- Celular e PC na mesma rede WiFi
- Firewall não pode bloquear as portas

---

## 🐛 Troubleshooting

### Problema: "Connection refused" no celular

**Causa:** ADB reverse não configurado ou perdido

**Solução:**

```bash
# Verificar se está ativo
adb reverse --list

# Se não estiver, reconfigurar
adb reverse tcp:3333 tcp:3333
adb reverse tcp:4444 tcp:4444
```

---

### Problema: Frontend carrega mas API falha

**Causa:** Frontend não está usando a porta correta do backend

**Solução:**

```bash
# Verificar .env.local do frontend
cat apps/frontend/.env.local | grep API_URL

# Deve ser: http://localhost:4444/api (não 3001!)
```

---

### Problema: "Device not found"

**Causa:** ADB não detecta o celular

**Solução:**

```bash
# 1. Verificar conexão USB
adb devices

# 2. Se vazio, ativar "Depuração USB" no celular
# Configurações > Opções do desenvolvedor > Depuração USB

# 3. Autorizar computador no celular (pop-up)

# 4. Verificar novamente
adb devices
```

---

### Problema: ADB reverse se perde após desconectar USB

**Causa:** Mapeamentos são perdidos quando desconecta

**Solução:**

```bash
# Usar script de reconexão rápida
./setup-mobile.sh reconnect
```

---

## 📝 Script Automatizado

Criamos um script para facilitar: `setup-mobile.sh`

```bash
# Setup inicial completo
./setup-mobile.sh setup

# Apenas reconectar (se perdeu conexão)
./setup-mobile.sh reconnect

# Verificar status
./setup-mobile.sh status

# Limpar mapeamentos
./setup-mobile.sh clean
```

---

## 🎨 Resumo Visual

```
┌─────────────┐                    ┌──────────────┐
│   Celular   │                    │      PC      │
├─────────────┤                    ├──────────────┤
│             │  adb reverse       │              │
│ localhost:  │ ◄──────────────────┤  Frontend:   │
│   3333 ────►│                    │    :3333     │
│   4444 ────►│                    │  Backend:    │
│             │                    │    :4444     │
└─────────────┘                    └──────────────┘
```

---

## ✅ Checklist Rápido

- [ ] Backend rodando na porta 4444
- [ ] Frontend rodando na porta 3333
- [ ] `.env.local` do frontend aponta para `:4444/api`
- [ ] `adb reverse tcp:3333 tcp:3333` executado
- [ ] `adb reverse tcp:4444 tcp:4444` executado
- [ ] `adb reverse --list` mostra ambas as portas
- [ ] `http://localhost:3333` abre no celular
- [ ] `http://localhost:4444/health` funciona no celular

---

## 🚀 Comandos Rápidos

```bash
# Setup completo em um comando
adb reverse tcp:3333 tcp:3333 && \
adb reverse tcp:4444 tcp:4444 && \
adb reverse --list && \
echo "✅ ADB reverse configurado!"

# Testar no celular (via adb shell)
adb shell "curl -s http://localhost:4444/health | head -n 5"
```
