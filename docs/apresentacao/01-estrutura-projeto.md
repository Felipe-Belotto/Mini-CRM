# Estrutura do Projeto - Mini CRM SDR

## 🏗️ Arquitetura Vertical Sliced (Feature-Based)

### Por que escolhi esta arquitetura?

A arquitetura Vertical Sliced organiza o código por **funcionalidades de negócio** ao invés de por camadas técnicas, promovendo:

- ✅ **Alta Coesão**: Todos os arquivos relacionados a uma feature ficam próximos
- ✅ **Baixo Acoplamento**: Features dependem principalmente de código compartilhado
- ✅ **Autonomia**: Cada feature evolui independentemente
- ✅ **Manutenibilidade**: Facilita localização e modificação de código
- ✅ **Escalabilidade**: Novas features podem ser adicionadas sem impactar existentes

### Princípios Fundamentais

1. **Organização por Features**: Cada funcionalidade de negócio agrupada em sua própria pasta
2. **Alta Coesão**: Componentes, lógica, tipos e utilitários da mesma feature juntos
3. **Baixo Acoplamento**: Features dependem de `shared`, não entre si
4. **Autonomia**: Features podem evoluir independentemente

---

## 📁 Estrutura de Diretórios

```
mini-crm/
├── src/
│   ├── app/                    # Rotas Next.js (App Router)
│   │   ├── (auth)/            # Rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── auth/confirm/
│   │   ├── (dashboard)/       # Rotas do dashboard (protegidas)
│   │   │   ├── page.tsx       # Dashboard principal
│   │   │   ├── pipeline/     # Kanban de leads
│   │   │   ├── campanhas/     # Gestão de campanhas
│   │   │   └── configuracoes/ # Configurações do workspace
│   │   ├── invites/           # Sistema de convites
│   │   └── onboarding/       # Onboarding de novos usuários
│   │
│   ├── features/              # Features do negócio (organização vertical)
│   │   ├── auth/              # Autenticação e onboarding
│   │   │   ├── actions/       # Server Actions
│   │   │   ├── components/    # Componentes específicos
│   │   │   ├── hooks/         # Hooks personalizados
│   │   │   └── lib/           # Utilitários específicos
│   │   │
│   │   ├── workspaces/        # Workspaces e membros
│   │   ├── leads/             # Gestão de leads
│   │   ├── campaigns/         # Campanhas de marketing
│   │   ├── ai-messages/       # Geração de mensagens IA
│   │   ├── custom-fields/     # Campos personalizados
│   │   ├── pipeline-config/   # Configuração do funil
│   │   ├── dashboard/         # Dashboard e métricas
│   │   └── activities/        # Histórico de atividades
│   │
│   └── shared/                # Código compartilhado entre features
│       ├── components/        # Componentes UI reutilizáveis
│       │   ├── layout/        # Componentes de layout
│       │   └── ui/            # Componentes base (Radix UI)
│       ├── hooks/             # Hooks reutilizáveis
│       ├── lib/               # Utilitários gerais
│       │   ├── supabase/      # Clientes Supabase
│       │   └── utils.ts       # Funções utilitárias
│       └── types/             # Tipos TypeScript compartilhados
│
├── supabase/
│   ├── functions/             # Edge Functions (Deno/TypeScript)
│   │   ├── generate-ai-messages/  # Geração de mensagens IA
│   │   └── send-workspace-invite/ # Envio de convites
│   └── migrations/           # Migrations SQL versionadas
│       ├── 20260111014411_extensions.sql
│       ├── 20260111014430_profiles.sql
│       ├── 20260111014505_workspaces.sql
│       └── ... (24 migrations no total)
│
├── public/                    # Arquivos estáticos
├── docs/                      # Documentação
└── package.json
```

---

## 🎯 Estrutura de uma Feature

Cada feature segue o mesmo padrão:

```
features/[feature-name]/
├── actions/                   # Server Actions
│   └── [feature]-actions.ts  # Todas as ações do servidor
├── components/               # Componentes específicos
│   └── [Component].tsx
├── hooks/                    # Hooks personalizados
│   └── use-[hook].ts
├── lib/                      # Utilitários específicos
│   └── [feature]-utils.ts
└── types/                    # Tipos específicos (opcional)
    └── index.ts
```

