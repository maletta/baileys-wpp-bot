# 📱 Visualização Mobile-First - Dashboard

## 🎨 FLUXO VISUAL COMPLETO

---

## MOBILE (< 1024px)

### Estado Inicial: Menu Fechado

```
┌─────────────────────────────────────┐
│  [☰] Olá, João! 👋         🌙 🔔 👤│ ← Header z-30
├─────────────────────────────────────┤
│                                     │
│  📊 Dashboard Overview              │
│  ┌──────────┐  ┌──────────┐       │
│  │ 25       │  │ 142      │       │
│  │ Sessões  │  │ Mensagens│       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌─────────────────────────┐      │
│  │ 📱 Conectar WhatsApp     │      │
│  └─────────────────────────┘      │
│                                     │
│  ┌─────────────────────────┐      │
│  │ 💬 Enviar Mensagem       │      │
│  └─────────────────────────┘      │
│                                     │
└─────────────────────────────────────┘
     CONTEÚDO VISÍVEL, MENU OCULTO
```

### Ação: Clicar no [☰]

```
    Animação: translate-x(-100%) → translate-x(0)
    Duração: 300ms
    Easing: ease-out
```

### Estado: Menu Aberto

```
┌──────────────────┐
│ 💬 WA Baileys [X]│ ← Sidebar z-50
│                  │
│  📊 Dashboard    │ ← Item ativo
│     Visão geral  │
│                  │
│  📱 WhatsApp     │
│     Conexões     │
│                  │
│  👥 Grupos       │
│     Gerenciar    │
│                  │
│  💬 Mensagens    │
│     Envios       │
│                  │
│  📷 QR Code      │
│     Scanner      │
│                  │
│  ⚙️  Configurações│
│     Sistema      │
│                  │
│ ─────────────────│
│ WhatsApp Baileys │
│ v1.0.0           │
│ © 2024           │
└──────────────────┘
    320px (max)

    ║██████████████████████║ ← Overlay z-40
    ║    bg-black/70      ║    (cobre o resto)
    ║                     ║
```

### Interações Possíveis:

#### 1. Clicar no [X]:

```
Menu fecha
Animação: translate-x(0) → translate-x(-100%)
Overlay desaparece (fade-out)
Body scroll restaurado
```

#### 2. Clicar no Overlay:

```
Menu fecha
Mesma animação acima
```

#### 3. Clicar em um Link:

```
Menu fecha
Navegação acontece
Overlay desaparece
```

---

## TABLET (768px - 1023px)

Comportamento **IDÊNTICO** ao mobile:

- Drawer deslizante
- Overlay escuro
- Max-width: 320px

```
┌────────────────────────────────────────────┐
│  [☰] Olá, João! 👋              🌙 🔔 👤  │
├────────────────────────────────────────────┤
│                                            │
│     📊 Dashboard Overview                  │
│     ┌────────┐  ┌────────┐  ┌────────┐   │
│     │   25   │  │  142   │  │    5   │   │
│     │Sessões │  │Mensag. │  │ Grupos │   │
│     └────────┘  └────────┘  └────────┘   │
│                                            │
│     Mais espaço, mas menu ainda drawer    │
│                                            │
└────────────────────────────────────────────┘
```

---

## DESKTOP (≥ 1024px)

### Estado: Expandido (Padrão)

```
┌────────────┬──────────────────────────────────┐
│ 💬 WA      │  Olá, João! 👋      🌙 🔔 👤   │ ← Header z-30
│   Baileys  ├──────────────────────────────────┤
│            │                                  │
│  [◄]       │  📊 Dashboard Overview           │
│  (toggle)  │                                  │
│            │  ┌────────┐  ┌────────┐         │
│ 📊 Dashboard│  │   25   │  │  142   │         │
│    Visão    │  │Sessões │  │Mensag. │         │
│    geral    │  └────────┘  └────────┘         │
│            │                                  │
│ 📱 WhatsApp│  ┌────────────────────────┐     │
│    Conexões│  │ 📱 Conectar WhatsApp    │     │
│            │  └────────────────────────┘     │
│ 👥 Grupos  │                                  │
│    Gerenciar│  ┌────────────────────────┐     │
│            │  │ 💬 Enviar Mensagem      │     │
│ 💬 Mensagens│  └────────────────────────┘     │
│    Envios  │                                  │
│            │  ┌────────────────────────┐     │
│ 📷 QR Code │  │ ⚙️  Configurações       │     │
│    Scanner │  └────────────────────────┘     │
│            │                                  │
│ ⚙️  Config │                                  │
│    Sistema │                                  │
│            │                                  │
│ ───────────│                                  │
│ v1.0.0     │                                  │
│ © 2024     │                                  │
└────────────┴──────────────────────────────────┘
    256px           Conteúdo com ml-64
```

### Ação: Clicar no [◄]

```
    Animação: width 256px → 64px
    Duração: 300ms
    Easing: ease-in-out

    Simultaneamente:
    - Header ajusta: left-64 → left-16
    - Main ajusta: ml-64 → ml-16
    - Textos desaparecem (lg:hidden)
    - Logo muda para mini
```

### Estado: Colapsado

