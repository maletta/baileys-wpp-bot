#!/bin/bash

# Script para testar os endpoints de health check
# Uso: ./test-health.sh

BASE_URL="http://localhost:3001"

echo "🏥 Testando Health Check Endpoints"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para fazer requisição e mostrar resultado
test_endpoint() {
    local name=$1
    local endpoint=$2
    
    echo -e "${YELLOW}📡 Testando: $name${NC}"
    echo -e "   Endpoint: $endpoint"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "   ${GREEN}✅ Status: $http_code (OK)${NC}"
    else
        echo -e "   ${RED}⚠️  Status: $http_code${NC}"
    fi
    
    echo "   Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
}

# Testar todos os endpoints
test_endpoint "Health Check Completo" "/health"
test_endpoint "Liveness Probe" "/health/liveness"
test_endpoint "Readiness Probe" "/health/readiness"

echo "======================================"
echo "✨ Testes concluídos!"

