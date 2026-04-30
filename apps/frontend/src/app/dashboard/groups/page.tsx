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

      {/* Groups List - Cards otimizados para mobile */}
      <div className="grid gap-3 sm:gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar - menor e alinhado ao topo */}
                <Avatar className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 mt-0.5">
                  <AvatarImage src={group.avatar || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-lg">
                    {group.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info - layout compacto */}
                <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                  {/* Header: Título + Badge + Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-lg leading-tight truncate">
                        {group.name}
                      </h3>
                      <p className="text-[11px] sm:text-sm text-muted-foreground truncate leading-tight mt-0.5">
                        {group.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {group.unreadMessages > 0 && (
                        <Badge variant="destructive" className="rounded-full text-[10px] h-4 min-w-[16px] px-1">
                          {group.unreadMessages}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats - sempre em linha (compacto) */}
                  <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{group.members}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{group.admins}</span>
                    </div>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="truncate">{group.lastMessageTime}</span>
                  </div>

                  {/* Última mensagem - compacta */}
                  <div className="p-2 sm:p-2.5 bg-muted/50 rounded-md">
                    <p className="text-[11px] sm:text-sm truncate leading-tight">
                      {group.lastMessage}
                    </p>
                  </div>

                  {/* Botões - sempre em linha (compacto em mobile) */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-[11px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                      <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 shrink-0" />
                      <span className="truncate">Add</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-[11px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                      <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 shrink-0" />
                      <span className="truncate">Config</span>
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

