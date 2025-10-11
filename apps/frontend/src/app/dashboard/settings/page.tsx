'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Zap,
  Save,
  Key
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'HIGH_LEVEL_ADMIN':
        return 'Admin Principal';
      case 'DEVELOPER':
        return 'Desenvolvedor';
      case 'GROUP_ADMIN':
        return 'Admin de Grupo';
      case 'MEMBER':
        return 'Membro';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'HIGH_LEVEL_ADMIN':
        return 'destructive';
      case 'DEVELOPER':
        return 'secondary';
      case 'GROUP_ADMIN':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências e configurações do sistema
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Perfil do Usuário</CardTitle>
          </div>
          <CardDescription>
            Informações da sua conta e permissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Perfil - Mobile First: vertical em mobile, horizontal em desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar - menor em mobile */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 mx-auto sm:mx-0">
              <AvatarImage src={user?.profilePicture || ''} alt={user?.displayName || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Info - centralizada em mobile, alinhada à esquerda em desktop */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold truncate">
                {user?.displayName || 'Usuário'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
              <div className="flex justify-center sm:justify-start">
                <Badge variant={getRoleBadgeVariant(user?.role || '')} className="text-xs">
                  {getRoleLabel(user?.role || '')}
                </Badge>
              </div>
            </div>

            {/* Botão - full-width em mobile, auto em desktop */}
            <Button variant="outline" className="w-full sm:w-auto shrink-0">
              Editar Perfil
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input defaultValue={user?.displayName || ''} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input defaultValue={user?.email || ''} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Conta criada em</label>
            <Input
              defaultValue={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificações</CardTitle>
          </div>
          <CardDescription>
            Configure como deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: 'Notificações por E-mail',
              description: 'Receba atualizações importantes por e-mail',
              enabled: true,
            },
            {
              title: 'Notificações Push',
              description: 'Receba notificações no navegador',
              enabled: true,
            },
            {
              title: 'Alertas de Conexão',
              description: 'Notificar quando houver problemas de conexão',
              enabled: true,
            },
            {
              title: 'Relatórios Semanais',
              description: 'Receba um resumo semanal das atividades',
              enabled: false,
            },
          ].map((notification, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">{notification.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {notification.description}
                </p>
              </div>
              <Button
                variant={notification.enabled ? 'default' : 'outline'}
                size="sm"
                className="w-full sm:w-auto shrink-0"
              >
                {notification.enabled ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Segurança</CardTitle>
          </div>
          <CardDescription>
            Gerencie suas configurações de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Autenticação de Dois Fatores</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Adicione uma camada extra de segurança
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto shrink-0">
              <Key className="h-4 w-4" />
              Configurar
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Sessões Ativas</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                2 dispositivos conectados
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
              Gerenciar
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Histórico de Atividades</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visualize seu histórico de login
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
              Ver Histórico
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Aparência</CardTitle>
          </div>
          <CardDescription>
            Personalize a aparência da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tema</label>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="justify-start">
                Claro
              </Button>
              <Button variant="default" className="justify-start">
                Escuro
              </Button>
              <Button variant="outline" className="justify-start">
                Sistema
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cor de Destaque</label>
            <div className="grid grid-cols-5 gap-2">
              {['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'].map((color, index) => (
                <button
                  key={index}
                  className={`h-10 rounded-md ${color} hover:ring-2 ring-ring ring-offset-2 transition-all`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Configurações do Sistema</CardTitle>
          </div>
          <CardDescription>
            Configurações avançadas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL da API Backend</label>
            <Input
              defaultValue={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api'}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Configure via variáveis de ambiente
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Timeout de Conexão (segundos)</label>
            <Input type="number" defaultValue="30" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tentativas de Reconexão</label>
            <Input type="number" defaultValue="3" />
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Desempenho</CardTitle>
          </div>
          <CardDescription>
            Otimize o desempenho do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <p className="font-medium">Cache de Mensagens</p>
              <p className="text-sm text-muted-foreground">
                Armazena mensagens localmente para acesso mais rápido
              </p>
            </div>
            <Button variant="default" size="sm">
              Ativado
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <p className="font-medium">Carregamento Preguiçoso</p>
              <p className="text-sm text-muted-foreground">
                Carrega recursos apenas quando necessário
              </p>
            </div>
            <Button variant="default" size="sm">
              Ativado
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <p className="font-medium">Limpar Cache</p>
              <p className="text-sm text-muted-foreground">
                Remove dados temporários armazenados
              </p>
            </div>
            <Button variant="outline" size="sm">
              Limpar Agora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          Cancelar
        </Button>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}

