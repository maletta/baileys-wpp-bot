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
  X,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral'
  },
  {
    title: 'WhatsApp',
    href: '/dashboard/whatsapp',
    icon: Smartphone,
    description: 'Conexões'
  },
  {
    title: 'Grupos',
    href: '/dashboard/groups',
    icon: Users,
    description: 'Gerenciar grupos'
  },
  {
    title: 'Mensagens',
    href: '/dashboard/messages',
    icon: MessageSquare,
    description: 'Envios anônimos'
  },
  {
    title: 'QR Code',
    href: '/dashboard/qrcode',
    icon: QrCode,
    description: 'Scanner'
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Sistema'
  },
];

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [pathname, onMobileClose]);

  // Em mobile, sempre mostrar expandido (não usar collapsed)
  const isMobileCollapsed = false; // Mobile sempre expandido
  const isCollapsed = collapsed && !mobileOpen; // Desktop usa collapsed, mobile sempre expandido

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[45] lg:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border",
          // Width
          "w-64 lg:w-auto", // Mobile sempre 256px, desktop varia
          isCollapsed ? "lg:w-16" : "lg:w-64",
          // Z-index
          "z-[50] lg:z-40",
          // Transitions
          "transition-transform duration-300 ease-in-out lg:transition-all",
          // Mobile visibility
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop visibility (sempre visível)
          "lg:translate-x-0"
        )}
      >
        {/* Logo/Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {/* Logo - sempre visível em mobile, depende de collapsed em desktop */}
          <div className={cn(
            "flex items-center space-x-2",
            isCollapsed && "lg:hidden"
          )}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">
              WA Baileys
            </span>
          </div>

          {/* Logo colapsado - só em desktop quando collapsed */}
          {isCollapsed && (
            <div className="hidden lg:flex w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent items-center justify-center mx-auto">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Mobile close button */}
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

        {/* Toggle Button - Desktop only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar hover:bg-sidebar-accent/10",
            "transition-transform duration-300 hidden lg:flex"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-sidebar-foreground transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-sidebar-accent/10 active:bg-sidebar-accent/20",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                  isCollapsed && "lg:justify-center"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-white")} />
                {/* Em mobile sempre mostrar texto, em desktop depende de collapsed */}
                <div className={cn(
                  "flex flex-col",
                  isCollapsed && "lg:hidden"
                )}>
                  <span>{item.title}</span>
                  {!isActive && (
                    <span className="text-xs text-sidebar-foreground/50">
                      {item.description}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className={cn(
            "text-xs text-sidebar-foreground/50 text-center",
            isCollapsed && "lg:hidden"
          )}>
            <p>WhatsApp Baileys v1.0.0</p>
            <p className="mt-1">© 2024 - Todos os direitos reservados</p>
          </div>
          {isCollapsed && (
            <div className="hidden lg:flex h-2 w-2 rounded-full bg-success mx-auto" title="Sistema ativo" />
          )}
        </div>
      </aside>
    </>
  );
}
