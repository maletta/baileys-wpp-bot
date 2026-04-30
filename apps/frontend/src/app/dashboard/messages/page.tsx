'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCheck,
  AlertCircle,
  Filter,
  FileText
} from 'lucide-react';

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <MessagesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function MessagesContent() {
  // Mock data
  const messages = [
    {
      id: '1',
      content: 'Olá! Gostaríamos de informar sobre nossa promoção...',
      recipient: 'Grupo Marketing Digital',
      status: 'delivered',
      timestamp: '2024-01-15 10:30',
      sender: 'Sistema',
    },
    {
      id: '2',
      content: 'Lembrete: Reunião agendada para amanhã às 14h',
      recipient: 'Grupo Vendas - Time A',
      status: 'sent',
      timestamp: '2024-01-15 09:15',
      sender: 'Admin',
    },
    {
      id: '3',
      content: 'Nova atualização do sistema disponível',
      recipient: 'Grupo Suporte Técnico',
      status: 'pending',
      timestamp: '2024-01-15 08:45',
      sender: 'Bot',
    },
    {
      id: '4',
      content: 'Feliz aniversário! 🎉',
      recipient: '+55 11 98765-4321',
      status: 'delivered',
      timestamp: '2024-01-14 12:00',
      sender: 'Sistema',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCheck className="h-4 w-4 text-success" />;
      case 'sent':
        return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Entregue';
      case 'sent':
        return 'Enviada';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mensagens Anônimas</h2>
          <p className="text-muted-foreground mt-1">
            Envie e gerencie mensagens para grupos e contatos
          </p>
        </div>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          Nova Mensagem
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enviadas
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground mt-1">
              +89 hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entregues
            </CardTitle>
            <CheckCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">1,215</div>
            <p className="text-xs text-muted-foreground mt-1">
              98.5% de taxa de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">15</div>
            <p className="text-xs text-muted-foreground mt-1">
              Na fila de envio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Falhas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">4</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compose Message */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Nova Mensagem</CardTitle>
          <CardDescription>
            Envie mensagens anônimas para grupos ou contatos individuais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Destinatário</label>
            <Input placeholder="Selecione um grupo ou contato..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem</label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Digite sua mensagem aqui..."
            />
          </div>
          <div className="flex justify-between items-center">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Anexar Arquivo
            </Button>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Mensagem
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Mensagens</CardTitle>
              <CardDescription>
                Últimas mensagens enviadas pelo sistema
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(message.status)}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.recipient}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {message.content}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(message.status)}>
                      {getStatusLabel(message.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Enviado por: {message.sender}</span>
                    <span>•</span>
                    <span>{message.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

