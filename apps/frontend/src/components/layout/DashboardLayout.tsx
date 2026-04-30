"use client"

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Estado para desktop: colapsar sidebar
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  // Estado para mobile: abrir/fechar drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Callbacks memoizados para evitar re-renders desnecessários
  const handleDesktopToggle = useCallback(() => {
    setDesktopCollapsed(prev => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleMobileToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  // Prevenir scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - comportamento diferente em mobile e desktop */}
      <Sidebar
        desktopCollapsed={desktopCollapsed}
        onDesktopToggle={handleDesktopToggle}
        mobileOpen={mobileMenuOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Header - se ajusta ao estado da sidebar */}
      <Header
        desktopCollapsed={desktopCollapsed}
        onMobileMenuToggle={handleMobileToggle}
      />

      {/* Main Content */}
      <main
        className={cn(
          // === BASE (Mobile First) ===
          // Em mobile, ocupa toda a largura, apenas padding-top para header
          "pt-16 min-h-screen",

          // === DESKTOP (>= lg) ===
          // Margem esquerda para acomodar sidebar
          "lg:transition-all lg:duration-300",
          desktopCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="container mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

