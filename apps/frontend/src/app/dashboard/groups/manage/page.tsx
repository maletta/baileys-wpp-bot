'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Users, Globe, Settings } from 'lucide-react';
import {
  getManageableGroups,
  updateManageableGroup,
  type ManageableGroup
} from '@/lib/groupManagementApi';

interface GroupEditState {
  formSlug: string;
  notificationGroupId: string;
  welcomeMessageTemplate: string;
  saving: boolean;
}

export default function GroupManagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [groups, setGroups] = useState<ManageableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editStates, setEditStates] = useState<Record<string, GroupEditState>>({});

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getManageableGroups();
      setGroups(result);
      const states: Record<string, GroupEditState> = {};
      result.forEach(g => {
        states[g.id] = {
          formSlug: g.formSlug || '',
          notificationGroupId: g.config?.notificationGroupId || '',
          welcomeMessageTemplate: g.config?.welcomeMessageTemplate || '',
          saving: false
        };
      });
      setEditStates(states);
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar a lista de grupos.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      void loadGroups();
    }
  }, [authLoading, user, loadGroups]);

  const handleSave = async (groupId: string) => {
    const state = editStates[groupId];
    if (!state || state.saving) return;

    setEditStates(prev => ({
      ...prev,
      [groupId]: { ...prev[groupId], saving: true }
    }));

    try {
      await updateManageableGroup(groupId, {
        formSlug: state.formSlug || null,
        welcomeMessageTemplate: state.welcomeMessageTemplate || null
      });
      toast({ title: 'Salvo', description: 'Configurações atualizadas.' });
      void loadGroups();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao salvar';
      toast({ variant: 'destructive', title: 'Erro', description: msg });
    } finally {
      setEditStates(prev => ({
        ...prev,
        [groupId]: { ...prev[groupId], saving: false }
      }));
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Grupos e Comunidades</h1>
            <p className="text-sm text-muted-foreground">
              Configure slug do formulário, grupo de notificação e template de boas-vindas
            </p>
          </div>
        </div>

        {groups.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum grupo encontrado. Você precisa ser admin de pelo menos um grupo.</p>
          </Card>
        )}

        <div className="grid gap-4">
          {groups.map(group => {
            const editState = editStates[group.id];
            if (!editState) return null;

            return (
              <Card key={group.id} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-lg border">
                    {group.imageUrl ? <AvatarImage src={group.imageUrl} alt="" className="object-cover" /> : null}
                    <AvatarFallback className="rounded-lg">{group.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{group.name}</p>
                      {group.isCommunity && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          <Globe className="h-3 w-3 inline mr-1" />
                          Comunidade
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {group.whatsappRegistry}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Link: <span className="font-mono">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/formulario/{group.formSlug || 'sem-slug'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Slug do formulário</label>
                    <Input
                      value={editState.formSlug}
                      onChange={e => setEditStates(prev => ({
                        ...prev,
                        [group.id]: { ...prev[group.id], formSlug: e.target.value }
                      }))}
                      placeholder="ex: meu_grupo"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium">Template de boas-vindas</label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                      value={editState.welcomeMessageTemplate}
                      onChange={e => setEditStates(prev => ({
                        ...prev,
                        [group.id]: { ...prev[group.id], welcomeMessageTemplate: e.target.value }
                      }))}
                      placeholder={'Use {link} para inserir o link do formulário.\nEx: Bem-vindo! Preencha seu cadastro: {link}'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{link}'} para o link do formulário. Deixe vazio para usar o template padrão.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave(group.id)}
                    loading={editState.saving}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
