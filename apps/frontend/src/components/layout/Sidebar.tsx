"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  QrCode,
  Settings,
  ChevronLeft,
  Smartphone,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface SidebarProps {
  /** Estado de colapso (apenas para desktop >= lg) */
  desktopCollapsed: boolean;
  /** Toggle do colapso desktop */
  onDesktopToggle: () => void;
  /** Estado de abertura do menu mobile (apenas para < lg) */
  mobileOpen: boolean;
  /** Callback para fechar menu mobile */
  onMobileClose: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard' as const,
    icon: LayoutDashboard,
    description: 'Visão geral'
  },
  {
    title: 'WhatsApp',
    href: '/dashboard/whatsapp' as const,
    icon: Smartphone,
    description: 'Conexões'
  },
  {
    title: 'Grupos',
    href: '/dashboard/groups' as const,
    icon: Users,
    description: 'Gerenciar grupos'
  },
  {
    title: 'Mensagens',
    href: '/dashboard/messages' as const,
    icon: MessageSquare,
    description: 'Envios anônimos'
  },
  {
    title: 'QR Code',
    href: '/dashboard/qrcode' as const,
    icon: QrCode,
    description: 'Scanner'
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings' as const,
    icon: Settings,
    description: 'Sistema'
  },
];

export function Sidebar({
  desktopCollapsed,
  onDesktopToggle,
  mobileOpen,
  onMobileClose
}: SidebarProps) {
  const pathname = usePathname();

  // Fechar menu mobile ao navegar para outra página
  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  return (
    <>
      {/* ========== MOBILE OVERLAY ========== */}
      {/* Visível apenas em mobile (< lg) quando mobileOpen = true */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40 animate-in fade-in duration-200"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className={cn(
          // === BASE (Mobile First) ===
          // Posicionamento e estrutura base
          "fixed top-0 h-full",
          "bg-sidebar z-50 flex flex-col",

          // Largura mobile: 85% da tela (deixa 15% para contexto)
          "w-[85%] max-w-sm",

          // Estilo mobile: drawer com sombra forte
          "shadow-2xl",

          // === MOBILE BEHAVIOR (< lg) ===
          // Posicionamento: -left-full oculta completamente à esquerda
          // Quando aberto: left-0 traz para a tela
          mobileOpen ? "left-0" : "-left-full",

          // Transição suave
          "transition-[left] duration-300 ease-out",

          // === DESKTOP BEHAVIOR (>= lg) ===
          // Desktop: sempre visível em left-0
          "lg:left-0",

          // Desktop: largura fixa (não percentual)
          desktopCollapsed ? "lg:w-16" : "lg:w-64",

          // Desktop: remove sombra, adiciona borda
          "lg:shadow-none lg:border-r lg:border-sidebar-border",

          // Desktop: transição de largura (não de posição)
          "lg:transition-[width] lg:duration-300"
        )}
      >
        {/* ========== HEADER ========== */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border flex-shrink-0">
          {/* Logo completo */}
          <div className={cn(
            "flex items-center gap-2",
            desktopCollapsed && "lg:hidden"
          )}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">
              WA Baileys
            </span>
          </div>

          {/* Logo mini (desktop collapsed) */}
          {desktopCollapsed && (
            <div className="hidden lg:flex w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent items-center justify-center mx-auto shadow-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Botão fechar (apenas mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent/20"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ========== NAVIGATION ========== */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose} // Fechar drawer ao clicar
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200",
                  "hover:bg-sidebar-accent/10 active:scale-[0.98]",
                  isActive
                    ? "bg-sidebar-accent text-white shadow-md"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                  desktopCollapsed && "lg:justify-center lg:px-0"
                )}
                title={desktopCollapsed ? item.title : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0",
                  isActive && "text-white"
                )} />

                {/* Texto e descrição (ocultos quando collapsed no desktop) */}
                <div className={cn(
                  "flex flex-col min-w-0",
                  desktopCollapsed && "lg:hidden"
                )}>
                  <span className="font-medium text-sm">{item.title}</span>
                  {!isActive && (
                    <span className="text-xs text-sidebar-foreground/50 truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ========== FOOTER ========== */}
        <div className="border-t border-sidebar-border p-4 flex-shrink-0">
          <div className={cn(
            "text-xs text-sidebar-foreground/50 text-center space-y-1",
            desktopCollapsed && "lg:hidden"
          )}>
            <p className="font-medium">WhatsApp Baileys</p>
            <p>v1.0.0</p>
            <p>© 2024</p>
          </div>

          {/* Indicador mini (desktop collapsed) */}
          {desktopCollapsed && (
            <div className="hidden lg:flex justify-center">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" title="Sistema ativo" />
            </div>
          )}
        </div>
      </aside>

      {/* ========== DESKTOP COLLAPSE TOGGLE ========== */}
      {/* Botão flutuante para colapsar sidebar (apenas desktop) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDesktopToggle}
        className={cn(
          "hidden lg:flex",
          "fixed top-20 z-40",
          "h-8 w-8 rounded-full",
          "border border-sidebar-border bg-sidebar shadow-md",
          "hover:bg-sidebar-accent/10",
          "transition-all duration-300",
          desktopCollapsed ? "left-[52px]" : "left-[244px]"
        )}
        aria-label={desktopCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 text-sidebar-foreground transition-transform duration-300",
            desktopCollapsed && "rotate-180"
          )}
        />
      </Button>
    </>
  );
}
