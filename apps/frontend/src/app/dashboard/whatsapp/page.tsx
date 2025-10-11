'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Power,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';

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
  // Mock data - substituir com dados reais da API
  const connections = [
    {
      id: '1',
      name: 'WhatsApp Principal',
      phone: '+55 11 98765-4321',
      status: 'connected',
      lastSeen: '2 minutos atrás',
      qrCode: null,
    },
    {
      id: '2',
      name: 'WhatsApp Vendas',
      phone: '+55 11 91234-5678',
      status: 'connecting',
      lastSeen: 'Conectando...',
      qrCode: 'mock-qr-code',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-success bg-success-light border-success';
      case 'connecting':
        return 'text-warning bg-warning-light border-warning';
      case 'disconnected':
        return 'text-destructive bg-destructive/10 border-destructive';
      default:
        return 'text-muted-foreground bg-muted border-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conexões WhatsApp</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie suas conexões com o WhatsApp Web
          </p>
        </div>
        <Button className="gap-2">
          <Zap className="h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Conexões
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {connections.filter(c => c.status === 'connected').length} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Geral
            </CardTitle>
            <Wifi className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Estável</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as conexões operando normalmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uptime
            </CardTitle>
            <Power className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connections List */}
      <div className="grid gap-4 md:grid-cols-2">
        {connections.map((connection) => (
          <Card key={connection.id} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{connection.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3" />
                    {connection.phone}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={`gap-1 ${getStatusColor(connection.status)}`}
                >
                  {getStatusIcon(connection.status)}
                  {getStatusLabel(connection.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {connection.status === 'connecting' && connection.qrCode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed">
                    <QrCode className="h-32 w-32 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Escaneie o QR Code com seu WhatsApp
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Última atividade</span>
                    <span className="font-medium">{connection.lastSeen}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mensagens hoje</span>
                    <span className="font-medium">247</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Grupos ativos</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconectar
                </Button>
                <Button variant="destructive" size="sm" className="flex-1">
                  <Power className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

