# Logs de Participantes em Grupos - Documentação

## 📋 Visão Geral

Este documento descreve os logs detalhados adicionados ao `BaileysSocketService` para monitorar eventos de entrada de participantes em grupos do WhatsApp.

## 🎯 Objetivo

Os logs foram implementados para ajudar a entender:

1. Estrutura completa dos eventos do Baileys quando participantes entram em grupos
2. Dados disponíveis sobre participantes através da API do WhatsApp
3. Diferentes métodos de buscar informações de participantes
4. Mudanças na API do WhatsApp ao longo do tempo

## 📊 Eventos Monitorados

### 1. Evento `group-participants.update`

Este é o evento principal disparado quando há mudanças nos participantes de um grupo.

**Logs incluídos:**

- ✅ Objeto completo do evento (JSON formatado)
- ✅ ID do grupo
- ✅ IDs dos participantes afetados
- ✅ Ação realizada (add, remove, promote, demote)

**Para entrada de participantes (action: 'add'):**

#### Metadados do Grupo

```javascript
await this.socket.groupMetadata(groupId);
```

Retorna informações completas do grupo incluindo:

- ID e nome do grupo
- Lista completa de participantes
- Data de criação
- Descrição
- Owner do grupo

#### Dados Individuais de Cada Participante

1. **onWhatsApp()** - Verifica se o número está no WhatsApp

```javascript
await this.socket.onWhatsApp(participantId);
```

Retorna:

- JID do usuário
- Se está no WhatsApp
- Status da conta

2. **profilePictureUrl()** - Busca URL da foto de perfil

```javascript
await this.socket.profilePictureUrl(participantId, "image");
```

Retorna:

- URL da foto de perfil (se disponível)
- Pode lançar erro se o usuário não tiver foto

3. **fetchStatus()** - Busca o status/recado do participante

```javascript
await this.socket.fetchStatus(participantId);
```

Retorna:

- Texto do status
- Data de atualização

4. **Dados do Participante no Grupo**

```javascript
const updatedGroupMeta = await this.socket.groupMetadata(groupId);
const participantInGroup = updatedGroupMeta.participants.find(
  (p) => p.id === participantId
);
```

Retorna:

- ID do participante
- Se é admin
- LID (Linked ID)
- Outras informações específicas do grupo

### 2. Evento `messages.upsert` (Message Stubs)

Evento alternativo que também captura entradas através de message stubs.

**Message Stub Types Monitorados:**

- `27` - Participante entrou no grupo
- `28` - Participante saiu do grupo
- `29` - Participante foi removido
- `30` - Participante promovido a admin
- `31` - Participante removido de admin
- `32` - Grupo criado

**Logs incluídos:**

- ✅ Objeto completo do message update
- ✅ Message stub type
- ✅ Mensagem completa (JSON formatado)
- ✅ Message stub parameters (informações adicionais)
- ✅ Dados do participante no grupo
- ✅ Dados do onWhatsApp()

## 🔍 Formato dos Logs

### Console Output

Os logs aparecem no console com formatação clara:

```
========== GROUP PARTICIPANTS UPDATE EVENT ==========
OBJETO COMPLETO DO EVENTO:
{
  "id": "120363123456789@g.us",
  "participants": ["5511999999999@s.whatsapp.net"],
  "action": "add"
}
====================================================

🟢 EVENTO: PARTICIPANTE(S) ADICIONADO(S) AO GRUPO
Group ID: 120363123456789@g.us
Participants IDs: [ '5511999999999@s.whatsapp.net' ]

--- Buscando metadados completos do grupo ---
METADADOS COMPLETOS DO GRUPO:
{...}

--- Dados do participante: 5511999999999@s.whatsapp.net ---
Tentando buscar dados com onWhatsApp()...
RESULTADO onWhatsApp():
{...}

Tentando buscar foto de perfil...
URL DA FOTO DE PERFIL: https://...

Tentando buscar status...
STATUS DO PARTICIPANTE:
{...}

--- Fim dos dados de 5511999999999@s.whatsapp.net ---

========== FIM DO EVENTO ==========
```

## 🚀 Como Testar

### Pré-requisitos

1. Backend rodando
2. WhatsApp conectado via QR Code
3. Bot adicionado a pelo menos um grupo

