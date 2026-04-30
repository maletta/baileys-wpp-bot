'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  RefreshCw,
  Download,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

export default function QRCodePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <QRCodeContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function QRCodeContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasQRCode, setHasQRCode] = useState(false);

  const handleGenerateQR = () => {
    setIsGenerating(true);
    // Simular geração de QR Code
    setTimeout(() => {
      setIsGenerating(false);
      setHasQRCode(true);
    }, 2000);
  };

  const handleRefreshQR = () => {
    setHasQRCode(false);
    handleGenerateQR();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">QR Code Scanner</h2>
        <p className="text-muted-foreground mt-1">
          Gere e escaneie QR Codes para conectar ao WhatsApp
        </p>
      </div>

      {/* Main QR Code Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conexão via QR Code</CardTitle>
            <CardDescription>
              Use o código abaixo para conectar seu WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code Display */}
              <div className="w-full max-w-md aspect-square flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-border p-8">
                {isGenerating ? (
                  <div className="flex flex-col items-center space-y-4">
                    <RefreshCw className="h-16 w-16 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Gerando QR Code...
                    </p>
                  </div>
                ) : hasQRCode ? (
                  <div className="flex flex-col items-center space-y-4 w-full">
                    <QrCode className="h-64 w-64 text-foreground" />
                    <p className="text-sm text-center text-muted-foreground">
                      Escaneie este código com seu WhatsApp
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <QrCode className="h-32 w-32 text-muted-foreground" />
                    <p className="text-sm text-center text-muted-foreground">
                      Clique em "Gerar QR Code" para começar
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full max-w-md">
                {!hasQRCode ? (
                  <Button
                    onClick={handleGenerateQR}
                    disabled={isGenerating}
                    className="flex-1 gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Gerar QR Code
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleRefreshQR}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Atualizar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                  </>
                )}
              </div>

              {/* Timer */}
              {hasQRCode && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    QR Code expira em: <span className="font-medium text-foreground">02:45</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como conectar</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm">Abra o WhatsApp no seu celular</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm">Vá em Configurações {'->'} Aparelhos conectados</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm">Toque em "Conectar um aparelho"</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm">Aponte para o QR Code na tela</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status da Conexão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">WhatsApp Web</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-sm font-medium">Desconectado</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Servidor</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <CardTitle className="text-lg">Importante</CardTitle>
                  <CardDescription className="mt-2">
                    Mantenha seu celular conectado à internet durante o processo de autenticação.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Smartphone className="h-5 w-5 text-primary mr-2" />
            <CardTitle className="text-base">Multi-dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conecte até 4 dispositivos simultaneamente ao seu WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <QrCode className="h-5 w-5 text-primary mr-2" />
            <CardTitle className="text-base">QR Code Temporário</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por segurança, o QR Code expira após 3 minutos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <RefreshCw className="h-5 w-5 text-primary mr-2" />
            <CardTitle className="text-base">Reconexão Automática</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sistema reconecta automaticamente em caso de falhas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

