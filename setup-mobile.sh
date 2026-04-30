#!/bin/bash

# Script para configurar acesso mobile via ADB
# Autor: Sistema de desenvolvimento WhatsApp Baileys
# Uso: ./setup-mobile.sh [comando]

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

FRONTEND_PORT=3333
BACKEND_PORT=4444

# Funções auxiliares
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_adb() {
    if ! command -v adb &> /dev/null; then
        print_error "ADB não encontrado. Instale o Android SDK Platform Tools."
        exit 1
    fi
}

check_device() {
    if ! adb devices | grep -q "device$"; then
        print_error "Nenhum dispositivo conectado."
        echo "Execute:"
        echo "  1. Conecte o celular via USB"
        echo "  2. Ative 'Depuração USB' no celular"
        echo "  3. Autorize o computador no celular"
        echo "  4. Execute: adb devices"
        exit 1
    fi
}

setup_reverse() {
    print_header "Configurando ADB Reverse"
    
    check_adb
    check_device
    
    echo "Mapeando portas..."
    
    # Frontend
    if adb reverse tcp:${FRONTEND_PORT} tcp:${FRONTEND_PORT}; then
        print_success "Frontend mapeado: tcp:${FRONTEND_PORT} -> tcp:${FRONTEND_PORT}"
    else
        print_error "Falha ao mapear porta ${FRONTEND_PORT}"
        exit 1
    fi
    
    # Backend
    if adb reverse tcp:${BACKEND_PORT} tcp:${BACKEND_PORT}; then
        print_success "Backend mapeado: tcp:${BACKEND_PORT} -> tcp:${BACKEND_PORT}"
    else
        print_error "Falha ao mapear porta ${BACKEND_PORT}"
        exit 1
    fi
    
    echo ""
    print_success "ADB Reverse configurado com sucesso!"
}

check_status() {
    print_header "Status do ADB Reverse"
    
    check_adb
    
    echo "Dispositivos conectados:"
    adb devices
    echo ""
    
    echo "Mapeamentos ativos:"
    if adb reverse --list 2>/dev/null | grep -q "tcp:"; then
        adb reverse --list
        echo ""
        print_success "Mapeamentos configurados"
    else
        print_warning "Nenhum mapeamento ativo"
        echo "Execute: ./setup-mobile.sh setup"
    fi
}

clean_reverse() {
    print_header "Limpando ADB Reverse"
    
    check_adb
    
    if adb reverse --remove-all 2>/dev/null; then
        print_success "Todos os mapeamentos removidos"
    else
        print_warning "Nenhum mapeamento para remover"
    fi
}

test_connection() {
    print_header "Testando Conexões"
    
    check_adb
    check_device
    
    echo "Testando backend no celular..."
    if adb shell "curl -s -o /dev/null -w '%{http_code}' http://localhost:${BACKEND_PORT}/health" | grep -q "200\|503"; then
        print_success "Backend acessível: http://localhost:${BACKEND_PORT}/health"
    else
        print_error "Backend não acessível"
        echo "Verifique se o backend está rodando: npm run dev (no diretório apps/backend)"
    fi
    
    echo ""
    echo "Testando frontend no celular..."
    if adb shell "curl -s -o /dev/null -w '%{http_code}' http://localhost:${FRONTEND_PORT}" | grep -q "200\|301\|302"; then
        print_success "Frontend acessível: http://localhost:${FRONTEND_PORT}"
    else
        print_error "Frontend não acessível"
        echo "Verifique se o frontend está rodando: npm run dev (no diretório apps/frontend)"
    fi
}

check_env() {
    print_header "Verificando Variáveis de Ambiente"
    
    echo "Backend (.env):"
    if [ -f "apps/backend/.env" ]; then
        PORT=$(grep "PORT=" apps/backend/.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        if [ "$PORT" = "$BACKEND_PORT" ]; then
            print_success "PORT=$PORT (correto)"
        else
            print_warning "PORT=$PORT (esperado: $BACKEND_PORT)"
        fi
    else
        print_error "apps/backend/.env não encontrado"
    fi
    
    echo ""
    echo "Frontend (.env.local):"
    if [ -f "apps/frontend/.env.local" ]; then
        API_URL=$(grep "NEXT_PUBLIC_API_URL=" apps/frontend/.env.local | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        if echo "$API_URL" | grep -q ":${BACKEND_PORT}"; then
            print_success "NEXT_PUBLIC_API_URL=$API_URL (correto)"
        else
            print_warning "NEXT_PUBLIC_API_URL=$API_URL"
            print_warning "Esperado: http://localhost:${BACKEND_PORT}/api"
        fi
    else
        print_warning "apps/frontend/.env.local não encontrado"
        echo "Crie o arquivo baseado em apps/frontend/env.example"
    fi
}

setup_wifi() {
    print_header "Configurando Conexão WiFi (Opcional)"
    
    check_adb
    check_device
    
    echo "Habilitando TCP/IP na porta 5555..."
    adb tcpip 5555
    
    echo ""
    print_success "TCP/IP habilitado!"
    echo ""
    echo "Próximos passos:"
    echo "1. Descubra o IP do celular:"
    echo "   Configurações > Sobre > Status > Endereço IP"
    echo ""
    echo "2. Desconecte o cabo USB"
    echo ""
    echo "3. Conecte via WiFi:"
    echo "   adb connect <IP_DO_CELULAR>:5555"
    echo ""
    echo "4. Reconfigure o reverse:"
    echo "   ./setup-mobile.sh reconnect"
}

show_help() {
    cat << EOF
📱 Setup Mobile - Configuração de Acesso Mobile via ADB

USO:
    ./setup-mobile.sh [comando]

COMANDOS:
    setup       - Configura ADB reverse (frontend + backend)
    reconnect   - Reconecta reverse (se perdeu conexão)
    status      - Mostra status das conexões
    test        - Testa acesso ao backend e frontend
    check-env   - Verifica variáveis de ambiente
    wifi        - Habilita conexão via WiFi (opcional)
    clean       - Remove todos os mapeamentos
    help        - Mostra esta ajuda

EXEMPLOS:
    # Setup inicial
    ./setup-mobile.sh setup

    # Verificar se está funcionando
    ./setup-mobile.sh test

    # Ver portas mapeadas
    ./setup-mobile.sh status

    # Limpar e reconfigurar
    ./setup-mobile.sh clean
    ./setup-mobile.sh setup

PORTAS:
    Frontend: ${FRONTEND_PORT}
    Backend:  ${BACKEND_PORT}

MAIS INFO:
    Leia: MOBILE_SETUP.md
EOF
}

# Main
case "${1:-help}" in
    setup)
        setup_reverse
        echo ""
        check_env
        echo ""
        echo "Para testar: ./setup-mobile.sh test"
        ;;
    reconnect)
        clean_reverse
        setup_reverse
        ;;
    status)
        check_status
        ;;
    test)
        test_connection
        ;;
    check-env)
        check_env
        ;;
    wifi)
        setup_wifi
        ;;
    clean)
        clean_reverse
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando desconhecido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

