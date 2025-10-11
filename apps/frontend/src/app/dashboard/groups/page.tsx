'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Shield,
  UserPlus,
  Settings
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <GroupsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function GroupsContent() {
  // Mock data
  const groups = [
    {
      id: '1',
      name: 'Marketing Digital 2024',
      description: 'Grupo de discussão sobre estratégias de marketing',
      members: 45,
      admins: 3,
      unreadMessages: 12,
      lastMessage: 'João: Vamos agendar a reunião...',
      lastMessageTime: '10:30',
      avatar: null,
    },
    {
      id: '2',
      name: 'Vendas - Time A',
      description: 'Time de vendas região Sul',
      members: 28,
      admins: 2,
      unreadMessages: 0,
      lastMessage: 'Maria: Fechamos mais um contrato!',
      lastMessageTime: '09:15',
      avatar: null,
    },
    {
      id: '3',
      name: 'Suporte Técnico',
      description: 'Canal de suporte para clientes',
      members: 156,
      admins: 8,
      unreadMessages: 5,
      lastMessage: 'Cliente: Preciso de ajuda com...',
      lastMessageTime: 'Ontem',
      avatar: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Grupos WhatsApp</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seus grupos e membros
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Grupo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Grupos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Membros
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.reduce((acc, g) => acc + g.members, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em todos os grupos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mensagens não lidas
            </CardTitle>
            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {groups.reduce((acc, g) => acc + g.unreadMessages, 0)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.reduce((acc, g) => acc + g.unreadMessages, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.reduce((acc, g) => acc + g.admins, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gerenciando grupos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Groups List */}
      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-14 w-14">
                  <AvatarImage src={group.avatar || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {group.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {group.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {group.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {group.unreadMessages > 0 && (
                        <Badge variant="destructive" className="rounded-full">
                          {group.unreadMessages}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{group.members} membros</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>{group.admins} admins</span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm truncate">{group.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.lastMessageTime}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Membros
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

