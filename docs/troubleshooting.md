# Guia de Troubleshooting

## Problemas de Instalação

### Erro: "No matching version found for google-auth-library"

Este erro ocorre quando uma versão específica de uma dependência não está disponível no registry do npm.

**Causa**: Versão especificada não existe ou foi removida do npm registry.

**Solução**:

1. **Limpeza Completa**:

```bash
npm run clean-install
```

2. **Verificar Versões Disponíveis**:

```bash
npm view google-auth-library versions --json
```

3. **Instalação Manual com Versão Específica**:

```bash
cd apps/backend
npm install google-auth-library@^9.15.0
```

4. **Se o problema persistir, usar versão LTS**:

```bash
npm install google-auth-library@^9.0.0
```

### Conflitos de Dependências

**Sintomas**:

- Erros de peer dependencies
- Versões incompatíveis
- Falhas na instalação

**Solução Passo a Passo**:

1. **Limpeza Total**:

```bash
# Remover cache e dependências
npm cache clean --force
rm -rf node_modules package-lock.json
rm -rf apps/backend/node_modules apps/backend/package-lock.json
rm -rf apps/frontend/node_modules apps/frontend/package-lock.json
```

2. **Verificar Versões Node.js**:

```bash
node --version  # Deve ser v22.20.0 LTS+
npm --version   # Deve ser 10.9.0+
```

3. **Reinstalação Limpa**:

```bash
npm install
```

4. **Se o problema persistir, instalar com legacy peer deps**:

```bash
npm install --legacy-peer-deps
```

## Problemas de Build

### TypeScript Errors

**Erro**: `Cannot find module 'baileys'`

**Solução**:

```bash
cd apps/backend
npm install baileys@^7.0.0-rc.3
npm run build
```

### Prisma Client Errors

**Erro**: `PrismaClient is unable to run in this browser environment`

**Solução**:

```bash
npm run db:generate
npm run db:push
```

## Problemas de Conexão Baileys

### QR Code não aparece

**Possíveis Causas**:

- Versão incompatível do Baileys
- Configuração incorreta da versão WhatsApp
- Problemas de rede

**Solução**:

1. **Verificar Configuração**:

```typescript
// Em BaileysSocketService.ts
const socket = makeWASocket({
  version: [2, 2429, 4], // Versão específica
  // ... outras configurações
});
```

2. **Logs Detalhados**:

```typescript
logger.level = "debug";
```

3. **Testar Conexão Básica**:

```bash
npm run dev:backend
# Verificar logs para erros de conexão
```

### Erro: "Connection timeout"

**Solução**:

```typescript
// Aumentar timeouts
const socket = makeWASocket({
  defaultQueryTimeoutMs: 60000,
  qrTimeout: 40000,
  // ...
});
```

## Problemas de Banco de Dados

### PostgreSQL Connection Error

**Erro**: `database "whatsapp_baileys_db" does not exist`

**Solução**:

```bash
# Criar banco de dados
createdb whatsapp_baileys_db

# Ou via psql
psql -c "CREATE DATABASE whatsapp_baileys_db;"

# Executar migrations
npm run db:push
```

### MongoDB Connection Error

**Solução**:

```bash
# Verificar se MongoDB está rodando
systemctl status mongod

# Ou iniciar MongoDB
systemctl start mongod
```

## Problemas de Ambiente

### Variáveis de Ambiente Não Carregadas

**Verificação**:

```bash
# Verificar se arquivos .env existem
ls apps/backend/.env
ls apps/frontend/.env.local
```

**Solução**:

```bash
# Copiar arquivos de exemplo
cp apps/backend/env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# Editar com suas configurações
nano apps/backend/.env
```

### Problemas de Permissão

**Erro**: `EACCES: permission denied`

**Solução**:

```bash
# Corrigir permissões do npm
sudo chown -R $(whoami) ~/.npm

# Ou usar npx para comandos específicos
npx prisma generate
```

## Scripts de Diagnóstico

### Verificação Completa do Sistema

Crie um script para verificar todo o ambiente:

```bash
#!/bin/bash
echo "=== Diagnóstico do Sistema ==="

echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

echo "=== Verificando Dependências ==="
cd apps/backend
npm list baileys
npm list prisma

echo "=== Verificando Banco de Dados ==="
psql -c "SELECT version();" > /dev/null 2>&1 && echo "PostgreSQL: OK" || echo "PostgreSQL: ERRO"

echo "=== Verificando Arquivos de Configuração ==="
[ -f .env ] && echo ".env: OK" || echo ".env: NÃO ENCONTRADO"

echo "=== Build Test ==="
npm run build > /dev/null 2>&1 && echo "Build: OK" || echo "Build: ERRO"
```

### Health Check API

Adicione um endpoint de health check:

```typescript
// Em seu app.ts
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    node: process.version,
    uptime: process.uptime(),
    dependencies: {
      baileys: "7.0.0-rc.3",
      prisma: require("@prisma/client/package.json").version,
    },
  });
});
```

## Contato para Suporte

Se o problema persistir:

1. Verificar [Issues do Baileys](https://github.com/WhiskeySockets/Baileys/issues)
2. Consultar documentação do [Prisma](https://www.prisma.io/docs/)
3. Abrir issue no repositório do projeto com:
   - Versão do Node.js
   - Sistema operacional
   - Logs de erro completos
   - Passos para reproduzir o problema
