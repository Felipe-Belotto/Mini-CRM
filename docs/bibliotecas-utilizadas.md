# Bibliotecas e Dependências Utilizadas

## 📦 Dependências Principais (package.json)

### Frontend Core
- **next** `16.1.1` - Framework React com App Router
- **react** `19.2.3` - Biblioteca UI
- **react-dom** `19.2.3` - React DOM renderer
- **typescript** `^5` - Tipagem estática

### UI e Estilização
- **tailwindcss** `^4` - Framework CSS utility-first
- **@tailwindcss/postcss** `^4` - PostCSS para Tailwind
- **tailwindcss-animate** `^1.0.7` - Animações Tailwind
- **tailwind-merge** `^2.6.0` - Merge de classes Tailwind
- **class-variance-authority** `^0.7.1` - Variantes de componentes
- **clsx** `^2.1.1` - Utilitário para classes condicionais

### Componentes UI (Radix UI)
- **@radix-ui/react-accordion** `^1.2.11` - Accordion
- **@radix-ui/react-alert-dialog** `^1.1.14` - Alert Dialog
- **@radix-ui/react-aspect-ratio** `^1.1.7` - Aspect Ratio
- **@radix-ui/react-avatar** `^1.1.10` - Avatar
- **@radix-ui/react-checkbox** `^1.3.2` - Checkbox
- **@radix-ui/react-collapsible** `^1.1.11` - Collapsible
- **@radix-ui/react-context-menu** `^2.2.15` - Context Menu
- **@radix-ui/react-dialog** `^1.1.14` - Dialog/Modal
- **@radix-ui/react-dropdown-menu** `^2.1.15` - Dropdown Menu
- **@radix-ui/react-hover-card** `^1.1.14` - Hover Card
- **@radix-ui/react-label** `^2.1.7` - Label
- **@radix-ui/react-menubar** `^1.1.15` - Menubar
- **@radix-ui/react-navigation-menu** `^1.2.13` - Navigation Menu
- **@radix-ui/react-popover** `^1.1.14` - Popover
- **@radix-ui/react-progress** `^1.1.7` - Progress Bar
- **@radix-ui/react-radio-group** `^1.3.7` - Radio Group
- **@radix-ui/react-scroll-area** `^1.2.9` - Scroll Area
- **@radix-ui/react-select** `^2.2.5` - Select
- **@radix-ui/react-separator** `^1.1.7` - Separator
- **@radix-ui/react-slider** `^1.3.5` - Slider
- **@radix-ui/react-slot** `^1.2.3` - Slot (composição)
- **@radix-ui/react-switch** `^1.2.5` - Switch
- **@radix-ui/react-tabs** `^1.1.12` - Tabs
- **@radix-ui/react-toast** `^1.2.14` - Toast/Notifications
- **@radix-ui/react-toggle** `^1.1.9` - Toggle
- **@radix-ui/react-toggle-group** `^1.1.10` - Toggle Group
- **@radix-ui/react-tooltip** `^1.2.7` - Tooltip

### Formulários e Validação
- **react-hook-form** `^7.61.1` - Gerenciamento de formulários
- **@hookform/resolvers** `^3.10.0` - Resolvers para validação
- **zod** `^3.25.76` - Schema validation

### Drag and Drop
- **@dnd-kit/core** `^6.3.1` - Core do dnd-kit
- **@dnd-kit/sortable** `^10.0.0` - Sortable para drag and drop
- **@dnd-kit/utilities** `^3.2.2` - Utilitários do dnd-kit

### Estado e Dados
- **@tanstack/react-query** `^5.83.0` - Gerenciamento de estado servidor
- **@supabase/ssr** `^0.8.0` - Supabase para SSR
- **@supabase/supabase-js** `^2.90.1` - Cliente Supabase

