# 🚀 Guia Rápido - Acesso Mobile

## ⚡ Solução Rápida (1 minuto)

Seu problema: **Backend na porta 4444 não está mapeado para o celular.**

### Solução:

```bash
# Execute este comando com o celular conectado via USB:
adb reverse tcp:4444 tcp:4444

# Agora acesse no navegador do celular:
# http://localhost:4444/health
```

✅ **Pronto!** O celular agora pode acessar seu backend.

---

## 📱 Setup Completo Automatizado

Use o script que criamos:

```bash
# Na raiz do projeto
./setup-mobile.sh setup
```

Isso vai:

1. ✅ Mapear porta 3333 (frontend)
2. ✅ Mapear porta 4444 (backend)
3. ✅ Verificar variáveis de ambiente
4. ✅ Mostrar próximos passos

---

## 🔍 Verificar se Funcionou

```bash
# Método 1: Via script
./setup-mobile.sh test

# Método 2: Manualmente no celular
# Abra o navegador e acesse:
# - Frontend: http://localhost:3333
# - Backend: http://localhost:4444/health
```

---

## 📋 Comandos Úteis

```bash
# Ver portas mapeadas
adb reverse --list

# Remover mapeamentos
adb reverse --remove-all

# Reconectar tudo
./setup-mobile.sh reconnect

# Ver ajuda
./setup-mobile.sh help
```

---

## ⚠️ Se Não Funcionar

### 1. Celular não detectado:

```bash
adb devices
# Se vazio:
# - Ative "Depuração USB" no celular
# - Autorize o computador (pop-up no celular)
```

### 2. Backend não responde:

```bash
# Verifique se está rodando
cd apps/backend
npm run dev

# Deve mostrar: "Server running on port 4444"
```

### 3. Frontend não responde:

```bash
# Verifique se está rodando
cd apps/frontend
npm run dev

# Deve mostrar: "ready - started server on 0.0.0.0:3333"
```

### 4. Variáveis erradas:

```bash
./setup-mobile.sh check-env

# Se houver erros, crie/edite:
# - apps/backend/.env (PORT=4444)
# - apps/frontend/.env.local (NEXT_PUBLIC_API_URL=http://localhost:4444/api)
```

---

## 💡 Por que `localhost` funciona?

```
┌──────────────┐         adb reverse          ┌─────────────┐
│   Celular    │ ◄───────────────────────────►│     PC      │
│              │                               │             │
│ localhost:   │                               │  Backend:   │
│   3333 ────► │ ───────────────────────────► │    :3333    │
│   4444 ────► │ ───────────────────────────► │    :4444    │
└──────────────┘                               └─────────────┘
```

`adb reverse` cria um "túnel reverso" que redireciona `localhost` do celular para o PC.

---

## 📚 Documentação Completa

Leia `MOBILE_SETUP.md` para:

- Configuração via WiFi
- Uso com Docker/Kubernetes
- Troubleshooting avançado
- Configuração de IP de rede

---

## ✅ Checklist

- [ ] Backend rodando na porta **4444**
- [ ] Frontend rodando na porta **3333**
- [ ] Celular conectado via USB
- [ ] `adb reverse tcp:4444 tcp:4444` executado
- [ ] `adb reverse tcp:3333 tcp:3333` executado
- [ ] `http://localhost:4444/health` funciona no celular
- [ ] `http://localhost:3333` funciona no celular

---

**Dúvidas?** Execute: `./setup-mobile.sh help`
