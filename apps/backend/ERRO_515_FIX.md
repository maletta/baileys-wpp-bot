# Correção: Erro 515 (restartRequired) no QR Code

## 📅 Data: 30/10/2025

## 🐛 Problema Reportado

Ao tentar conectar via QR Code, o sistema apresentava o seguinte comportamento:

```
21:27:19 [info]: QR Code generated
21:27:47 [info]: Connection closed - statusCode: 515 (Reinício Necessário)
21:27:47 [info]: Attempting to reconnect (⚠️ ERRO: não deveria reconectar)
21:28:22 [info]: Connection closed - statusCode: 401 (Deslogado)
```

### Fluxo do Erro

1. ✅ QR Code gerado com sucesso
2. ❌ Erro 515: "Stream Errored (restart required)"
3. ❌ Sistema tenta reconectar automaticamente
4. ❌ Erro 401: "Connection Failure" (loggedOut)
5. ❌ Conexão falha definitivamente

## 🔍 Causa Raiz

### 1. Erro de Duplicação de Chaves no TypeScript

O enum `DisconnectReason` do Baileys tem valores duplicados:

```javascript
{
  "connectionLost": 408,
  "timedOut": 408,
  // ambos têm o mesmo valor!
}
```

Quando usados como chaves de objeto, TypeScript detecta erro:

```
Error: An object literal cannot have multiple properties with the same name.
```

### 2. Lógica de Reconexão Incorreta

O método `shouldReconnect()` estava configurado para reconectar em caso de erro 515:

```typescript
// ❌ ANTES (incorreto)
const doNotReconnect = [
  DisconnectReason.loggedOut, // 401
  DisconnectReason.badSession, // 500
  // Faltava: restartRequired (515)
];
```

**Problema:** Quando o WhatsApp retorna erro 515, significa que houve um erro crítico na stream que corrompeu a sessão. Tentar reconectar com a mesma sessão resulta em erro 401 porque as credenciais ficaram inválidas.

## ✅ Soluções Implementadas

### 1. Correção da Duplicação de Chaves

**Arquivo:** `BaileysSocketService.ts` - método `getDisconnectReason()`

```typescript
private getDisconnectReason(statusCode: number | undefined): string {
  // Nota: connectionLost e timedOut têm o mesmo valor (408), então só incluímos um
  const reasons: Record<number, string> = {
    [DisconnectReason.badSession]: 'Sessão Inválida',
    [DisconnectReason.connectionClosed]: 'Conexão Fechada',
    [DisconnectReason.timedOut]: 'Tempo Esgotado / Conexão Perdida', // 408 ⭐
    [DisconnectReason.connectionReplaced]: 'Conexão Substituída (outro dispositivo)',
    [DisconnectReason.loggedOut]: 'Deslogado',
    [DisconnectReason.restartRequired]: 'Reinício Necessário',
    [DisconnectReason.unavailableService]: 'Serviço Indisponível',
    403: 'Acesso Negado (Forbidden)',
    411: 'Incompatibilidade Multi-Dispositivo'
  };

  return reasons[statusCode] || `Código ${statusCode} - Desconhecido`;
}
```

**Mudança:** Removido `connectionLost` e mantido apenas `timedOut` com descrição combinada.

### 2. Correção da Lógica de Reconexão

**Arquivo:** `BaileysSocketService.ts` - método `shouldReconnect()`

```typescript
private shouldReconnect(statusCode: number | undefined): boolean {
  if (!statusCode) return true;

  // Não reconectar em casos específicos que requerem novo QR code
  const doNotReconnect = [
    DisconnectReason.loggedOut,           // 401 - Usuário fez logout
    DisconnectReason.badSession,          // 500 - Sessão inválida/corrompida
    DisconnectReason.restartRequired,     // 515 - Requer reinício completo ⭐ NOVO
  ];

  return !doNotReconnect.includes(statusCode);
}
```

**Mudança:** Adicionado `DisconnectReason.restartRequired` à lista de erros que **não** devem reconectar.

### 3. Logs Melhorados