### Cenários de Teste

1. **Adicionar Manualmente um Participante**
   - Entre em um grupo onde o bot está
   - Adicione um novo participante
   - Observe os logs no console do backend

2. **Participante Entrando via Link**
   - Gere um link de convite para o grupo
   - Compartilhe e aguarde alguém entrar
   - Observe os logs

3. **Múltiplos Participantes**
   - Adicione vários participantes ao mesmo tempo
   - Observe como o sistema processa cada um

## 📝 Informações Importantes

### Tratamento de Erros

Todos os métodos de busca de dados possuem try-catch individual, garantindo que:

- Um erro ao buscar foto não impede buscar o status
- Falhas em um participante não afetam outros
- O fluxo continua mesmo com erros

### Performance

Os logs são executados de forma **síncrona** para cada participante para garantir:

- Ordem correta dos logs
- Dados completos antes de processar o próximo
- Facilidade de debug

⚠️ **Nota:** Em produção, considere desabilitar ou reduzir esses logs detalhados.

### Dados Sensíveis

Os logs incluem:

- ⚠️ Números de telefone (JIDs)
- ⚠️ URLs de fotos de perfil
- ⚠️ Status/recados dos usuários
- ⚠️ Nomes dos grupos

**Recomendação:** Não compartilhe logs em ambientes públicos.

## 🔧 Configuração

### Desabilitar Logs Detalhados

Para desabilitar os logs em produção, você pode:

1. **Opção 1:** Adicionar variável de ambiente

```typescript
if (process.env.DEBUG_PARTICIPANT_EVENTS === 'true') {
  console.log(...);
}
```

2. **Opção 2:** Comentar os console.log
   Comente os blocos de console.log no código

3. **Opção 3:** Usar o logger do Winston
   Substituir `console.log` por `logger.debug` (que pode ser desabilitado via LOG_LEVEL)

### Nível de Log do Baileys

O nível de log do Baileys pode ser ajustado via variável de ambiente:

```bash
BAILEYS_LOG_LEVEL=silent  # Opções: trace, debug, info, warn, error, fatal, silent
```

## 🐛 Debug e Troubleshooting

### Logs Não Aparecem

1. Verifique se o evento está sendo disparado
2. Confirme que o bot está no grupo
3. Verifique permissões do bot no grupo

### Erros Comuns

#### "WhatsApp not connected"

- O socket não está conectado
- Reconecte o WhatsApp

#### "Error fetching profile picture"

- Normal se o usuário não tiver foto
- Erro é capturado e logado

#### "Error fetching status"

- Configurações de privacidade do usuário
- Erro é capturado e logado

## 📚 Métodos da API Baileys Utilizados

| Método                         | Descrição                           | Retorno                     |
| ------------------------------ | ----------------------------------- | --------------------------- |
| `groupMetadata(groupId)`       | Busca metadados completos do grupo  | GroupMetadata               |
| `onWhatsApp(jid)`              | Verifica se número está no WhatsApp | Array de OnWhatsAppResponse |
| `profilePictureUrl(jid, type)` | URL da foto de perfil               | string (URL)                |
| `fetchStatus(jid)`             | Busca status/recado do usuário      | { status, setAt }           |

## 🔄 Manutenção

### Atualizações da API do WhatsApp

O WhatsApp frequentemente atualiza sua API. Use estes logs para:

1. Identificar novos campos nos eventos
2. Detectar mudanças na estrutura dos dados
3. Descobrir novos message stub types
4. Adaptar o código às mudanças

### Como Adicionar Novos Logs

Para adicionar logs de outros eventos:

1. Identifique o evento no Baileys
2. Adicione listener no `setupEventListeners()`
3. Logue o objeto completo primeiro
4. Adicione logs específicos conforme necessário
5. Documente neste arquivo

## 📞 Contato e Suporte

Para dúvidas sobre os logs ou eventos do Baileys, consulte:

- [Documentação do Baileys](https://github.com/WhiskeySockets/Baileys)
- [Issues do projeto](https://github.com/WhiskeySockets/Baileys/issues)

---

**Última atualização:** 29/10/2025
**Versão do Baileys:** Verificar em `package.json`
