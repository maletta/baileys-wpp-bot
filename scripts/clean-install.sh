#!/bin/bash

# Script para limpeza e reinstalação das dependências
# Este script resolve problemas de versões conflitantes

echo "🧹 Limpando cache e dependências..."

# Limpar cache do npm
npm cache clean --force

# Remover node_modules e lock files do root
rm -rf node_modules package-lock.json

# Remover node_modules e lock files do backend
cd apps/backend
rm -rf node_modules package-lock.json
cd ../..

# Remover node_modules e lock files do frontend
cd apps/frontend
rm -rf node_modules package-lock.json
cd ../..

echo "📦 Reinstalando dependências..."

# Instalar dependências do root
npm install

# Instalar dependências específicas dos workspaces
npm install --workspace=apps/backend
npm install --workspace=apps/frontend

echo "✅ Instalação concluída!"

# Verificar se tudo está funcionando
echo "🔍 Verificando instalação..."
npm run type-check

echo "🎉 Processo de limpeza e reinstalação finalizado!"
