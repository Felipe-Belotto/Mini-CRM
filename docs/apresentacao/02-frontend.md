# Frontend - Mini CRM SDR

## 🎨 Stack Tecnológica

### Core
- **Next.js 16.1.1** - Framework React com App Router
- **React 19.2.3** - Biblioteca UI
- **TypeScript 5** - Tipagem estática

### Estilização
- **Tailwind CSS 4** - Framework CSS utility-first
- **Radix UI** - 49 componentes acessíveis e sem estilos
- **Lucide React** - Biblioteca de ícones
- **class-variance-authority** - Variantes de componentes
- **clsx + tailwind-merge** - Utilitários para classes CSS

### Formulários e Validação
- **React Hook Form** - Gerenciamento de formulários (performance)
- **Zod** - Schema validation (type-safe)
- **@hookform/resolvers** - Integração RHF + Zod

### Interatividade
- **@dnd-kit** - Drag and drop para Kanban
  - `@dnd-kit/core` - Core
  - `@dnd-kit/sortable` - Sortable
  - `@dnd-kit/utilities` - Utilitários

### Estado e Dados
- **TanStack Query** - Gerenciamento de estado servidor
  - Cache automático
  - Sincronização
  - Loading states
- **Supabase Client** - Comunicação com backend

### Utilitários
- **date-fns** - Manipulação de datas
- **cmdk** - Command menu (⌘K)
- **sonner** - Toast notifications
- **vaul** - Drawer component
- **recharts** - Gráficos e visualizações
- **react-resizable-panels** - Painéis redimensionáveis

---

## 🏗️ Arquitetura Frontend

### Next.js App Router

O projeto utiliza o **App Router** do Next.js 16, que oferece:

- ✅ **Server Components** por padrão
- ✅ **Server Actions** para operações de servidor
- ✅ **Route Groups** para organização (`(auth)`, `(dashboard)`)
- ✅ **Layouts aninhados** para estrutura consistente
- ✅ **Loading e Error boundaries** nativos

### Estrutura de Rotas

```
app/
├── (auth)/              # Grupo de rotas de autenticação
│   ├── layout.tsx       # Layout sem sidebar
│   ├── login/
│   ├── signup/
│   └── auth/confirm/
│
├── (dashboard)/         # Grupo de rotas do dashboard
│   ├── layout.tsx       # Layout com sidebar e header
│   ├── page.tsx         # Dashboard principal
│   ├── pipeline/        # Kanban de leads
│   ├── campanhas/       # Gestão de campanhas
│   └── configuracoes/   # Configurações
│
├── invites/             # Sistema de convites
└── onboarding/         # Onboarding
```

### Server Components vs Client Components

#### Server Components (padrão)
- Renderização no servidor
- Acesso direto ao banco de dados
- Sem JavaScript no cliente
- Melhor performance inicial

```typescript
// app/(dashboard)/pipeline/page.tsx
export default async function PipelinePage() {
  const workspace = await getCurrentWorkspaceAction();
  const leads = await getLeadsAction(workspace.id);
  
  return <PipelineUI leads={leads} />;
}
```

#### Client Components (quando necessário)
- Interatividade (onClick, useState, etc.)
- Hooks do React
- Eventos do browser

```typescript
"use client";

export function PipelineUI({ leads }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  return (
    <KanbanBoard 
      leads={leads}
      onLeadClick={setSelectedLead}
    />
  );
}
```

---

## 🎨 Sistema de Design

### Componentes Base (Radix UI)

49 componentes do Radix UI como base, customizados com Tailwind:

- **Formulários**: Input, Select, Checkbox, Radio, Textarea
- **Overlays**: Dialog, Popover, Dropdown, Tooltip
- **Navegação**: Tabs, Accordion, Navigation Menu
- **Feedback**: Toast, Alert Dialog, Progress
- **Layout**: Separator, Scroll Area, Aspect Ratio

### Exemplo de Componente Customizado

```typescript
// shared/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### Tema e Cores

- **Dark/Light mode** com `next-themes`
- **Paletas de cores** customizáveis por workspace
- **Variáveis CSS** para cores do sistema
- **Tailwind config** com cores personalizadas

---

## 📝 Formulários

### React Hook Form + Zod

**Por que esta combinação?**

- ✅ **Performance**: Menos re-renders (uncontrolled components)
- ✅ **Type-safety**: Validação com TypeScript
- ✅ **DX**: API simples e intuitiva
- ✅ **Validação**: No cliente e servidor (mesmo schema)

### Exemplo de Formulário

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
});

type LeadFormData = z.infer<typeof leadSchema>;

export function LeadForm() {
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    await createLeadAction(data);
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("name")} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
      {/* ... */}
    </form>
  );
}
```

---

## 🎯 Drag and Drop (Kanban)

### @dnd-kit

**Por que @dnd-kit?**

- ✅ **Moderno**: Biblioteca atual e mantida
- ✅ **Acessível**: Suporte a acessibilidade
- ✅ **Performático**: Otimizado para React
- ✅ **Flexível**: API poderosa e extensível

### Implementação do Kanban

