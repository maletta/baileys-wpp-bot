# Funcionalidade de Conexão WhatsApp via Baileys

## 📋 Resumo

Esta funcionalidade implementa um sistema completo de gerenciamento de conexões WhatsApp usando a biblioteca Baileys, com comunicação em tempo real via WebSocket (Socket.IO) entre frontend e backend.

## 🎯 Características Implementadas

### Backend

1. **Repositório QrCodeTryRepository**
   - Registra todas as tentativas de geração de QR code
   - Armazena userId, ipAddress e timestamp de cada tentativa
   - Permite consultas e auditoria das tentativas

2. **Use Case RegisterQrCodeTryUseCase**
   - Valida permissões do usuário antes de registrar tentativa
   - Registra tentativas no banco de dados
   - Implementa lógica de negócio para controle de tentativas

3. **BaileysSocketService Melhorado**
   - Emite eventos em tempo real para o frontend via callbacks
   - Gerencia ciclo de vida da conexão WhatsApp
   - Eventos implementados:
     - `onQrCodeGenerated`: Quando um novo QR code é gerado
     - `onConnectionEstablished`: Quando dispositivo conecta com sucesso
     - `onConnectionFailed`: Quando há falha na conexão
     - Suporte a múltiplos QR codes consecutivos (quando o anterior expira)

4. **SessionSocketController**
   - Gerencia conexões WebSocket autenticadas
   - Implementa middleware de autenticação via JWT
   - Controla acesso por role (apenas DEVELOPER e HIGH_LEVEL_ADMIN)
   - Eventos Socket.IO implementados:
     - `session:request-qr`: Cliente solicita novo QR code
     - `session:check-status`: Verifica status da conexão
     - `session:disconnect`: Desconecta dispositivo ativo
     - `session:qr-code`: Servidor envia QR code para cliente
     - `session:connected`: Notifica cliente sobre conexão bem-sucedida
     - `session:error`: Notifica cliente sobre erros

5. **Integração no index.ts**
   - Inicializa todos os novos componentes
   - Configura Socket.IO com autenticação
   - Integra eventos do Baileys com Socket.IO

### Frontend

1. **Hook useWhatsAppConnection**
   - Gerencia estado da conexão WebSocket
   - Conecta automaticamente ao servidor usando token JWT
   - Gerencia estado local (isConnected, isConnecting, qrCode, deviceInfo, error)
   - Implementa handlers para todos os eventos do servidor
   - Funções expostas:
     - `requestQrCode()`: Solicita novo QR code
     - `disconnect()`: Desconecta dispositivo
     - `checkStatus()`: Verifica status atual da conexão

2. **Componente WhatsAppPage Melhorado**
   - Interface moderna e responsiva
   - Controle de acesso baseado em role (apenas DEVELOPER)
   - Exibe QR code usando `react-qr-code`
   - Estados visuais claros (conectado, conectando, desconectado)
   - Feedback visual com toasts
   - Cards informativos com estatísticas
   - Botões de ação contextuais

## 🔐 Controle de Acesso

### Backend

- Rotas REST protegidas com `authMiddleware.requireRole(['HIGH_LEVEL_ADMIN', 'DEVELOPER'])`
- WebSocket protegido com autenticação JWT no handshake
- Validação de role em cada evento Socket.IO

### Frontend

- Verificação de role antes de renderizar interface
- Mensagem de "Acesso Restrito" para usuários sem permissão
- Apenas DEVELOPER e HIGH_LEVEL_ADMIN podem:
  - Visualizar a página
  - Gerar QR codes
  - Conectar/desconectar dispositivos

## 📊 Fluxo de Conexão

### 1. Solicitação de QR Code

```
Frontend                    Backend                     Baileys
   |                           |                           |
   |-- session:request-qr ---->|                           |
   |                           |--- createConnection ----->|
   |                           |                           |
   |                           |<---- QR code gerado ------|
   |<-- session:qr-code -------|                           |
   |                           |                           |
   | (Exibe QR code na tela)   |                           |
```

### 2. Leitura do QR Code

```
Frontend                    Backend                     Baileys
   |                           |                           |
   |                           |<---- connection open -----|
   |<-- session:connected -----|                           |
   |                           |                           |
   | (Exibe sucesso)           |                           |
```

### 3. Novo QR Code (quando expira)

```
Frontend                    Backend                     Baileys
   |                           |                           |
   |                           |<---- novo QR gerado ------|
   |<-- session:qr-code -------|                           |
   |                           |                           |
   | (Atualiza QR na tela)     |                           |
```

### 4. Desconexão

```
Frontend                    Backend                     Baileys
   |                           |                           |
   |-- session:disconnect ---->|                           |
   |                           |--- disconnect() --------->|
   |                           |--- limpa sessão --------->|
   |<-- success ---------------|                           |
```

## 🗄️ Banco de Dados

### Tabela `qr_code_tries`

```prisma
model QrCodeTry {
  id        String   @id @default(cuid())
  userId    String?
  ipAddress String?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@map("qr_code_tries")
}
```

## 📡 Eventos WebSocket

### Cliente -> Servidor