```
┌──┬─────────────────────────────────────────┐
│💬│  Olá, João! 👋         🌙 🔔 👤        │ ← Header z-30
│ B├─────────────────────────────────────────┤
│  │                                         │
│►]│  📊 Dashboard Overview                  │
│  │                                         │
│  │  ┌────────┐  ┌────────┐  ┌────────┐   │
│📊│  │   25   │  │  142   │  │    5   │   │
│  │  │Sessões │  │Mensag. │  │ Grupos │   │
│  │  └────────┘  └────────┘  └────────┘   │
│📱│                                         │
│  │  ┌──────────────────────────────┐     │
│👥│  │ 📱 Conectar WhatsApp          │     │
│  │  └──────────────────────────────┘     │
│💬│                                         │
│  │  ┌──────────────────────────────┐     │
│📷│  │ 💬 Enviar Mensagem            │     │
│  │  └──────────────────────────────┘     │
│  │                                         │
│⚙️ │                                         │
│  │  Mais espaço para conteúdo!            │
│  │                                         │
│●│                                         │
└──┴─────────────────────────────────────────┘
 64px       Conteúdo com ml-16
```

### Hover nos Ícones (Colapsado):

```
┌──┐
│📊│ ← Hover
└──┘
  │
  └─→ [Dashboard] ← Tooltip
```

---

## 🎬 ANIMAÇÕES

### Mobile - Drawer:

```css
/* Entrada */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Saída */
@keyframes slideOut {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

/* Overlay */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Desktop - Collapse:

```css
/* Largura */
transition: width 300ms ease-in-out;

/* Botão Toggle */
transition: left 300ms ease-in-out;

/* Chevron */
transition: transform 300ms ease-in-out;
transform: rotate(180deg); /* Quando colapsado */
```

---

## 🎨 CORES E ESPAÇAMENTO

### Mobile:

```css
Sidebar:
- bg: #1a1d23 (--sidebar)
- text: #fafafa (--sidebar-foreground)
- active: #6366f1 (--sidebar-accent)
- shadow: shadow-2xl

Overlay:
- bg: rgba(0, 0, 0, 0.7)

Padding:
- Header: px-4
- Items: px-3 py-3 (touch-friendly)
- Footer: p-4
```

### Desktop:

```css
Sidebar:
- bg: #1a1d23
- border-right: 1px solid #27292e
- shadow: none

Botão Toggle:
- bg: #1a1d23
- border: 1px solid #27292e
- shadow: shadow-md
- hover: bg-accent/10

Padding:
- Items: px-3 py-2.5
- Footer: p-4
```

---

## 📐 MEDIDAS EXATAS

### Z-index:

```
z-50: Sidebar Mobile
z-40: Overlay + Toggle Button
z-30: Header
z-0:  Content
```

### Larguras:

```
Mobile Sidebar:  max-w-[320px] (100% até 320px)
Desktop Exp:     lg:w-64 (256px)
Desktop Col:     lg:w-16 (64px)
```

### Alturas:

```
Header:   h-16 (64px)
Sidebar:  h-full (100vh)
```

### Transições:

```
Drawer:     300ms ease-out
Collapse:   300ms ease-in-out
Overlay:    200ms fade-in
```

---

## 🔄 ESTADOS DO SISTEMA

```
┌─────────────────────────────────────────┐
│         DashboardLayout                 │
│                                         │
│  [desktopCollapsed: false] ←─ Desktop  │
│  [mobileMenuOpen: false]   ←─ Mobile   │
│                                         │
│  ├─→ Sidebar                            │
│  │   Recebe ambos os estados           │
│  │   Renderiza baseado em breakpoint   │
│  │                                      │
│  ├─→ Header                             │
│  │   Recebe desktopCollapsed           │
│  │   Toggle para mobileMenuOpen        │
│  │                                      │
│  └─→ Main                               │
│      Margin ajustável                   │
└─────────────────────────────────────────┘
```

---

## 🎯 BREAKPOINTS

```
    0px                1024px              ∞
    │                    │                 │
    ├────────────────────┼─────────────────┤
    │    MOBILE/TABLET   │    DESKTOP      │
    │                    │                 │
    │  Drawer Pattern    │  Sidebar Pattern│
    │  mobileOpen        │  desktopCollapsed│
    │  z-50              │  z-40           │
    │  max-w-[320px]     │  w-64 / w-16    │
    │  Overlay           │  Sem overlay    │
    │  Desliza           │  Collapse       │
    └────────────────────┴─────────────────┘
                     lg breakpoint
```

---

## ✅ CHECKLIST VISUAL

### Mobile:

- [x] Menu oculto inicialmente
- [x] Botão ☰ visível no header
- [x] Drawer desliza suavemente
- [x] Largura máxima 320px
- [x] Overlay escuro 70%
- [x] Fecha ao clicar fora
- [x] Scroll bloqueado
- [x] Animação suave (300ms)

### Desktop:

- [x] Sidebar sempre visível
- [x] Largura inicial 256px
- [x] Botão toggle flutuante
- [x] Colapsa para 64px
- [x] Textos desaparecem
- [x] Ícones permanecem
- [x] Header se ajusta
- [x] Conteúdo se ajusta

---

## 🎉 RESULTADO FINAL

### Profissional ✅

- Design moderno e limpo
- Animações suaves e elegantes
- UX intuitiva em todos os dispositivos

### Funcional ✅

- Zero bugs de responsividade
- Estados separados e claros
- Código limpo e manutenível

### Performático ✅

- Animações GPU-accelerated
- CSS otimizado
- Zero conflitos de z-index

---

**Arquitetura:** Mobile-First  
**Status:** ✅ Completo  
**Testado em:** Mobile, Tablet, Desktop  
**Zero bugs** 🎯
