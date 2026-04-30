'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Power,
  Wifi,
  WifiOff,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '@/types/api';

export default function WhatsAppPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <WhatsAppContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function WhatsAppContent() {
  const { user } = useAuth();
  const {
    isConnected,
    isConnecting,
    qrCode,
    deviceInfo,
    error,
    requestQrCode,
    disconnect,
    checkStatus
  } = useWhatsAppConnection();

  // Verificar se usuário é desenvolvedor
  const isDeveloper = user?.role === UserRole.DEVELOPER || user?.role === UserRole.HIGH_LEVEL_ADMIN;

  // Verificar status ao carregar
  useEffect(() => {
    if (isDeveloper) {
      checkStatus();
    }
  }, [isDeveloper, checkStatus]);

  const getStatusColor = (connected: boolean, connecting: boolean) => {
    if (connected) return 'text-green-600 bg-green-50 border-green-200';
    if (connecting) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (connected: boolean, connecting: boolean) => {
    if (connected) return <CheckCircle2 className="h-4 w-4" />;
    if (connecting) return <Loader2 className="h-4 w-4 animate-spin" />;
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusLabel = (connected: boolean, connecting: boolean) => {
    if (connected) return 'Conectado';
    if (connecting) return 'Conectando';
    return 'Desconectado';
  };

  // Se não for desenvolvedor, mostrar mensagem de permissão negada
  if (!isDeveloper) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Conexões WhatsApp</h2>
            <p className="text-muted-foreground mt-1">
              Gerencie suas conexões com o WhatsApp Web
            </p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Acesso Restrito</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              Apenas usuários com a role de <strong>Desenvolvedor</strong> podem acessar esta funcionalidade.
            </p>
            <p className="text-red-600 text-sm mt-2">
              Entre em contato com um administrador para solicitar permissão.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conexões WhatsApp</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie sua conexão com o WhatsApp Web via Baileys
          </p>
        </div>
        {!isConnected && !isConnecting && (
          <Button
            className="gap-2"
            onClick={requestQrCode}
            disabled={isConnecting}
          >
            <Zap className="h-4 w-4" />
            Nova Conexão
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {!isConnected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status da Conexão
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isConnecting ? 'Aguardando conexão...' : 'Status atual'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dispositivo
            </CardTitle>
            <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {deviceInfo?.name || 'Nenhum'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {deviceInfo?.id ? `ID: ${deviceInfo.id.substring(0, 20)}...` : 'Não conectado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plataforma
            </CardTitle>
            <Power className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deviceInfo?.platform || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baileys API
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/50">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">WhatsApp Baileys</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Smartphone className="h-3 w-3" />
                Conexão via API Baileys
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`gap-1 ${getStatusColor(isConnected, isConnecting)}`}
            >
              {getStatusIcon(isConnected, isConnecting)}
              {getStatusLabel(isConnected, isConnecting)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isConnecting && qrCode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode}
                  alt="QR Code para conectar WhatsApp"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Escaneie o QR Code com seu WhatsApp
              </p>
              <div className="flex items-center justify-center gap-2 text-yellow-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Aguardando leitura do QR code...</span>
              </div>
            </div>
          ) : isConnected && deviceInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8 bg-green-50 rounded-lg border-2 border-green-200">
                <CheckCircle2 className="h-32 w-32 text-green-600" />
              </div>
              <p className="text-sm text-center font-medium text-green-700">
                Dispositivo conectado com sucesso!
              </p>
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nome do dispositivo</span>
                  <span className="font-medium">{deviceInfo.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plataforma</span>
                  <span className="font-medium">{deviceInfo.platform}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ID do dispositivo</span>
                  <span className="font-medium text-xs truncate max-w-xs">
                    {deviceInfo.id}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
                <WifiOff className="h-32 w-32 text-gray-400" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Nenhum dispositivo conectado
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Clique em "Nova Conexão" para gerar um QR code
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={checkStatus}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={disconnect}
                >
                  <Power className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={requestQrCode}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Conectar WhatsApp
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Como conectar</CardTitle>
          <CardDescription>
            Siga os passos abaixo para conectar uma nova instância do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-sm">Clique no botão "Nova Conexão" acima</li>
            <li className="text-sm">Aguarde o QR Code ser gerado</li>
            <li className="text-sm">Abra o WhatsApp no seu celular</li>
            <li className="text-sm">Vá em Configurações {'>'} Aparelhos conectados</li>
            <li className="text-sm">Toque em "Conectar um aparelho"</li>
            <li className="text-sm">Escaneie o QR Code exibido na tela</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

