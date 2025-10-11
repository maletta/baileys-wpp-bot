"use client"

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, Settings, User, Moon, Sun, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface HeaderProps {
  /** Estado de colapso do sidebar desktop */
  desktopCollapsed: boolean;
  /** Callback para abrir menu mobile */
  onMobileMenuToggle: () => void;
}

export function Header({ desktopCollapsed, onMobileMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

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
    <header
      className={cn(
        // === BASE (Mobile First) ===
        "fixed top-0 left-0 right-0 h-16",
        "bg-white/80 backdrop-blur-sm border-b border-border",
        "z-30", // Abaixo da sidebar mobile (z-50)
        "transition-all duration-300",

        // === DESKTOP (>= lg) ===
        // Header se ajusta ao tamanho da sidebar
        desktopCollapsed ? "lg:left-16" : "lg:left-64"
      )}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* ========== LEFT SIDE ========== */}
        <div className="flex items-center gap-3">
          {/* Botão menu mobile (apenas < lg) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden hover:bg-accent"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Saudação */}
          <h1 className="text-base lg:text-xl font-semibold text-foreground truncate">
            Olá, {user?.displayName?.split(' ')[0] || 'Usuário'}! 👋
          </h1>
        </div>

        {/* ========== RIGHT SIDE ========== */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full hover:bg-accent"
            aria-label={darkMode ? "Modo claro" : "Modo escuro"}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-accent"
                aria-label="Notificações"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-sm text-muted-foreground text-center">
                Nenhuma notificação no momento
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-full pl-2 pr-3 hover:bg-accent"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture || ''} alt={user?.displayName || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Info do usuário (apenas desktop) */}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {user?.displayName || user?.email}
                  </span>
                  <Badge
                    variant={getRoleBadgeVariant(user?.role || '')}
                    className="text-xs h-4 px-1"
                  >
                    {getRoleLabel(user?.role || '')}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