### Exemplo: Feature `leads`

```
features/leads/
├── actions/
│   ├── leads.ts              # CRUD de leads
│   ├── messages.ts           # Mensagens enviadas
│   └── upload-avatar.ts      # Upload de avatar
├── components/
│   ├── PipelineUI.tsx        # Kanban principal
│   ├── LeadCard.tsx          # Card do lead
│   ├── LeadDetails.tsx       # Detalhes do lead
│   ├── LeadMessagesTab.tsx  # Aba de mensagens
│   └── ... (20 componentes)
├── hooks/
│   ├── use-kanban-board.tsx  # Hook do Kanban
│   ├── use-lead-form.ts      # Hook do formulário
│   └── ... (14 hooks)
└── lib/
    ├── lead-utils.ts         # Utilitários de leads
    └── ... (6 arquivos)
```

---

## 🔄 Fluxo de Dados

### Server Actions Pattern

Todas as operações de servidor são feitas via **Server Actions** do Next.js:

```
Componente (Cliente)
    ↓
Server Action (features/[feature]/actions/)
    ↓
Supabase Client (shared/lib/supabase/server)
    ↓
PostgreSQL (com RLS)
    ↓
Resposta tipada
```

### Exemplo de Server Action

```typescript
// features/leads/actions/leads.ts
"use server";

export async function createLeadAction(
  lead: Omit<Lead, "id" | "createdAt" | "updatedAt">
): Promise<Lead> {
  // 1. Validação
  await requireAuth();
  const workspace = await getCurrentWorkspace();
  
  // 2. Autorização
  await hasWorkspaceAccess(workspace.id);
  
  // 3. Operação
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({ ...lead, workspace_id: workspace.id })
    .select()
    .single();
  
  // 4. Revalidação
  revalidatePath("/pipeline");
  
  return mapDbLeadToLead(data);
}
```

---

## 📊 Organização por Features

### 9 Features Principais

1. **auth** - Autenticação e onboarding
   - Login, signup, confirmação de email
   - Onboarding de usuário e workspace

2. **workspaces** - Workspaces e membros
   - Criação de workspaces
   - Gestão de membros
   - Sistema de convites

3. **leads** - Gestão de leads
   - CRUD de leads
   - Kanban com drag and drop
   - Upload de avatares
   - Mensagens enviadas

4. **campaigns** - Campanhas de marketing
   - Criação e edição de campanhas
   - Configuração de contexto e prompts
   - Etapa gatilho

5. **ai-messages** - Geração de mensagens IA
   - Geração manual de mensagens
   - Geração automática por gatilho
   - Integração com Edge Function

6. **custom-fields** - Campos personalizados
   - Criação de campos customizados
   - Tipos: text, number, select, date
   - Ordenação e reordenação

7. **pipeline-config** - Configuração do funil
   - Criação/edição de etapas
   - Configuração de campos obrigatórios
   - Paletas de cores

8. **dashboard** - Dashboard e métricas
   - Métricas do workspace
   - Gráficos e visualizações
   - Leads por etapa/responsável

9. **activities** - Histórico de atividades
   - Log de ações nos leads
   - Timeline visual
   - Histórico do workspace

---

## 🔗 Código Compartilhado (shared)

### Quando usar `shared`?

- ✅ Código usado por **2+ features**
- ✅ Componentes **genéricos e reutilizáveis**
- ✅ Utilitários **puros** (sem lógica de negócio)
- ✅ Tipos **compartilhados** entre features

### O que NÃO colocar em `shared`?

- ❌ Código usado por apenas uma feature
- ❌ Lógica de negócio específica
- ❌ Código "que pode ser útil no futuro" (YAGNI)

### Estrutura do `shared`