### Utilitários
- **date-fns** `^3.6.0` - Manipulação de datas
- **lucide-react** `^0.462.0` - Biblioteca de ícones
- **next-themes** `^0.3.0` - Gerenciamento de tema (dark/light)
- **cmdk** `^1.1.1` - Command menu (⌘K)
- **sonner** `^1.7.4` - Toast notifications
- **vaul** `^0.9.9` - Drawer component
- **input-otp** `^1.4.2` - Input OTP (One-Time Password)
- **react-day-picker** `^8.10.1` - Date picker
- **embla-carousel-react** `^8.6.0` - Carousel
- **react-resizable-panels** `^2.1.9` - Resizable panels
- **recharts** `^2.15.4` - Gráficos e visualizações

### DevDependencies
- **@biomejs/biome** `2.2.0` - Linter e formatter
- **@types/node** `^20` - Tipos TypeScript para Node.js
- **@types/react** `^19` - Tipos TypeScript para React
- **@types/react-dom** `^19` - Tipos TypeScript para React DOM
- **husky** `^9.1.7` - Git hooks

---

## 🔧 Categorização por Uso

### Componentes UI Base
- Radix UI (49 componentes) - Base para todos os componentes de interface
- Tailwind CSS - Estilização
- Lucide React - Ícones

### Interatividade
- React Hook Form - Formulários
- Zod - Validação
- @dnd-kit - Drag and drop (Kanban)

### Estado e Dados
- TanStack Query - Cache e sincronização com servidor
- Supabase Client - Comunicação com backend

### Utilitários
- date-fns - Datas
- clsx + tailwind-merge - Classes CSS
- class-variance-authority - Variantes de componentes

### Visualizações
- Recharts - Gráficos
- Embla Carousel - Carrossel

### UX/UI Avançado
- cmdk - Command menu
- sonner - Notificações
- vaul - Drawer
- react-resizable-panels - Painéis redimensionáveis

---

## 📊 Estatísticas

- **Total de dependências**: ~70
- **Componentes Radix UI**: 49
- **Bibliotecas principais**: 15
- **DevDependencies**: 5

---

## 🎯 Bibliotecas-Chave por Funcionalidade

### Autenticação
- `@supabase/ssr` - Autenticação SSR
- `@supabase/supabase-js` - Cliente Supabase

### Formulários
- `react-hook-form` - Gerenciamento
- `zod` - Validação
- `@hookform/resolvers` - Integração

### UI Components
- `@radix-ui/*` - Componentes base
- `tailwindcss` - Estilização
- `lucide-react` - Ícones

### Drag and Drop
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

### Estado
- `@tanstack/react-query` - Estado servidor
- React hooks nativos - Estado local

### Utilitários
- `date-fns` - Datas
- `clsx` + `tailwind-merge` - Classes
- `class-variance-authority` - Variantes

---

## 🔍 Por que Cada Biblioteca?

### Radix UI
- **Por quê**: Componentes acessíveis, sem estilos, composáveis
- **Alternativa considerada**: shadcn/ui (que usa Radix por baixo)

### React Hook Form + Zod
- **Por quê**: Performance (menos re-renders), validação type-safe
- **Alternativa considerada**: Formik (mais verboso)

### @dnd-kit
- **Por quê**: Moderno, performático, acessível
- **Alternativa considerada**: react-beautiful-dnd (deprecated)

### TanStack Query
- **Por quê**: Cache automático, sincronização, loading states
- **Alternativa considerada**: SWR (similar, mas Query mais completo)

### date-fns
- **Por quê**: Leve, modular, tree-shakeable
- **Alternativa considerada**: moment.js (muito pesado)

---

## 📝 Notas de Versão

### Next.js 16.1.1
- App Router estável
- Server Actions nativo
- React Server Components

### React 19.2.3
- Versão mais recente
- Melhorias de performance
- Suporte a Server Components

### TypeScript 5
- Tipagem mais forte
- Melhor inferência
- Novos recursos

---

**Todas as bibliotecas foram escolhidas considerando:**
- ✅ Performance
- ✅ Bundle size
- ✅ Manutenibilidade
- ✅ Comunidade ativa
- ✅ TypeScript support
- ✅ Acessibilidade
