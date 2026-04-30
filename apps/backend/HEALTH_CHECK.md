# Health Check Endpoints 🏥

Sistema completo de verificação de saúde dos serviços do backend.

## Endpoints Disponíveis

### 1. Health Check Completo

```
GET /health
```

**Descrição:** Verifica o status de todos os serviços (PostgreSQL, MongoDB, WhatsApp).

**Response 200 (Healthy):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-11T12:00:00.000Z",
    "uptime": 3600,
    "services": {
      "postgres": {
        "status": "up",
        "message": "Conectado ao PostgreSQL"
      },
      "mongodb": {
        "status": "up",
        "message": "Conectado ao MongoDB",
        "details": {
          "host": "localhost",
          "name": "whatsapp_messages"
        }
      },
      "whatsapp": {
        "status": "up",
        "message": "WhatsApp conectado",
        "details": {
          "sessionId": "uuid-here",
          "device": "Chrome"
        }
      }
    },
    "version": "7.0.0-rc.6",
    "environment": "development"
  }
}
```

**Response 503 (Degraded/Unhealthy):**

```json
{
  "success": false,
  "data": {
    "status": "degraded",
    "timestamp": "2025-10-11T12:00:00.000Z",
    "uptime": 3600,
    "services": {
      "postgres": {
        "status": "up",
        "message": "Conectado ao PostgreSQL"
      },
      "mongodb": {
        "status": "not_configured",
        "message": "MongoDB não configurado"
      },
      "whatsapp": {
        "status": "down",
        "message": "WhatsApp não conectado"
      }
    },
    "version": "7.0.0-rc.6",
    "environment": "development"
  }
}
```

---

### 2. Liveness Probe

```
GET /health/liveness
```

**Descrição:** Verifica se o servidor está vivo (usado pelo Kubernetes/Docker).

**Response 200:**

```json
{
  "success": true,
  "status": "alive",
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

**Uso:** Container deve ser reiniciado se este endpoint retornar erro.

---

### 3. Readiness Probe

```
GET /health/readiness
```

**Descrição:** Verifica se o servidor está pronto para receber tráfego.

**Response 200 (Ready):**

```json
{
  "success": true,
  "status": "ready",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "services": {
    "postgres": { "status": "up" },
    "mongodb": { "status": "up" },
    "whatsapp": { "status": "up" }
  }
}
```

**Response 503 (Not Ready):**

```json
{
  "success": false,
  "status": "not_ready",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "services": {
    "postgres": { "status": "down" },
    "mongodb": { "status": "down" },
    "whatsapp": { "status": "down" }
  }
}
```

**Uso:** Load balancer NÃO deve enviar tráfego se este endpoint retornar erro.

---

## Status dos Serviços

### Postgres

- `up` - Conectado e funcionando
- `down` - Erro de conexão

### MongoDB

- `up` - Conectado e funcionando
- `down` - Erro de conexão
- `not_configured` - Variável `MONGODB_URL` não definida

### WhatsApp

- `up` - Sessão conectada ao WhatsApp
- `down` - Sessão não conectada

---

## Status Geral

| Status      | Descrição                                   |
| ----------- | ------------------------------------------- |
| `healthy`   | Todos os serviços essenciais funcionando    |
| `degraded`  | Um ou mais serviços com problemas           |
| `unhealthy` | Sistema não conseguiu realizar health check |

---

## Exemplos de Uso

### cURL

```bash
# Health check completo
curl http://localhost:3001/health

# Liveness
curl http://localhost:3001/health/liveness

# Readiness
curl http://localhost:3001/health/readiness
```

### Docker Compose

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health/liveness"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Kubernetes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: whatsapp-backend
spec:
  containers:
    - name: app
      image: whatsapp-backend:latest
      livenessProbe:
        httpGet:
          path: /health/liveness
          port: 3001
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /health/readiness
          port: 3001
        initialDelaySeconds: 15
        periodSeconds: 5
```

---

## Arquitetura

O sistema segue **Clean Architecture**:

```
presentation/routes/healthRoutes.ts
  └─> presentation/controllers/HealthController.ts
      └─> application/use-cases/HealthCheckUseCase.ts
          ├─> infrastructure (PrismaClient)
          ├─> infrastructure (MongoDB)
          └─> infrastructure (BaileysSocketService)
```

---

## Monitoramento

### Métricas Recomendadas

1. **Uptime:** Tempo desde o último reinício
2. **Response Time:** Latência do health check
3. **Service Status:** Status individual de cada serviço
4. **Error Rate:** Taxa de erros no health check

### Alertas Sugeridos

- ⚠️ **Warning:** Status `degraded` por > 5 minutos
- 🚨 **Critical:** Status `unhealthy` ou endpoint não respondendo
- 📊 **Info:** Serviço individual em `down` (MongoDB, WhatsApp)