```typescript
"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

export function KanbanBoard({ leads }: Props) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const leadId = active.id as string;
    const newStage = over.id as KanbanStage;
    
    await moveLeadAction(leadId, newStage);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {stages.map((stage) => (
        <SortableContext key={stage.id} items={stage.leads}>
          <KanbanColumn stage={stage} />
        </SortableContext>
      ))}
    </DndContext>
  );
}
```

### Funcionalidades do Kanban

- ✅ **Drag and drop** entre colunas
- ✅ **Reordenação** dentro da mesma coluna
- ✅ **Feedback visual** durante o drag
- ✅ **Validação** antes de mover (campos obrigatórios)
- ✅ **Otimista updates** para melhor UX

---

## 🔄 Gerenciamento de Estado

### TanStack Query

**Por que TanStack Query?**

- ✅ **Cache automático**: Dados cacheados e sincronizados
- ✅ **Loading states**: Estados de loading/error automáticos
- ✅ **Refetch inteligente**: Revalidação automática
- ✅ **Otimistic updates**: Atualizações otimistas

### Exemplo de Uso

```typescript
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

export function LeadsList() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => getLeadsAction(),
  });

  const mutation = useMutation({
    mutationFn: createLeadAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      {leads?.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
```

### Estado Local vs Servidor

- **Estado Local**: `useState`, `useReducer` para UI state
- **Estado Servidor**: TanStack Query para dados do servidor
- **Estado Global**: Context API apenas quando necessário

---

## 🎨 Componentes Principais

### Layout Components

```typescript
// shared/components/layout/
├── Header.tsx              # Header com navegação
├── Sidebar.tsx             # Sidebar com menu
├── WorkspaceSwitcher.tsx   # Seletor de workspace
└── UserMenu.tsx            # Menu do usuário
```

### Feature Components

Cada feature tem seus próprios componentes:

```typescript
// features/leads/components/
├── PipelineUI.tsx          # Kanban principal
├── LeadCard.tsx            # Card do lead
├── LeadDetails.tsx         # Detalhes do lead
├── LeadForm.tsx            # Formulário de lead
├── LeadMessagesTab.tsx    # Aba de mensagens
└── ... (20 componentes)
```

### UI Components (Base)

```typescript
// shared/components/ui/
├── button.tsx
├── input.tsx
├── dialog.tsx
├── select.tsx
└── ... (49 componentes)
```

---

## ⚡ Performance e Otimizações

### Code Splitting

- **Route-based**: Cada rota é um chunk separado
- **Component-based**: Lazy loading de componentes pesados
- **Dynamic imports**: Carregamento sob demanda

```typescript
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Loading />,
});
```

### Server Components

- **Menos JavaScript**: Renderização no servidor
- **Melhor SEO**: HTML completo no servidor
- **Performance**: Menos trabalho no cliente

### Otimizações de Imagens

- **next/image**: Otimização automática
- **Lazy loading**: Carregamento sob demanda
- **Formato WebP**: Melhor compressão

### Carregamento Paralelo

```typescript
// Carregar dados em paralelo
const [leads, campaigns, users] = await Promise.all([
  getLeadsAction(),
  getCampaignsAction(),
  getUsersAction(),
]);
```

### useTransition para UI Não Bloqueante

```typescript
const [isPending, startTransition] = useTransition();

const handleAction = () => {
  startTransition(() => {
    // Atualizações não bloqueiam UI
    updateState();
  });
};
```

---

## 🎯 Padrões e Boas Práticas

### Composição de Componentes

```typescript
// Componente composto
<Dialog>
  <DialogTrigger>Abrir</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
    </DialogHeader>
    <DialogBody>Conteúdo</DialogBody>
  </DialogContent>
</Dialog>
```

### Error Boundaries

```typescript
// Tratamento de erros
try {
  await action();
} catch (error) {
  toast.error("Erro ao executar ação");
  console.error(error);
}
```

### Loading States

```typescript
// Estados de loading consistentes
{isLoading && <Loading />}
{error && <Error message={error} />}
{data && <Content data={data} />}
```

### Acessibilidade

- ✅ **ARIA labels** em componentes interativos
- ✅ **Keyboard navigation** em todos os componentes
- ✅ **Focus management** em modais e dialogs
- ✅ **Screen reader** support via Radix UI

---

## 📊 Métricas do Frontend

- **49 componentes** base (Radix UI)
- **~100+ componentes** totais (base + específicos)
- **9 features** com componentes próprios
- **~30+ hooks** personalizados
- **TypeScript 100%** - Cobertura completa de tipos
- **Bundle size**: Otimizado com code splitting

---

## 🎯 Conclusão

O frontend foi desenvolvido com foco em:

- ✅ **Performance**: Server Components, code splitting, otimizações
- ✅ **DX (Developer Experience)**: TypeScript, componentes reutilizáveis
- ✅ **UX (User Experience)**: Feedback visual, loading states, acessibilidade
- ✅ **Manutenibilidade**: Arquitetura clara, componentes bem organizados
- ✅ **Escalabilidade**: Estrutura que suporta crescimento

A combinação de Next.js 16, React 19, TypeScript e uma arquitetura bem definida resulta em uma aplicação moderna, performática e fácil de manter.
