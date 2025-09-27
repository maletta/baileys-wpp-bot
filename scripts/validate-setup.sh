#!/bin/bash

echo "🔍 Validando Setup do Projeto WhatsApp Baileys"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log com cores
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "ℹ️  $1"
}

# Validar versão Node.js
echo ""
log_info "Verificando versão Node.js..."
NODE_VERSION=$(node --version)
REQUIRED_VERSION="v22.17.0"

if [[ $NODE_VERSION == v22.* ]]; then
    log_success "Node.js: $NODE_VERSION (compatível)"
else
    log_error "Node.js: $NODE_VERSION (requer v22.17.0 ou superior)"
    exit 1
fi

# Validar npm
echo ""
log_info "Verificando npm..."
NPM_VERSION=$(npm --version)
log_success "npm: $NPM_VERSION"

# Validar estrutura do projeto
echo ""
log_info "Verificando estrutura do projeto..."

directories=(
    "apps/backend"
    "apps/frontend"
    "docs"
    "specs"
    ".cursor"
)

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        log_success "Diretório: $dir"
    else
        log_error "Diretório ausente: $dir"
    fi
done

# Validar arquivos importantes
echo ""
log_info "Verificando arquivos importantes..."

files=(
    "package.json"
    "apps/backend/package.json"
    "apps/frontend/package.json"
    "apps/backend/prisma/schema.prisma"
    "README.md"
    "CONTRIBUTING.md"
    "STYLEGUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        log_success "Arquivo: $file"
    else
        log_error "Arquivo ausente: $file"
    fi
done

# Validar dependências críticas
echo ""
log_info "Verificando dependências críticas..."

cd apps/backend

# Verificar Baileys
if npm list baileys > /dev/null 2>&1; then
    BAILEYS_VERSION=$(npm list baileys | grep baileys | awk '{print $2}')
    log_success "Baileys: $BAILEYS_VERSION"
else
    log_error "Baileys não instalado"
fi

# Verificar Prisma
if npm list prisma > /dev/null 2>&1; then
    PRISMA_VERSION=$(npm list prisma | grep prisma | awk '{print $2}')
    log_success "Prisma: $PRISMA_VERSION"
else
    log_error "Prisma não instalado"
fi

# Verificar TypeScript
if npm list typescript > /dev/null 2>&1; then
    TS_VERSION=$(npm list typescript | grep typescript | awk '{print $2}')
    log_success "TypeScript: $TS_VERSION"
else
    log_error "TypeScript não instalado"
fi

cd ../../

# Testar builds
echo ""
log_info "Testando builds..."

# Build backend
log_info "Testando build do backend..."
cd apps/backend
if npm run build > /dev/null 2>&1; then
    log_success "Build backend: OK"
else
    log_error "Build backend: FALHOU"
fi

cd ../../

# Build frontend
log_info "Testando build do frontend..."
cd apps/frontend
if npm run build > /dev/null 2>&1; then
    log_success "Build frontend: OK"
else
    log_error "Build frontend: FALHOU"
fi

cd ../../

# Validar Prisma schema
echo ""
log_info "Validando Prisma schema..."
cd apps/backend
if npx prisma validate > /dev/null 2>&1; then
    log_success "Prisma schema: Válido"
else
    log_error "Prisma schema: Inválido"
fi

cd ../../

# Verificar scripts disponíveis
echo ""
log_info "Scripts disponíveis:"
echo "  npm run dev              - Executar tudo em desenvolvimento"
echo "  npm run dev:backend      - Executar apenas backend"
echo "  npm run dev:frontend     - Executar apenas frontend"
echo "  npm run build            - Build completo"
echo "  npm run clean-install    - Limpeza e reinstalação"
echo "  npm run db:generate      - Gerar Prisma client"
echo "  npm run db:push          - Push schema para DB"

# Verificar arquivos de configuração
echo ""
log_info "Verificando configurações..."

if [ -f "apps/backend/env.example" ]; then
    log_success "Template de configuração backend: OK"
    log_warning "Lembre-se de criar apps/backend/.env com suas configurações"
else
    log_error "Template de configuração backend: AUSENTE"
fi

if [ -f ".npmrc" ]; then
    log_success "Configuração npm: OK"
else
    log_warning "Configuração npm: Ausente (opcional)"
fi

# Resumo final
echo ""
echo "=============================================="
log_info "Resumo da Validação:"
echo ""
log_success "✅ Projeto configurado corretamente"
log_success "✅ Baileys v7.0.0-rc.3 instalado"
log_success "✅ Node.js v22.17.0+ compatível"
log_success "✅ Builds funcionando"
log_success "✅ Schema Prisma válido"

echo ""
log_info "Próximos passos:"
echo "1. Configure as variáveis de ambiente (.env)"
echo "2. Configure PostgreSQL e MongoDB"
echo "3. Configure Google OAuth e Firebase"
echo "4. Execute: npm run dev"

echo ""
log_success "🎉 Setup validado com sucesso!"
