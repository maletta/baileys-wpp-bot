# Frontend Dashboard - Novo Layout

## 🎨 Visão Geral

O frontend foi completamente refatorado com um design moderno de dashboard, seguindo as melhores práticas de UI/UX.

## 🎯 Características Principais

### Esquema de Cores

- **Tema Principal**: Indigo/Blue moderno (#6366f1)
- **Cores de Status**:
  - Success: Verde (#10B981)
  - Warning: Laranja (#F59E0B)
  - Info: Azul (#3B82F6)
  - Destructive: Vermelho (#EF4444)

### Componentes de Layout

#### 1. Sidebar (Menu Lateral)

- **Desktop**:
  - Largura: 256px (expandida) / 64px (colapsada)
  - Retrátil com botão de toggle
- **Mobile**:
  - Oculta por padrão
  - Abre via botão de menu no header
  - Overlay semi-transparente
  - Fecha automaticamente ao trocar de página

**Funcionalidades**:

- Navegação com ícones
- Indicador visual de página ativa
- Descrição das seções (quando expandida)
- Footer com versão do sistema

#### 2. Header (Menu Superior)

- **Altura fixa**: 64px
- **Conteúdo**:
  - Saudação personalizada
  - Botão de menu (mobile)
  - Toggle dark/light mode
  - Notificações
  - Menu de usuário com avatar

#### 3. Main Content (Área Central)

- **Responsivo**: Adapta-se automaticamente
- **Container**: max-width com padding responsivo
- **Animações**: Transições suaves

## 📱 Páginas Implementadas

### 1. Dashboard (Overview)

- **Rota**: `/dashboard`
- **Conteúdo**:
  - Cards de estatísticas (4 métricas principais)
  - Atividade recente
  - Ações rápidas
  - Status do sistema
  - Gráficos de desempenho

### 2. WhatsApp

- **Rota**: `/dashboard/whatsapp`
- **Conteúdo**:
  - Gerenciamento de conexões
  - Visualização de QR Code
  - Status de conexão
  - Estatísticas de uso

### 3. Grupos

- **Rota**: `/dashboard/groups`
- **Conteúdo**:
  - Lista de grupos WhatsApp
  - Estatísticas de membros
  - Mensagens não lidas
  - Busca e filtros

### 4. Mensagens

- **Rota**: `/dashboard/messages`
- **Conteúdo**:
  - Envio de mensagens anônimas
  - Histórico de envios
  - Status de entrega
  - Estatísticas

### 5. QR Code

- **Rota**: `/dashboard/qrcode`
- **Conteúdo**:
  - Geração de QR Code
  - Scanner
  - Instruções de conexão
  - Status em tempo real

### 6. Configurações

- **Rota**: `/dashboard/settings`
- **Conteúdo**:
  - Perfil do usuário
  - Notificações
  - Segurança
  - Aparência
  - Configurações do sistema
  - Desempenho

## 🎨 Paleta de Cores

### Cores Principais

```css
--primary: hsl(239, 84%, 67%) /* Indigo */ --sidebar: hsl(240, 6%, 10%)
  /* Cinza escuro */ --sidebar-accent: hsl(239, 84%, 67%) /* Indigo */;
```

### Cores de Status

```css
--success: #10b981 /* Verde */ --warning: #f59e0b /* Laranja */ --info: #3b82f6
  /* Azul */;
```

### WhatsApp

```css
--whatsapp-green: #25d366 --whatsapp-dark: #128c7e --whatsapp-light: #dcf8c6;
```

## 📱 Responsividade

### Breakpoints (Tailwind)

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px (ponto de mudança do layout)
- **xl**: 1280px
- **2xl**: 1536px

### Comportamento Mobile (< 1024px)

1. Sidebar oculta por padrão
2. Botão de menu visível no header
3. Overlay ao abrir o menu
4. Menu fecha automaticamente ao navegar
5. Header ocupa toda a largura

### Comportamento Desktop (≥ 1024px)

1. Sidebar sempre visível
2. Botão de collapse disponível
3. Header ajusta-se ao estado da sidebar
4. Sem overlay

## 🚀 Como Usar

### Criar uma Nova Página no Dashboard

1. Crie o arquivo em `src/app/dashboard/[nome]/page.tsx`:

```tsx
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function MinhaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>{/* Seu conteúdo aqui */}</DashboardLayout>
    </ProtectedRoute>
  );
}
```

2. Adicione a rota no Sidebar (`src/components/layout/Sidebar.tsx`):

```tsx
{
  title: 'Minha Página',
  href: '/dashboard/minha-pagina',
  icon: IconComponent,
  description: 'Descrição curta'
}
```

## 🎯 Componentes UI Disponíveis

- `Button` - Botões com variantes
- `Card` - Cards com header/content
- `Badge` - Badges de status
- `Avatar` - Avatares de usuário
- `Input` - Campos de entrada
- `DropdownMenu` - Menus dropdown
- `Toast` - Notificações toast

## 🔧 Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:4444/api
NEXT_PUBLIC_APP_URL=http://localhost:3333
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-client-id
```

## 📝 Notas Importantes

1. **Todas as páginas do dashboard** devem usar `<DashboardLayout>`
2. **Rotas protegidas** devem usar `<ProtectedRoute>`
3. **Componentes client-side** devem ter `"use client"` no topo
4. **Cores customizadas** devem seguir o padrão HSL definido
5. **Ícones** usar apenas do `lucide-react`

## 🎨 Design System

### Espaçamentos

- **Padding interno**: 16px (mobile) / 24px (desktop)
- **Gap entre elementos**: 16px / 24px
- **Margens de seção**: 24px

### Tipografia

- **Títulos H1**: 30px, font-bold
- **Títulos H2**: 24px, font-semibold
- **Títulos H3**: 18px, font-medium
- **Corpo**: 14px, font-normal

### Sombras

- **Card hover**: shadow-lg
- **Card padrão**: shadow-sm
- **Dropdown**: shadow-md

## 🚀 Performance

- **Lazy loading** de componentes pesados
- **Code splitting** automático do Next.js
- **Otimização de imagens** via next/image
- **Transições CSS** para animações suaves

## 📱 Acessibilidade

- **ARIA labels** em todos os botões interativos
- **Focus visible** em elementos focáveis
- **Contraste adequado** de cores
- **Navegação por teclado** suportada

---

**Versão**: 1.0.0  
**Data**: Janeiro 2025  
**Framework**: Next.js 15 + React 19 + Tailwind CSS 3
