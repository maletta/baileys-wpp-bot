# Migração para @whiskeysockets/baileys v7.0.0-rc.6

## 📋 Resumo das Alterações

Este documento descreve as mudanças realizadas para migrar do pacote `baileys@6.7.20` para `@whiskeysockets/baileys@7.0.0-rc.6`.

## 🔄 Principais Mudanças

### 1. Atualização de Dependências

**Antes:**

```json
"baileys": "^6.7.20"
```

**Depois:**

```json
"@whiskeysockets/baileys": "^7.0.0-rc.6",
"@hapi/boom": "^10.0.1",
"pino": "^8.16.2"
```

### 2. Correção da Estrutura de Autenticação

**Antes (v6):**

```typescript
this.socket = makeWASocket({
  version,
  auth: state,
  // ...
});
```

**Depois (v7):**

```typescript
this.socket = makeWASocket({
  version,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
  },
  // ...
});
```

### 3. Imports Atualizados

**Antes:**

```typescript
import makeWASocket from // ...
"baileys";
```

**Depois:**

```typescript
import makeWASocket, {
  // ...
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
```

### 4. Logger Específico para Baileys

Foi criado um logger Pino específico para o Baileys (mais adequado que o Winston):

```typescript
import pino from "pino";

const baileysLogger = pino({
  level: process.env.BAILEYS_LOG_LEVEL || "silent",
});
```

### 5. Configurações Otimizadas

Ajustes nas configurações do socket para melhor compatibilidade:

```typescript
{
  browser: ['WhatsApp Bot', 'Chrome', '120.0.0'],
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  defaultQueryTimeoutMs: 60000,
  // ...
}
```

## 📁 Arquivos Modificados

1. **package.json**
   - Atualização de dependências

2. **src/infrastructure/services/BaileysSocketService.ts**
   - Imports atualizados
   - Logger Pino adicionado
   - Estrutura de autenticação corrigida

3. **env.example**
   - Nova variável: `BAILEYS_LOG_LEVEL="silent"`
   - Versão atualizada: `BAILEYS_VERSION="7.0.0-rc.6"`

4. **src/application/use-cases/HealthCheckUseCase.ts**
   - Versão padrão atualizada para 7.0.0-rc.6

5. **src/presentation/controllers/HealthController.ts**
   - Versão padrão atualizada para 7.0.0-rc.6

6. **HEALTH_CHECK.md**
   - Documentação atualizada com nova versão

## 🚀 Como Aplicar as Mudanças

### Passo 1: Remover node_modules e lock files

```bash
rm -rf node_modules package-lock.json
```

### Passo 2: Instalar novas dependências

```bash
npm install
```

### Passo 3: Atualizar arquivo .env

Adicione ou atualize as seguintes variáveis no seu arquivo `.env`:

```env
BAILEYS_VERSION="7.0.0-rc.6"
BAILEYS_LOG_LEVEL="silent"
```

### Passo 4: Limpar sessões antigas (IMPORTANTE!)

```bash
rm -rf sessions/*
```

⚠️ **ATENÇÃO:** As sessões criadas com a versão 6 do Baileys são **incompatíveis** com a versão 7. É necessário fazer um novo login escaneando o QR Code novamente.

### Passo 5: Reiniciar a aplicação

```bash
npm run dev
```

## 🔍 Principais Diferenças entre v6 e v7

### Estrutura de Autenticação

A v7 requer uma estrutura mais explícita para autenticação, separando `creds` e `keys`, e utilizando `makeCacheableSignalKeyStore` para gerenciar as chaves de forma mais eficiente.

### Logger

A v7 é otimizada para usar o logger Pino, que é mais performático que o Winston para logs internos do Baileys.

### Signal Protocol

A v7 implementa melhorias no protocolo Signal, exigindo o uso de `makeCacheableSignalKeyStore` para cache das chaves.

## ✅ Verificação

Após aplicar as mudanças, verifique se:

1. ✅ O servidor inicia sem erros
2. ✅ O endpoint `/health` retorna status 200
3. ✅ O QR Code é gerado corretamente
4. ✅ A conexão com WhatsApp é estabelecida após escanear o QR Code
5. ✅ As mensagens são recebidas e processadas

## 🐛 Troubleshooting

### Erro: "Cannot find module '@whiskeysockets/baileys'"

**Solução:** Execute `npm install` novamente

### Erro: "auth.creds is not a function"

**Solução:** Limpe as sessões antigas: `rm -rf sessions/*`

### Erro: "Invalid MAC"

**Solução:** Limpe as sessões antigas e faça um novo login

### QR Code não é gerado

**Solução:** Verifique se o `BAILEYS_LOG_LEVEL` está configurado e tente com `debug` para ver logs detalhados

## 📚 Referências

- [Baileys Official Repository](https://github.com/WhiskeySockets/Baileys)
- [Baileys v7 Migration Guide](https://github.com/WhiskeySockets/Baileys/blob/master/MIGRATION.md)
- [Pino Logger Documentation](https://getpino.io/)

## 🎉 Conclusão

A migração para `@whiskeysockets/baileys v7` traz melhorias de performance, segurança e estabilidade. As mudanças são principalmente na estrutura de autenticação e no sistema de logging.

**Data da migração:** Outubro 2025
**Versão anterior:** baileys@6.7.20
**Versão atual:** @whiskeysockets/baileys@7.0.0-rc.6
