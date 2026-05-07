import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ChunkLoadRecovery } from '@/components/ChunkLoadRecovery';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WhatsApp Baileys - Sistema de Gerenciamento',
  description: 'Sistema de gerenciamento de WhatsApp usando Baileys',
  keywords: ['WhatsApp', 'Baileys', 'Gerenciamento', 'Bot'],
  authors: [{ name: 'WhatsApp Baileys Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* suppressHydrationWarning: extensões do browser podem injetar atributos no body (ex.: ap-style) */}
      <body className={inter.className} suppressHydrationWarning>
        <ChunkLoadRecovery />
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