| Evento                 | Parâmetros | Retorno                                       | Descrição                   |
| ---------------------- | ---------- | --------------------------------------------- | --------------------------- |
| `session:request-qr`   | -          | `{ success, sessionId?, error? }`             | Solicita geração de QR code |
| `session:check-status` | -          | `{ success, connected, device?, sessionId? }` | Verifica status da conexão  |
| `session:disconnect`   | -          | `{ success, message?, error? }`               | Desconecta dispositivo      |

### Servidor -> Cliente

| Evento              | Dados                            | Descrição                 |
| ------------------- | -------------------------------- | ------------------------- |
| `session:qr-code`   | `{ qrCode, sessionId }`          | QR code gerado (data URL) |
| `session:connected` | `{ sessionId, device, message }` | Dispositivo conectado     |
| `session:error`     | `{ sessionId, error, message }`  | Erro na conexão           |

## 🚀 Como Usar

### Pré-requisitos

1. Backend rodando na porta configurada (padrão: 4444)
2. Frontend rodando na porta configurada (padrão: 3333)
3. Banco de dados PostgreSQL configurado
4. Variáveis de ambiente configuradas

### Variáveis de Ambiente

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://..."

# Server
PORT=4444
NODE_ENV=development

# Security
JWT_SECRET="seu-secret-jwt"
CORS_ORIGIN="http://localhost:3333"

# Baileys
SESSION_PATH="./sessions"
BAILEYS_BROWSER_NAME="Chrome"
BAILEYS_BROWSER_VERSION="1.0.0"
```

#### Frontend (.env)

```env
NEXT_PUBLIC_API_URL="http://localhost:4444/api"
```

### Passo a Passo

1. **Inicie o Backend**

   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Inicie o Frontend**

   ```bash
   cd apps/frontend
   npm run dev
   ```

3. **Acesse a Aplicação**
   - Faça login com uma conta que tenha role DEVELOPER
   - Navegue até "Dispositivos" no menu lateral
   - Clique em "Nova Conexão" ou "Conectar WhatsApp"
   - Escaneie o QR code com seu WhatsApp
   - Aguarde a confirmação de conexão

4. **Gerenciar Conexão**
   - Visualize informações do dispositivo conectado
   - Use "Atualizar Status" para verificar conexão
   - Use "Desconectar" para encerrar a sessão

## 🔧 Troubleshooting

### QR Code não aparece

- Verifique se o backend está rodando
- Verifique a conexão WebSocket no console do navegador
- Verifique se o usuário tem role DEVELOPER ou HIGH_LEVEL_ADMIN

### Conexão não estabelece após escanear QR

- Verifique logs do backend
- Verifique se a pasta de sessões tem permissões corretas
- Verifique se não há firewall bloqueando

### Socket.IO não conecta

- Verifique variável `NEXT_PUBLIC_API_URL`
- Verifique CORS no backend
- Verifique token JWT no localStorage

## 📝 Arquivos Criados/Modificados

### Backend

- ✨ **Novo**: `src/domain/entities/QrCodeTry.ts`
- ✨ **Novo**: `src/domain/interfaces/repositories/IQrCodeTryRepository.ts`
- ✨ **Novo**: `src/infrastructure/repositories/QrCodeTryRepository.ts`
- ✨ **Novo**: `src/application/use-cases/RegisterQrCodeTryUseCase.ts`
- ✨ **Novo**: `src/presentation/controllers/SessionSocketController.ts`
- 📝 **Modificado**: `src/infrastructure/services/BaileysSocketService.ts`
- 📝 **Modificado**: `src/index.ts`

### Frontend

- ✨ **Novo**: `src/hooks/useWhatsAppConnection.tsx`
- 📝 **Modificado**: `src/app/dashboard/whatsapp/page.tsx`

## 🎨 Interface

### Estados da Interface

1. **Sem Permissão**
   - Card vermelho com mensagem de acesso restrito

2. **Desconectado**
   - Botão "Nova Conexão" visível
   - Ícone de desconectado
   - Stats mostrando "Desconectado"

3. **Conectando (aguardando QR)**
   - QR code exibido no centro
   - Loader animado
   - Mensagem "Aguardando leitura do QR code..."

4. **Conectado**
   - Ícone de sucesso (checkmark verde)
   - Informações do dispositivo
   - Botões "Atualizar Status" e "Desconectar"

5. **Erro**
   - Card vermelho com mensagem de erro
   - Opção de tentar novamente

## 🔒 Segurança

- ✅ Autenticação JWT em todas as rotas
- ✅ Validação de roles (RBAC)
- ✅ Registro de tentativas com IP e userId
- ✅ WebSocket autenticado
- ✅ Validações no backend
- ✅ CORS configurado
- ✅ Rate limiting (a ser implementado se necessário)

## 📈 Melhorias Futuras

- [ ] Rate limiting para tentativas de QR code
- [ ] Notificações push quando QR expira
- [ ] Histórico de conexões
- [ ] Múltiplas sessões simultâneas
- [ ] Reconexão automática em caso de queda
- [ ] Métricas e analytics
- [ ] Logs estruturados
- [ ] Testes unitários e de integração

## 🐛 Bugs Conhecidos

Nenhum bug conhecido no momento.

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do backend
2. Verifique o console do navegador
3. Consulte a documentação do Baileys
4. Entre em contato com o time de desenvolvimento

---

**Versão**: 1.0.0  
**Data**: 23 de Outubro de 2025  
**Desenvolvido por**: AI Assistant
