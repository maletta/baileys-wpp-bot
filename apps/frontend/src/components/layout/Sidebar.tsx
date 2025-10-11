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

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          // Mobile: hide by default, show when mobileOpen
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo/Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">
                WA Baileys
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Mobile close button */}
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="lg:hidden text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
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
                  "hover:bg-sidebar-accent/10",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-white")} />
                {!collapsed && (
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {!isActive && (
                      <span className="text-xs text-sidebar-foreground/50">
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          {!collapsed ? (
            <div className="text-xs text-sidebar-foreground/50 text-center">
              <p>WhatsApp Baileys v1.0.0</p>
              <p className="mt-1">© 2024 - Todos os direitos reservados</p>
            </div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-success mx-auto" title="Sistema ativo" />
          )}
        </div>
      </aside>
    </>
  );
}
