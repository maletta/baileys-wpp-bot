# Frontend: Auto-Retry após Erro 515

## 🎯 Problema

Após a correção do erro 515, o backend **corretamente** não tenta reconectar automaticamente. Ele limpa a sessão e aguarda que o frontend solicite um novo QR code.

### Comportamento Atual (Correto)

```
Backend: QR Code gerado
Backend: Erro 515 detectado
Backend: Sessão limpa
Backend: Emite evento "connection:failed" para o frontend
Backend: ⏸️ Aguarda nova solicitação
```

### O que o usuário vê

Se o frontend não reagir ao evento, o usuário vê:
1. QR code aparece
2. Após ~10 segundos, conexão falha
3. Nada acontece
4. Usuário precisa clicar manualmente para gerar novo QR code

---

## ✅ Solução: Implementar Auto-Retry no Frontend

### Opção 1: Retry Automático com Confirmação

```typescript
// No componente de conexão WhatsApp

socket.on('connection:failed', ({ sessionId, error }) => {
  console.log('Conexão falhou:', error);
  
  // Mostrar toast/mensagem
  showNotification({
    type: 'warning',
    message: 'Conexão falhou. Tentando novamente em 5 segundos...',
    error
  });
  
  // Tentar automaticamente após 5 segundos
  setTimeout(() => {
    console.log('Tentando gerar novo QR code automaticamente...');
    handleGenerateQRCode();
  }, 5000);
});
```

### Opção 2: Retry Automático Silencioso

```typescript
// Para desenvolvimento/testes - retry automático sem confirmação

let retryCount = 0;
const MAX_RETRIES = 3;

socket.on('connection:failed', ({ sessionId, error }) => {
  console.log(`Conexão falhou (tentativa ${retryCount + 1}/${MAX_RETRIES}):`, error);
  
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    
    showNotification({
      type: 'info',
      message: `Tentando novamente (${retryCount}/${MAX_RETRIES})...`
    });
    
    // Delay progressivo: 3s, 6s, 9s
    const delay = 3000 * retryCount;
    
    setTimeout(() => {
      console.log('Gerando novo QR code automaticamente...');
      handleGenerateQRCode();
    }, delay);
  } else {
    // Atingiu limite de retries
    retryCount = 0;
    showNotification({
      type: 'error',
      message: 'Falha ao conectar após múltiplas tentativas. Por favor, tente novamente mais tarde.',
      duration: 10000
    });
  }
});

// Resetar contador quando conectar com sucesso
socket.on('connection:established', () => {
  retryCount = 0;
});
```

### Opção 3: Retry com Escolha do Usuário

```typescript
// Perguntar ao usuário se quer tentar novamente

socket.on('connection:failed', ({ sessionId, error }) => {
  console.log('Conexão falhou:', error);
  
  // Usar modal/dialog de confirmação
  const shouldRetry = await showConfirmDialog({
    title: 'Conexão Falhou',
    message: 'Houve um problema ao conectar com o WhatsApp. Deseja tentar novamente?',
    error: error,
    confirmText: 'Sim, tentar novamente',
    cancelText: 'Não, cancelar',
    autoCloseSeconds: 10 // Auto-confirma após 10s
  });
  
  if (shouldRetry) {
    console.log('Usuário optou por tentar novamente');
    handleGenerateQRCode();
  } else {
    console.log('Usuário optou por cancelar');
    // Voltar para tela inicial ou mostrar mensagem
  }
});
```

### Opção 4: Retry Inteligente (Recomendado para Produção)

