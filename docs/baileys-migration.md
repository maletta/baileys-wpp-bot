# Migração para Baileys v7.0.0

## Visão Geral

Este documento descreve as mudanças necessárias para migrar do pacote `@baileys/whiskeysockets` para o novo `baileys` v7.0.0-rc.3.

## Principais Mudanças

### 1. Mudança de Pacote

```bash
# Remover pacote antigo
npm uninstall @baileys/whiskeysockets

# Instalar nova versão
npm install baileys@^7.0.0-rc.3
```

### 2. Imports Atualizados

```typescript
// Antes
import makeWASocket from "@baileys/whiskeysockets";

// Agora
import makeWASocket from "baileys";
```

### 3. Configuração de Versão

A nova versão do Baileys requer especificação explícita da versão do WhatsApp Web:

```typescript
const socket = makeWASocket({
  auth: state,
  version: [2, 2429, 4], // Versão específica compatível
  // outras configurações...
});
```

## Breaking Changes

### API Changes

- O pacote foi reorganizado para melhor estrutura de módulos
- Algumas interfaces foram refinadas para melhor tipagem
- Métodos deprecados foram removidos

### Event Handling

- Events mantêm a mesma estrutura
- Melhor tipagem para eventos de grupos e mensagens
- Performance otimizada para handling de eventos

### Authentication

- Sistema de autenticação mantém compatibilidade
- Melhor suporte para multi-device
- Sessões mais estáveis

## Verificações Necessárias

### 1. Testes de Conexão

Após a migração, verificar:

- [ ] Geração de QR Code funciona
- [ ] Autenticação via QR Code
- [ ] Reconexão automática
- [ ] Event listeners funcionando

### 2. Funcionalidades Core

- [ ] Envio de mensagens
- [ ] Recebimento de eventos de grupo
- [ ] Sincronização de participantes
- [ ] Upload/download de mídia

### 3. Performance

- [ ] Tempo de conexão
- [ ] Uso de memória
- [ ] Estabilidade da conexão
- [ ] Rate limiting

## Configurações Recomendadas

### Socket Configuration

```typescript
const socket = makeWASocket({
  auth: state,
  version: [2, 2429, 4],
  generateHighQualityLinkPreview: true,
  markOnlineOnConnect: false,
  browser: ["Chrome", "Desktop", "1.0.0"],
  defaultQueryTimeoutMs: 60000,
  keepAliveIntervalMs: 30000,
  getMessage: messageHandler,
  syncFullHistory: false,
  maxMsgRetryCount: 3,
  logger: logger,
  // Novas opções v7.0.0
  printQRInTerminal: false,
  shouldSyncHistoryMessage: () => false,
  qrTimeout: 40000,
});
```

### Error Handling

```typescript
// Melhor handling de erros de conexão
socket.ev.on("connection.update", (update) => {
  const { connection, lastDisconnect, qr } = update;

  if (connection === "close") {
    const shouldReconnect =
      lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

    if (shouldReconnect) {
      // Implementar retry logic
      this.reconnect();
    }
  }
});
```

## Monitoramento

### Logs Específicos

Adicionar logs para monitorar a migração:

```typescript
logger.info("Baileys v7.0.0 connection starting", {
  version: "7.0.0-rc.3",
  sessionId,
  timestamp: new Date().toISOString(),
});
```

### Health Checks

```typescript
// Verificação de saúde da conexão
const healthCheck = () => {
  return {
    connected: socket?.user?.id ? true : false,
    version: "7.0.0-rc.3",
    uptime: process.uptime(),
    lastHeartbeat: new Date().toISOString(),
  };
};
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Importação

```
Error: Cannot find module 'baileys'
```

**Solução**: Verificar se o pacote foi instalado corretamente

```bash
npm install baileys@^7.0.0-rc.3
npm run build
```

#### 2. Erro de Versão

```
Error: Invalid version format
```

**Solução**: Usar formato correto de versão:

```typescript
version: [2, 2429, 4]; // Array de números
```

#### 3. Problemas de Conexão

```
Connection timeout
```

**Solução**: Ajustar timeouts:

```typescript
defaultQueryTimeoutMs: 60000,
qrTimeout: 40000
```

### Debug Mode

Para debug detalhado:

```typescript
const logger = pino({
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});
```

## Rollback Plan

Se necessário reverter:

1. **Backup das Sessões**

```bash
cp -r sessions sessions-backup-$(date +%Y%m%d)
```

2. **Reverter Pacote**

```bash
npm uninstall baileys
npm install @baileys/whiskeysockets@latest
```

3. **Restaurar Código**

```bash
git checkout HEAD~1 -- apps/backend/src/infrastructure/services/BaileysSocketService.ts
```

## Validação da Migração

### Checklist de Validação

- [ ] Build do projeto sem erros
- [ ] Testes passando
- [ ] Conexão WhatsApp funcionando
- [ ] QR Code sendo gerado
- [ ] Eventos sendo recebidos
- [ ] Mensagens sendo enviadas
- [ ] Logs estruturados funcionando
- [ ] Performance mantida ou melhorada

### Métricas a Monitorar

- Tempo de conexão inicial
- Taxa de sucesso de reconexão
- Latência de mensagens
- Uso de CPU/memória
- Erros de conexão

## Resources

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Changelog v7.0.0](https://github.com/WhiskeySockets/Baileys/releases)
- [Migration Guide](https://github.com/WhiskeySockets/Baileys/wiki/Migration-Guide)

## Suporte

Para problemas específicos da migração:

1. Verificar documentação oficial
2. Conferir issues no repositório Baileys
3. Testar em ambiente de desenvolvimento primeiro
4. Manter backup das sessões funcionais