```
shared/
├── components/
│   ├── layout/               # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── WorkspaceSwitcher.tsx
│   └── ui/                  # Base UI components (Radix)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ... (49 componentes)
├── hooks/
│   ├── use-auth.ts          # Hook de autenticação
│   ├── use-workspace.ts     # Hook de workspace
│   └── use-toast.ts         # Hook de notificações
├── lib/
│   ├── supabase/            # Clientes Supabase
│   │   ├── server.ts        # Cliente servidor
│   │   ├── client.ts        # Cliente browser
│   │   └── utils.ts         # Utilitários Supabase
│   ├── workspace-utils.ts   # Utilitários de workspace
│   ├── lead-utils.ts        # Utilitários de leads
│   └── utils.ts             # Utilitários gerais
└── types/
    ├── crm.ts               # Tipos do CRM
    └── supabase.ts          # Tipos gerados do Supabase
```

---

## 🎨 Convenções de Código

### Nomenclatura

- **Features**: kebab-case (`lead-management`, `user-profile`)
- **Arquivos**: kebab-case (`lead-card.tsx`, `user-actions.ts`)
- **Componentes**: PascalCase (`LeadCard`, `UserProfile`)
- **Funções**: camelCase (`fetchUserData`, `validateInput`)
- **Server Actions**: camelCase terminando com `Action` (`createUserAction`)
- **Hooks**: camelCase iniciando com `use` (`useUserData`)
- **Types/Interfaces**: PascalCase (`User`, `LeadData`)

### Imports

- Use paths absolutos configurados: `@/shared/...`, `@/features/...`
- Ordene imports: bibliotecas externas → código interno
- Evite imports circulares

### Server Actions

- Sempre em `features/[feature]/actions/`
- Diretiva `"use server"` no topo do arquivo
- Validação com Zod
- Tratamento de erros consistente
- Revalidação de cache com `revalidatePath`

---

## 📈 Benefícios da Arquitetura

### Para Desenvolvimento

- ✅ **Localização rápida**: Tudo de uma feature em um lugar
- ✅ **Menos conflitos**: Features independentes
- ✅ **Onboarding facilitado**: Estrutura clara e consistente
- ✅ **Refatoração segura**: Mudanças isoladas por feature

### Para Manutenção

- ✅ **Alta coesão**: Código relacionado junto
- ✅ **Baixo acoplamento**: Mudanças não propagam
- ✅ **Testabilidade**: Features testáveis isoladamente
- ✅ **Documentação implícita**: Estrutura documenta organização

### Para Escalabilidade

- ✅ **Novas features**: Adicionar sem impactar existentes
- ✅ **Time splitting**: Múltiplos devs em features diferentes
- ✅ **Deploy incremental**: Features podem ser deployadas separadamente
- ✅ **Performance**: Code splitting natural por feature

---

## 🔍 Exemplo Prático: Adicionar Nova Feature

### 1. Criar estrutura de diretórios
```
features/nova-feature/
├── actions/
├── components/
├── hooks/
└── lib/
```

### 2. Criar Server Actions
```typescript
// features/nova-feature/actions/nova-feature.ts
"use server";

export async function criarAlgoAction(input: Input) {
  // Validação, autorização, operação
}
```

### 3. Criar componentes
```typescript
// features/nova-feature/components/NovaFeatureUI.tsx
export function NovaFeatureUI() {
  // Usa componentes de shared/components/ui
}
```

### 4. Integrar nas rotas
```typescript
// app/(dashboard)/nova-feature/page.tsx
import { NovaFeatureUI } from "@/features/nova-feature/components/NovaFeatureUI";
```

---

## 📊 Métricas da Estrutura

- **9 features** principais
- **~30+ Server Actions** organizadas por feature
- **~100+ componentes** (49 base + específicos)
- **24 migrations** SQL versionadas
- **2 Edge Functions** para operações serverless
- **0 dependências** entre features (apenas via `shared`)

---

## 🎯 Conclusão

A arquitetura Vertical Sliced proporciona:

- ✅ **Organização clara** por funcionalidades de negócio
- ✅ **Manutenibilidade** através de alta coesão
- ✅ **Escalabilidade** com baixo acoplamento
- ✅ **Produtividade** com estrutura consistente

Esta organização facilita tanto o desenvolvimento quanto a manutenção do projeto, permitindo que diferentes desenvolvedores trabalhem em features diferentes sem conflitos frequentes.