```typescript
// Combinação de retry automático + limite + feedback visual

interface RetryState {
  count: number;
  lastError: string;
  inProgress: boolean;
}

const retryState: RetryState = {
  count: 0,
  lastError: '',
  inProgress: false
};

const MAX_AUTO_RETRIES = 2; // Tenta 2 vezes automaticamente
const RETRY_DELAY = 4000; // 4 segundos

socket.on('connection:failed', async ({ sessionId, error }) => {
  console.log('Conexão falhou:', error);
  
  retryState.lastError = error;
  
  // Se já está em progresso, não fazer nada
  if (retryState.inProgress) {
    console.log('Retry já em progresso, ignorando...');
    return;
  }
  
  // Se ainda pode tentar automaticamente
  if (retryState.count < MAX_AUTO_RETRIES) {
    retryState.count++;
    retryState.inProgress = true;
    
    showNotification({
      type: 'warning',
      message: `Conexão falhou. Tentando novamente (${retryState.count}/${MAX_AUTO_RETRIES})...`,
      duration: RETRY_DELAY
    });
    
    // Aguardar e tentar novamente
    await sleep(RETRY_DELAY);
    
    console.log(`Auto-retry ${retryState.count}/${MAX_AUTO_RETRIES}...`);
    handleGenerateQRCode();
    
    retryState.inProgress = false;
    
  } else {
    // Atingiu limite, perguntar ao usuário
    retryState.inProgress = true;
    
    const shouldRetry = await showConfirmDialog({
      title: 'Conexão Continua Falhando',
      message: `Já tentamos ${MAX_AUTO_RETRIES} vezes sem sucesso.\n\nErro: ${error}\n\nDeseja tentar novamente?`,
      confirmText: 'Sim, tentar novamente',
      cancelText: 'Não, voltar'
    });
    
    if (shouldRetry) {
      retryState.count = 0; // Resetar contador
      handleGenerateQRCode();
    } else {
      // Voltar ou cancelar
      retryState.count = 0;
      onCancelConnection();
    }
    
    retryState.inProgress = false;
  }
});

// Resetar estado quando conectar com sucesso
socket.on('connection:established', () => {
  retryState.count = 0;
  retryState.lastError = '';
  retryState.inProgress = false;
  
  showNotification({
    type: 'success',
    message: 'WhatsApp conectado com sucesso!'
  });
});

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 🎨 UI/UX Recomendado

### Estados Visuais

1. **Gerando QR Code**
   ```
   ⏳ Gerando QR Code...
   ```

2. **QR Code Exibido**
   ```
   📱 Escaneie o QR Code com seu WhatsApp
   ```

3. **Erro de Conexão**
   ```
   ⚠️ Conexão falhou. Tentando novamente em 4 segundos...
   [Barra de progresso]
   [Botão: Cancelar]
   ```

4. **Retry Manual**
   ```
   ❌ Não foi possível conectar após múltiplas tentativas.
   [Botão: Tentar Novamente]
   [Botão: Ver Detalhes do Erro]
   ```

5. **Conectado**
   ```
   ✅ WhatsApp conectado com sucesso!
   ```

### Código UI Exemplo (React)

```typescript
function WhatsAppConnection() {
  const [connectionState, setConnectionState] = useState<'idle' | 'generating' | 'showing-qr' | 'retrying' | 'failed' | 'connected'>('idle');
  const [qrCode, setQrCode] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Evento: QR Code gerado
    socket.on('qr:generated', ({ qrCode }) => {
      setQrCode(qrCode);
      setConnectionState('showing-qr');
    });

    // Evento: Conexão falhou
    socket.on('connection:failed', ({ error }) => {
      setError(error);
      
      if (retryCount < MAX_AUTO_RETRIES) {
        setConnectionState('retrying');
        setRetryDelay(RETRY_DELAY / 1000);
        
        // Countdown
        const interval = setInterval(() => {
          setRetryDelay(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              handleGenerateQRCode();
              setRetryCount(prev => prev + 1);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setConnectionState('failed');
      }
    });

    // Evento: Conectado
    socket.on('connection:established', () => {
      setConnectionState('connected');
      setRetryCount(0);
    });

    return () => {
      socket.off('qr:generated');
      socket.off('connection:failed');
      socket.off('connection:established');
    };
  }, [retryCount]);

  const handleGenerateQRCode = () => {
    setConnectionState('generating');
    socket.emit('qr:generate');
  };

  return (
    <div className="connection-container">
      {connectionState === 'idle' && (
        <button onClick={handleGenerateQRCode}>
          Conectar WhatsApp
        </button>
      )}

      {connectionState === 'generating' && (
        <div className="loading">
          <Spinner />
          <p>Gerando QR Code...</p>
        </div>
      )}

      {connectionState === 'showing-qr' && (
        <div className="qr-code">
          <img src={qrCode} alt="QR Code" />
          <p>Escaneie com seu WhatsApp</p>
        </div>
      )}

      {connectionState === 'retrying' && (
        <div className="retrying">
          <WarningIcon />
          <p>Conexão falhou. Tentando novamente em {retryDelay}s...</p>
          <ProgressBar value={retryDelay} max={RETRY_DELAY / 1000} />
          <p className="error-text">{error}</p>
          <button onClick={() => {
            setConnectionState('idle');
            setRetryCount(0);
          }}>
            Cancelar
          </button>
        </div>
      )}

      {connectionState === 'failed' && (
        <div className="failed">
          <ErrorIcon />
          <h3>Não foi possível conectar</h3>
          <p>Tentamos {MAX_AUTO_RETRIES} vezes sem sucesso.</p>
          <details>
            <summary>Ver detalhes do erro</summary>
            <code>{error}</code>
          </details>
          <button onClick={() => {
            setRetryCount(0);
            handleGenerateQRCode();
          }}>
            Tentar Novamente
          </button>
          <button onClick={() => setConnectionState('idle')}>
            Voltar
          </button>
        </div>
      )}

      {connectionState === 'connected' && (
        <div className="connected">
          <CheckIcon />
          <p>WhatsApp conectado com sucesso!</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testes

### Testar Auto-Retry

1. **Conectar e deixar QR code expirar:**
   ```
   - Gerar QR code
   - Aguardar 30 segundos sem escanear
   - Observar erro 515
   - ✅ Frontend deve tentar automaticamente
   ```

2. **Falhas múltiplas:**
   ```
   - Gerar QR code
   - Deixar expirar 3 vezes
   - Na 3ª vez, deve pedir confirmação do usuário
   ```

3. **Cancelar retry:**
   ```
   - Gerar QR code
   - Deixar expirar
   - Durante countdown, clicar em "Cancelar"
   - ✅ Deve voltar ao estado inicial
   ```

---

## 📝 Resumo

### Por que o backend não reconecta automaticamente?

✅ **Comportamento correto:** O erro 515 indica que a sessão está corrompida e precisa ser completamente limpa. Tentar reconectar com a mesma sessão resulta em erro 401.

### O que fazer no frontend?

✅ **Implementar auto-retry:** O frontend deve detectar `connection:failed` e solicitar novo QR code automaticamente (com limite de tentativas).

### Qual opção escolher?

- **Desenvolvimento:** Opção 2 (retry silencioso)
- **Produção:** Opção 4 (retry inteligente) ⭐ **RECOMENDADO**
- **Simples:** Opção 1 (retry com notificação)

---

## 🔗 Eventos do Socket.IO

### Backend → Frontend

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `qr:generated` | `{ qrCode, sessionId }` | QR code gerado |
| `connection:established` | `{ sessionId, deviceInfo }` | Conectado com sucesso |
| `connection:failed` | `{ sessionId, error }` | Conexão falhou (erro 515, 401, etc) |

### Frontend → Backend

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `qr:generate` | `{ }` | Solicitar novo QR code |

---

**Importante:** A correção do erro 515 no backend está correta. Agora é necessário adaptar o frontend para reagir automaticamente ao evento `connection:failed`.

