# Frontend - WhatsApp Baileys IA

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento (porta 3333)
npm run dev

# Build para produção
npm run build

# Rodar produção
npm start
```

Acesse: `http://localhost:3333`

---

## 📁 Estrutura do Projeto

```
src/
├── app/                      # Next.js App Router
│   ├── dashboard/           # Páginas do dashboard
│   │   ├── page.tsx        # Visão geral
│   │   ├── groups/         # Gerenciamento de grupos
│   │   ├── messages/       # Mensagens
│   │   ├── settings/       # Configurações
│   │   ├── whatsapp/       # Conexões WhatsApp
│   │   └── qrcode/         # Scanner QR Code
│   ├── login/              # Página de login
│   ├── layout.tsx          # Layout raiz
│   └── globals.css         # Estilos globais
│
├── components/              # Componentes React
│   ├── auth/               # Autenticação
│   ├── layout/             # Layout (Header, Sidebar, DashboardLayout)
│   └── ui/                 # Componentes UI reutilizáveis
│
└── hooks/                   # Custom hooks
    └── useAuth.tsx         # Hook de autenticação
```

---

## 🎨 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Autenticação:** Google OAuth 2.0
- **Componentes UI:** shadcn/ui
- **Ícones:** Lucide React

---

## 🏗️ Arquitetura do Layout

### Componentes Principais

#### 1. **DashboardLayout** (`components/layout/DashboardLayout.tsx`)

Orquestra o layout geral do dashboard:

```tsx
// Estados separados para mobile e desktop
const [desktopCollapsed, setDesktopCollapsed] = useState(false); // Desktop: colapsar sidebar
const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile: abrir drawer
```

**Responsabilidades:**

- Gerenciar estados de UI (sidebar, menu mobile)
- Prevenir scroll quando menu mobile está aberto
- Distribuir callbacks para Header e Sidebar

#### 2. **Header** (`components/layout/Header.tsx`)

Menu superior fixo (altura: 64px):

- Saudação personalizada
- Botão menu mobile (< lg)
- Toggle dark mode
- Notificações
- Menu de usuário com avatar

**Ajuste responsivo:**

```tsx
// Header se ajusta à largura da sidebar em desktop
desktopCollapsed ? "lg:left-16" : "lg:left-64";
```

#### 3. **Sidebar** (`components/layout/Sidebar.tsx`)

Menu lateral com comportamento **mobile-first**:

**Mobile (< 1024px):**

- Drawer que desliza da esquerda
- Overlay semi-transparente
- Largura: 85% da tela (máx 384px)
- Fecha ao navegar ou clicar no overlay

**Desktop (≥ 1024px):**

- Sidebar fixa sempre visível
- Largura: 256px (expandida) / 64px (colapsada)
- Botão toggle flutuante
- Transição suave de largura

---

## 🎨 Tema e Cores

### Paleta Principal (Tailwind Config)

```ts
colors: {
  primary: '#6366f1',      // Indigo
  accent: '#8b5cf6',       // Roxo
  sidebar: '#1e293b',      // Slate dark
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Laranja
  info: '#3B82F6',         // Azul
}
```

### Dark Mode

Suportado via classe `dark` no `<html>`:

- Toggle no Header
- CSS variables definidas em `globals.css`

---

## 📱 Mobile-First: Padrões e Práticas

> Consulte `MOBILE_FIRST_GUIDE.md` para guia completo de padrões responsivos.

### Breakpoints (Tailwind)

```
sm:  640px   (Mobile grande / Tablet pequeno)
md:  768px   (Tablet)
lg:  1024px  (Desktop)
xl:  1280px  (Desktop grande)
2xl: 1536px  (Desktop extra grande)
```

### Padrão Mobile-First

```tsx
// ✅ SEMPRE começar com mobile (base)
<div className="
  flex-col gap-2 p-3        // Mobile
  sm:flex-row sm:gap-4      // Tablet+
  lg:p-6                    // Desktop
">
```

### Componentes Responsivos Comuns

```tsx
// Avatar
<Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />

// Botão
<Button className="w-full sm:w-auto">Ação</Button>

// Card
<Card className="p-3 sm:p-4 lg:p-6" />

// Texto
<h3 className="text-sm sm:text-base lg:text-lg" />
```

---

## 🔐 Autenticação

### Google OAuth 2.0

**Configuração** (`.env.local`):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu_client_id_aqui
```

**Hook de autenticação:**

```tsx
import { useAuth } from "@/hooks/useAuth";

function Component() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // user contém: displayName, email, profilePicture, role, etc.
}
```

**Proteção de rotas:**

```tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute>
      <DashboardLayout>{/* conteúdo protegido */}</DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

## 🧩 Componentes UI (shadcn/ui)

Componentes pré-configurados em `src/components/ui/`:

- `Button` - Botões com variantes
- `Card` - Cards de conteúdo
- `Avatar` - Avatars com fallback
- `Badge` - Badges de status
- `Input` - Campos de formulário
- `Dropdown Menu` - Menus dropdown
- `Toast` - Notificações toast

**Exemplo de uso:**

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default">Ação</Button>
  </CardContent>
</Card>;
```

---

## 📄 Páginas

### Login (`app/login/page.tsx`)

- Design split-screen (desktop)
- Login via Google OAuth
- Animações de entrada
- Responsivo mobile

### Dashboard Overview (`app/dashboard/page.tsx`)

- Cards de estatísticas
- Resumo de atividades
- Ações rápidas

### Grupos (`app/dashboard/groups/page.tsx`)

- Lista de grupos WhatsApp
- Stats (membros, admins, não lidas)
- Ações (adicionar membros, configurar)
- Cards otimizados mobile-first

### Configurações (`app/dashboard/settings/page.tsx`)

- Perfil do usuário
- Notificações
- Segurança
- Aparência
- Configurações do sistema

---

## 🛠️ Desenvolvimento

### Adicionar Nova Página

1. Criar arquivo em `src/app/dashboard/nova-pagina/page.tsx`:

```tsx
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function NovaPaginaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Nova Página</h2>
          {/* conteúdo */}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

2. Adicionar ao menu lateral em `Sidebar.tsx`:

```tsx
const menuItems = [
  // ...
  {
    title: "Nova Página",
    href: "/dashboard/nova-pagina" as const,
    icon: IconName,
    description: "Descrição",
  },
];
```

### Boas Práticas

#### 1. Client Components

Adicionar `"use client"` quando usar hooks:

```tsx
"use client";

import { useState } from "react";
```

#### 2. Mobile-First

Sempre começar com estilos mobile:

```tsx
// ✅ BOM
className = "flex-col sm:flex-row";

// ❌ EVITAR
className = "flex-row md:flex-col";
```

#### 3. Truncate em Textos

Prevenir overflow:

```tsx
<p className="truncate">{longText}</p>
```

#### 4. Loading States

```tsx
{
  isLoading ? <Spinner /> : <Content />;
}
```

---

## 🐛 Troubleshooting

### Erro: "React Hook only works in Client Component"

**Solução:** Adicionar `"use client"` no topo do arquivo.

### Tailwind não aplica estilos

**Solução:** Verificar se `postcss.config.js` existe:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Menu mobile não abre

**Solução:** Verificar z-index:

- Sidebar mobile: `z-50`
- Overlay: `z-40`
- Header: `z-30`

---

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 📝 Notas

- Porta padrão: **3333** (configurada em `package.json`)
- PostCSS configurado para Tailwind
- Variáveis CSS em `globals.css` para temas
- Animações customizadas definidas em `globals.css`