Adicionado log específico quando a sessão precisa ser limpa:

```typescript
logger.warn("Connection requires new session", {
  sessionId,
  statusCode,
  reason: this.getDisconnectReason(statusCode),
  message: "Sessão será limpa. Um novo QR code será necessário.",
});
```

## 🎯 Comportamento Correto

### Antes (Incorreto)

```
QR Code → Erro 515 → Tenta reconectar → Erro 401 → Falha
```

### Depois (Correto)

```
QR Code → Erro 515 → Limpa sessão → Aguarda novo QR code
```

## 📊 Códigos de Erro do WhatsApp

### Erros que RECONECTAM automaticamente:

- **408** - Timeout / Conexão Perdida (connectionLost/timedOut)
- **428** - Conexão Fechada (connectionClosed)
- **440** - Conexão Substituída (connectionReplaced)
- **503** - Serviço Indisponível (unavailableService)

### Erros que LIMPAM sessão (exigem novo QR code):

- **401** - Deslogado (loggedOut)
- **500** - Sessão Inválida (badSession)
- **515** - Reinício Necessário (restartRequired) ⭐ **CORRIGIDO**

### Outros códigos:

- **403** - Acesso Negado (forbidden)
- **411** - Incompatibilidade Multi-Dispositivo (multideviceMismatch)

## 🧪 Como Testar

1. **Iniciar o backend:**

```bash
cd apps/backend
npm run dev
```

2. **Tentar conectar via QR code:**

- Abrir o frontend
- Gerar novo QR code
- Aguardar 30 segundos sem escanear

3. **Observar os logs:**

```
[info]: QR Code generated
[info]: Connection closed - statusCode: 515
[warn]: Connection requires new session
[info]: Session directory cleared
```

4. **Resultado esperado:**

- ✅ Sessão limpa automaticamente
- ✅ Não tenta reconectar
- ✅ Frontend pode solicitar novo QR code
- ✅ Sem erro 401 subsequente

## 📝 Notas Importantes

### Por que o erro 515 acontece?

O erro 515 pode ocorrer em várias situações:

- QR code não escaneado dentro do timeout
- Problemas temporários na conexão com servidores do WhatsApp
- Stream de dados corrompida durante handshake inicial
- Versão do Baileys incompatível (raro)

### É normal esse erro acontecer?

✅ **Sim**, é normal acontecer ocasionalmente, especialmente:

- Durante desenvolvimento/testes
- Em conexões instáveis
- Ao deixar QR code expirar

### O que mudou para o usuário?

**Antes:** Sistema ficava em loop de reconexão e falhava  
**Depois:** Sistema limpa automaticamente e permite gerar novo QR code

Não há mudança na experiência do usuário final - apenas comportamento mais robusto nos bastidores.

## 🔗 Arquivos Modificados

1. **`src/infrastructure/services/BaileysSocketService.ts`**
   - Linha 607-617: Método `shouldReconnect()` - adicionado erro 515
   - Linha 622-639: Método `getDisconnectReason()` - corrigida duplicação
   - Linha 346-351: Logs melhorados na limpeza de sessão

2. **`RECONNECTION_FIX.md`**
   - Atualizado com informações sobre erro 515
   - Documentação dos códigos de erro
   - Comportamentos esperados

## 📚 Referências

- [Baileys DisconnectReason](https://github.com/WhiskeySockets/Baileys/blob/master/src/Types/State.ts)
- [Documentação do Baileys](https://github.com/WhiskeySockets/Baileys)
- Issue relacionada: Stream Error handling

## ✅ Checklist de Validação

- [x] Erro de lint corrigido (duplicação de chaves)
- [x] Lógica de reconexão atualizada (erro 515)
- [x] Logs melhorados
- [x] Documentação atualizada
- [x] Código compila sem erros
- [x] Comportamento testado

---

**Resumo:** O erro 515 agora é tratado corretamente, limpando a sessão e permitindo que o usuário gere um novo QR code, em vez de ficar em loop de reconexão falhando com erro 401.
