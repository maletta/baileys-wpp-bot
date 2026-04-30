# 📱 Guia Mobile-First

## 🎯 Filosofia

Este projeto segue rigorosamente a abordagem **mobile-first**:

1. **Escrever CSS para mobile primeiro** (estilos base)
2. **Adicionar breakpoints** para telas maiores (`sm:`, `md:`, `lg:`)
3. **Testar sempre em mobile** antes de desktop

---

## 📐 Breakpoints Tailwind

```
Base:  0px      (Mobile)       ← Estilos sem prefixo
sm:    640px    (Mobile L / Tablet P)
md:    768px    (Tablet)
lg:    1024px   (Desktop)      ← Breakpoint principal do projeto
xl:    1280px   (Desktop L)
2xl:   1536px   (Desktop XL)
```

**Breakpoint crítico:** `lg:` (1024px) separa mobile de desktop no layout.

---

## 🏗️ Padrões de Layout

### 1. Layout Vertical → Horizontal

```tsx
// Empilhado (mobile) → Lado a lado (desktop)
<div className="flex flex-col sm:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 2. Larguras Responsivas

```tsx
// Full-width (mobile) → Largura fixa (desktop)
<div className="w-full sm:w-auto">
  <Button className="w-full sm:w-auto">Ação</Button>
</div>

// Flex responsivo
<div className="w-full sm:flex-1">Conteúdo</div>
```

### 3. Padding/Margin Responsivos

```tsx
// Menor em mobile, maior em desktop
<Card className="p-3 sm:p-4 lg:p-6">
  {/* Padding: 12px → 16px → 24px */}
</Card>

<div className="space-y-2 sm:space-y-3 lg:space-y-4">
  {/* Gap: 8px → 12px → 16px */}
</div>
```

### 4. Tipografia Responsiva

```tsx
// Fontes menores em mobile
<h1 className="text-xl sm:text-2xl lg:text-3xl">Título</h1>
<p className="text-xs sm:text-sm lg:text-base">Texto</p>

// Line-height compacto
<p className="leading-tight sm:leading-normal">Texto</p>
```

### 5. Avatares e Ícones

```tsx
// Menor em mobile, maior em desktop
<Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />
<Icon className="h-4 w-4 sm:h-5 sm:w-5" />
```

---

## 🎨 Componentes Comuns

### Card de Ação

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4">
  {/* Texto */}
  <div className="flex-1 min-w-0">
    <p className="font-medium text-sm sm:text-base">Título</p>
    <p className="text-xs sm:text-sm text-muted-foreground">Descrição</p>
  </div>

  {/* Botão */}
  <Button className="w-full sm:w-auto shrink-0">Ação</Button>
</div>
```

**Resultado:**

- **Mobile:** Vertical, botão full-width
- **Desktop:** Horizontal, botão auto-width

### Card de Lista (ex: Grupos)

```tsx
<Card className="p-3 sm:p-6">
  <div className="flex items-start gap-3 sm:gap-4">
    {/* Avatar */}
    <Avatar className="h-10 w-10 sm:h-14 sm:w-14 shrink-0" />

    {/* Info */}
    <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
      {/* Título + Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-lg font-semibold truncate">Título</h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Descrição
          </p>
        </div>
        <Badge className="text-xs shrink-0">Status</Badge>
      </div>

      {/* Stats (1 linha) */}
      <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>45</span>
        </div>
        <span>•</span>
        <span>10:30</span>
      </div>

      {/* Botões (1 linha) */}
      <div className="flex gap-2">
        <Button className="flex-1 text-xs sm:text-sm h-8 sm:h-9">Ação 1</Button>
        <Button className="flex-1 text-xs sm:text-sm h-8 sm:h-9">Ação 2</Button>
      </div>
    </div>
  </div>
</Card>
```

**Características:**

- Layout compacto em mobile
- Stats em 1 linha (não empilhar)
- Botões lado a lado (não empilhar)
- Fontes e ícones menores em mobile

### Perfil de Usuário

```tsx
<div className="flex flex-col sm:flex-row sm:items-center gap-4">
  {/* Avatar centralizado mobile, esquerda desktop */}
  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto sm:mx-0 shrink-0" />

  {/* Info centralizada mobile, esquerda desktop */}
  <div className="flex-1 text-center sm:text-left space-y-2">
    <h3 className="text-lg sm:text-xl font-semibold truncate">Nome</h3>
    <p className="text-xs sm:text-sm text-muted-foreground truncate">
      email@example.com
    </p>
    <div className="flex justify-center sm:justify-start">
      <Badge>Role</Badge>
    </div>
  </div>

  {/* Botão full-width mobile */}
  <Button className="w-full sm:w-auto shrink-0">Editar</Button>
</div>
```

---

## 🚫 Erros Comuns e Soluções

### ❌ Overflow Horizontal em Mobile

**Problema:**

```tsx
// Elementos forçam largura maior que a tela
<div className="flex items-center gap-4">
  <Avatar className="h-20 w-20" />
  <div className="flex-1">
    <h3 className="text-xl">Nome muito longo que não cabe</h3>
  </div>
  <Button>Editar Perfil</Button> {/* Sai da tela! */}
</div>
```

**Solução:**

```tsx
// Layout vertical em mobile
<div className="flex flex-col sm:flex-row sm:items-center gap-4">
  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto sm:mx-0" />
  <div className="flex-1 min-w-0">
    <h3 className="text-lg sm:text-xl truncate">
      Nome muito longo que não cabe
    </h3>
  </div>
  <Button className="w-full sm:w-auto">Editar Perfil</Button>
</div>
```

**Técnicas:**

- `flex-col sm:flex-row` - Vertical em mobile
- `truncate` - Corta textos longos
- `min-w-0` - Permite flex item encolher
- `w-full sm:w-auto` - Botão full-width em mobile
- Avatar menor em mobile

### ❌ Cards Muito Altos em Mobile

**Problema:**

```tsx
// Muitos elementos empilhados
<Card className="p-6">
  <Avatar className="h-16 w-16" />

  {/* Stats em 2 linhas */}
  <div className="flex flex-col gap-2 mt-4">
    <div>👥 45 membros</div>
    <div>🛡️ 3 admins</div>
  </div>

  {/* Botões em 2 linhas */}
  <div className="flex flex-col gap-2 mt-4">
    <Button className="w-full">Adicionar Membros</Button>
    <Button className="w-full">Configurar</Button>
  </div>
</Card>
```

**Solução:**

```tsx
// Layout compacto
<Card className="p-3 sm:p-6">
  <Avatar className="h-10 w-10 sm:h-16 sm:w-16" />

  {/* Stats em 1 linha */}
  <div className="flex items-center gap-3 mt-2 text-xs">
    <div className="flex items-center gap-1">
      <Users className="h-3 w-3" />
      <span>45</span>
    </div>
    <div className="flex items-center gap-1">
      <Shield className="h-3 w-3" />
      <span>3</span>
    </div>
  </div>

  {/* Botões em 1 linha */}
  <div className="flex gap-2 mt-3">
    <Button className="flex-1 text-xs h-8">Add</Button>
    <Button className="flex-1 text-xs h-8">Config</Button>
  </div>
</Card>
```

**Técnicas:**

- Padding menor: `p-3 sm:p-6`
- Avatar menor: `h-10 w-10`
- Stats em 1 linha (horizontal)
- Botões em 1 linha com texto curto
- Fontes menores: `text-xs`
- Botões menores: `h-8`
- Gaps menores: `space-y-2`

### ❌ Texto Muito Grande em Mobile

**Problema:**

```tsx
<h1 className="text-3xl">Título Gigante</h1>
<p className="text-base">Parágrafo normal</p>
```

**Solução:**

```tsx
<h1 className="text-xl sm:text-2xl lg:text-3xl">Título Responsivo</h1>
<p className="text-xs sm:text-sm lg:text-base">Parágrafo responsivo</p>
```

---

## 📏 Escalas de Tamanho Recomendadas

### Avatares

| Contexto       | Mobile      | Desktop     |
| -------------- | ----------- | ----------- |
| Lista compacta | `h-8 w-8`   | `h-10 w-10` |
| Lista normal   | `h-10 w-10` | `h-12 w-12` |
| Card destaque  | `h-12 w-12` | `h-14 w-14` |
| Perfil         | `h-16 w-16` | `h-20 w-20` |

### Tipografia

| Tipo                | Mobile        | Tablet      | Desktop     |
| ------------------- | ------------- | ----------- | ----------- |
| Títulos grandes     | `text-xl`     | `text-2xl`  | `text-3xl`  |
| Títulos médios      | `text-base`   | `text-lg`   | `text-xl`   |
| Títulos pequenos    | `text-sm`     | `text-base` | `text-lg`   |
| Corpo               | `text-xs`     | `text-sm`   | `text-base` |
| Micro (stats, meta) | `text-[11px]` | `text-xs`   | `text-sm`   |

### Ícones

| Contexto       | Mobile    | Desktop   |
| -------------- | --------- | --------- |
| Micro (inline) | `h-3 w-3` | `h-4 w-4` |
| Padrão         | `h-4 w-4` | `h-5 w-5` |
| Grande         | `h-5 w-5` | `h-6 w-6` |

### Botões

| Tipo     | Mobile           | Desktop          |
| -------- | ---------------- | ---------------- |
| Compacto | `h-8 text-xs`    | `h-9 text-sm`    |
| Normal   | `h-9 text-sm`    | `h-10 text-base` |
| Grande   | `h-10 text-base` | `h-11 text-lg`   |

### Padding

| Contexto      | Mobile      | Tablet      | Desktop     |
| ------------- | ----------- | ----------- | ----------- |
| Card compacto | `p-3`       | `p-4`       | `p-6`       |
| Card normal   | `p-4`       | `p-5`       | `p-8`       |
| Seção interna | `space-y-2` | `space-y-3` | `space-y-4` |

---

## ✅ Checklist Mobile-First

Ao criar um novo componente, verificar:

### Layout

- [ ] `flex-col sm:flex-row` para layouts que devem ser verticais em mobile
- [ ] `w-full sm:w-auto` para botões que devem ser full-width em mobile
- [ ] `min-w-0` em containers flex para permitir truncate
- [ ] `shrink-0` em elementos fixos (avatares, ícones)

### Tipografia

- [ ] Fontes menores em mobile: `text-sm sm:text-base lg:text-lg`
- [ ] `truncate` em textos que podem ser longos
- [ ] `leading-tight` para economizar altura em mobile

### Espaçamento

- [ ] Padding menor em mobile: `p-3 sm:p-4 lg:p-6`
- [ ] Gap menor em mobile: `gap-2 sm:gap-3 lg:gap-4`
- [ ] Margin/space menor: `space-y-2 sm:space-y-3`

### Componentes

- [ ] Avatares menores: `h-10 w-10 sm:h-12 sm:w-12`
- [ ] Ícones menores: `h-4 w-4 sm:h-5 sm:w-5`
- [ ] Botões menores: `h-8 sm:h-9`

### Alinhamento

- [ ] Centralizar em mobile quando vertical: `mx-auto sm:mx-0 text-center sm:text-left`
- [ ] `items-start` em flex para evitar elementos esticados

### Performance

- [ ] Evitar empilhar muitos elementos (aumenta altura)
- [ ] Preferir 1 linha com elementos compactos
- [ ] Usar textos curtos em botões mobile

---

## 🧪 Como Testar

### DevTools (F12 → Ctrl+Shift+M)

```
Testar nos seguintes tamanhos:

320px  - iPhone SE (old)
375px  - iPhone SE, iPhone 12 mini
390px  - iPhone 13/14
414px  - iPhone 14 Plus
768px  - iPad Mini
1024px - iPad Pro / Desktop
1920px - Desktop Full HD
```

### Verificar Overflow Horizontal

```javascript
// Console do navegador (em cada breakpoint)
document.documentElement.scrollWidth === document.documentElement.clientWidth;
// ✅ true = sem overflow
// ❌ false = tem overflow (PROBLEMA!)
```

### Verificar Altura dos Cards

```javascript
const cards = document.querySelectorAll('[class*="Card"]');
cards.forEach((card, i) => {
  console.log(`Card ${i}: ${card.offsetHeight}px`);
});

// Objetivo: Cards em mobile devem ser < 200px idealmente
```

---

## 📚 Referências

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile-First CSS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)
- [Touch Target Size](https://web.dev/tap-targets/) - Mínimo 44x44px para botões
- [Readable Font Sizes](https://web.dev/font-size/) - Mínimo 12px
