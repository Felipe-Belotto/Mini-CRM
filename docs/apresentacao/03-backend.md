# Backend - Mini CRM SDR

## 🏗️ Arquitetura Backend

### Supabase como Backend as a Service

O projeto utiliza **Supabase** como plataforma completa de backend, oferecendo:

- ✅ **PostgreSQL** - Banco de dados relacional
- ✅ **Supabase Auth** - Sistema de autenticação
- ✅ **Supabase Storage** - Armazenamento de arquivos
- ✅ **Edge Functions** - Funções serverless (Deno/TypeScript)
- ✅ **Row Level Security (RLS)** - Segurança no banco de dados
- ✅ **Realtime** - Subscriptions em tempo real (não utilizado neste projeto)

---

## 🗄️ Banco de Dados (PostgreSQL)

### Por que PostgreSQL?

- ✅ **Relacional**: Adequado para dados estruturados (leads, campanhas, workspaces)
- ✅ **JSONB**: Suporte nativo para campos flexíveis (campos personalizados)
- ✅ **RLS nativo**: Row Level Security para multi-tenancy seguro
- ✅ **Performance**: Índices otimizados e queries eficientes
- ✅ **Migrations versionadas**: Controle de versão do schema

### Estrutura do Banco

#### Tabelas Principais

```sql
-- Workspaces e Multi-tenancy
workspaces              -- Workspaces (empresas/equipes)
workspace_members       -- Membros e papéis (owner, admin, member)
workspace_invites       -- Sistema de convites

-- Leads e Gestão
leads                   -- Dados dos leads
custom_fields           -- Campos personalizados por workspace
lead_activities        -- Histórico de atividades
lead_messages_sent      -- Mensagens enviadas
lead_ai_suggestions     -- Mensagens geradas automaticamente

-- Campanhas e Pipeline
campaigns               -- Campanhas de marketing
pipeline_stages         -- Etapas do funil (customizáveis)
pipeline_configs        -- Configuração de campos obrigatórios

-- Suporte
profiles                -- Perfis de usuários
color_palettes          -- Paletas de cores customizáveis
```

### Schema de Exemplo: Tabela `leads`

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Campos básicos
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  
  -- Campos adicionais
  segment TEXT,
  revenue TEXT,
  linkedin TEXT,
  notes TEXT,
  origin TEXT,
  avatar_url TEXT,
  
  -- Pipeline
  stage TEXT NOT NULL DEFAULT 'base',
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Campos personalizados (JSONB)
  custom_fields JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### JSONB para Campos Personalizados

**Por que JSONB?**

- ✅ **Flexibilidade**: Schema dinâmico sem migrations
- ✅ **Performance**: Índices e queries eficientes
- ✅ **Validação**: Pode validar estrutura no código
- ✅ **Query**: Suporte a queries JSONB no PostgreSQL

```sql
-- Exemplo de query com JSONB
SELECT * FROM leads
WHERE custom_fields->>'faturamento_anual' > '1000000';
```

### Índices e Performance

```sql
-- Índices principais
CREATE INDEX leads_workspace_id_idx ON leads(workspace_id);
CREATE INDEX leads_stage_idx ON leads(stage);
CREATE INDEX leads_responsible_id_idx ON leads(responsible_id);
CREATE INDEX leads_created_at_idx ON leads(created_at DESC);

-- Índice GIN para JSONB (queries em campos personalizados)
CREATE INDEX leads_custom_fields_gin_idx ON leads USING GIN (custom_fields);
```

---

## 🔒 Row Level Security (RLS)

### O que é RLS?

**Row Level Security** é um recurso do PostgreSQL que permite definir políticas de segurança no nível de linha, garantindo que usuários só vejam/modifiquem dados aos quais têm acesso.

### Como Implementado

#### 1. Todas as tabelas têm `workspace_id`

```sql
-- Exemplo: tabela leads
workspace_id UUID NOT NULL REFERENCES workspaces(id)
```

#### 2. Políticas RLS por tabela

```sql
-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política: Membros podem ver leads do workspace
CREATE POLICY "Members can view leads"
ON leads FOR SELECT
USING (is_workspace_member(workspace_id));

-- Política: Membros podem criar leads
CREATE POLICY "Members can create leads"
ON leads FOR INSERT
WITH CHECK (
  is_workspace_member(workspace_id)
  AND workspace_id = current_setting('app.current_workspace_id')::uuid
);
```

#### 3. Funções Helper

```sql
-- Verificar se usuário é membro do workspace
CREATE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Verificar se usuário é admin ou owner
CREATE FUNCTION is_workspace_admin_or_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### Vantagens do RLS

- ✅ **Segurança no banco**: Impossível bypassar via código
- ✅ **Isolamento garantido**: Multi-tenancy seguro
- ✅ **Performance**: Filtros automáticos nas queries
- ✅ **Manutenibilidade**: Políticas centralizadas

### Desafio Resolvido: Criação de Workspace

**Problema**: Owner não conseguia ver workspace imediatamente após criação (SELECT falhava antes do trigger adicionar como membro).

**Solução**: Política adicional que permite owner ver por `owner_id` diretamente:

```sql
CREATE POLICY "Owners can view their own workspaces"
ON workspaces FOR SELECT
USING (owner_id = auth.uid());
```

---

## 🔐 Autenticação (Supabase Auth)

### Fluxo de Autenticação

1. **Signup**: Usuário cria conta
2. **Email Confirmation**: Confirmação via email
3. **Login**: Autenticação com email/senha
4. **JWT Token**: Token gerado e armazenado
5. **Session**: Sessão mantida no cliente

### Integração com Frontend

```typescript
// shared/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Actions com Autenticação

```typescript
// shared/lib/supabase/utils.ts
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Não autenticado");
  }
  
  return user;
}
```

---

## 📦 Storage (Supabase Storage)

### Uso no Projeto

- **Avatares de leads**: Upload de imagens de perfil
- **Logos de workspaces**: Upload de logos

### Exemplo de Upload

```typescript
// features/leads/actions/upload-avatar.ts
export async function uploadLeadAvatarAction(
  leadId: string,
  file: File
): Promise<string> {
  const supabase = await createClient();
  
  // Upload para storage
  const { data, error } = await supabase.storage
    .from("lead-avatars")
    .upload(`${leadId}/${file.name}`, file);
  
  if (error) throw error;
  
  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from("lead-avatars")
    .getPublicUrl(data.path);
  
  return publicUrl;
}
```

---

## ⚡ Edge Functions

### O que são Edge Functions?

Funções serverless executadas em **Deno runtime** na edge do Supabase, ideais para:

- ✅ Operações que precisam de permissões especiais
- ✅ Integrações com APIs externas
- ✅ Processamento pesado que não deve bloquear o servidor principal

### Edge Functions Implementadas

#### 1. `generate-ai-messages`

**Função**: Geração de mensagens personalizadas usando Google Gemini AI

**Localização**: `supabase/functions/generate-ai-messages/`

**Funcionalidades**:
- Recebe dados da campanha e do lead
- Constrói prompt estruturado
- Chama API do Google Gemini
- Gera variações para WhatsApp e Email
- Retry logic para erros 503
- Retorna mensagens em JSON

**Exemplo de chamada**:

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/generate-ai-messages`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      campaign: { ... },
      lead: { ... },
      channels: ["whatsapp", "email"],
      variationsPerChannel: 2,
    }),
  }
);
```

**Retry Logic**:

```typescript
const maxRetries = 3;
const retryDelay = 2000;

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const result = await model.generateContent(prompt);
    return result;
  } catch (error) {
    if (error.message.includes("503") && attempt < maxRetries) {
      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * attempt)
      );
      continue;
    }
    throw error;
  }
}
```

#### 2. `send-workspace-invite`

**Função**: Envio de emails de convite para workspaces

**Localização**: `supabase/functions/send-workspace-invite/`

**Funcionalidades**:
- Gera token único para convite
- Cria registro em `workspace_invites`
- Envia email via Resend
- Template de email personalizado

---

## 🔄 Server Actions (Next.js)

### O que são Server Actions?

**Server Actions** são funções assíncronas executadas no servidor, marcadas com `"use server"`. Permitem que componentes do cliente executem operações no servidor sem criar rotas API explícitas.

### Estrutura de uma Server Action

```typescript
// features/leads/actions/leads.ts
"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import { revalidatePath } from "next/cache";

export async function createLeadAction(
  lead: Omit<Lead, "id" | "createdAt" | "updatedAt">
): Promise<Lead> {
  // 1. Autenticação
  await requireAuth();
  
  // 2. Autorização
  const workspace = await getCurrentWorkspace();
  await hasWorkspaceAccess(workspace.id);
  
  // 3. Validação
  const validated = leadSchema.parse(lead);
  
  // 4. Operação no banco
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      ...validated,
      workspace_id: workspace.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 5. Revalidação de cache
  revalidatePath("/pipeline");
  
  // 6. Retorno tipado
  return mapDbLeadToLead(data);
}
```

### Vantagens das Server Actions

- ✅ **Type-safety**: TypeScript end-to-end
- ✅ **Simplicidade**: Não precisa criar rotas API
- ✅ **Performance**: Execução no servidor
- ✅ **Segurança**: Validação e autenticação no servidor

### Organização

Todas as Server Actions estão organizadas por feature:

```
features/
├── auth/actions/
│   └── auth.ts
├── leads/actions/
│   ├── leads.ts
│   ├── messages.ts
│   └── upload-avatar.ts
├── campaigns/actions/
│   └── campaigns.ts
└── ...
```

---

## 🤖 Integração com IA (Google Gemini)

### Por que Google Gemini?

- ✅ **Modelo eficiente**: Gemini 2.5 Flash Lite oferece boa qualidade com baixo custo
- ✅ **Performance**: Respostas rápidas adequadas para produção
- ✅ **API simples**: Integração direta e confiável
- ✅ **Custo-benefício**: Adequado para geração em escala

### Arquitetura da Integração

```
Frontend (Server Action)
    ↓
Edge Function (generate-ai-messages)
    ↓
Google Gemini API
    ↓
Processamento e formatação
    ↓
Resposta JSON estruturada
```

### Estrutura do Prompt

O prompt é construído dinamicamente com:

1. **Contexto da campanha**: Descrição, produto, oferta
2. **Instruções de estilo**: Persona, tom de voz, formato
3. **Dados do lead**: Campos padrão + personalizados
4. **Dados do remetente**: Nome, cargo, empresa
5. **Instruções por canal**: WhatsApp vs Email
6. **Formato de resposta**: JSON estruturado

### Exemplo de Prompt Gerado

```
Você é um especialista em prospecção de vendas (SDR) escrevendo mensagens para WhatsApp.

CONTEXTO DA CAMPANHA:
Black Friday 2024 - Desconto de 50% em todos os produtos até 30/11

INSTRUÇÕES DE ESTILO DO USUÁRIO:
Seja consultivo e direto ao ponto. Use dados do lead para personalizar.

TOM DE VOZ DA CAMPANHA: informal

Dados do Lead:
- Nome: João Silva
- Cargo: CEO
- Empresa: TechCorp
- Segmento: Tecnologia
- Faturamento: R$ 5.000.000

INSTRUÇÕES ESPECÍFICAS PARA WHATSAPP:
- Mensagem curta e direta (máximo 3-4 parágrafos curtos)
- Pode usar emojis com moderação (1-2 no máximo)
- Linguagem conversacional
- Termine com uma pergunta ou call-to-action claro

TAREFA:
Gere exatamente 2 variações de mensagens personalizadas para WhatsApp.
```

### Geração Automática por Gatilho

Quando um lead atinge uma etapa gatilho:

1. Sistema detecta movimento para etapa gatilho
2. Busca campanhas ativas com `trigger_stage` correspondente
3. Chama `generateAutoMessagesForLeadAction()` em background
4. Salva mensagens em `lead_ai_suggestions`
5. Usuário visualiza mensagens pré-geradas ao acessar o lead

```typescript
// Processamento em background (não bloqueia UI)
async function triggerAutoMessageGeneration(
  leadId: string,
  stage: KanbanStage,
  workspaceId: string,
): Promise<void> {
  const { data: triggerCampaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .eq("trigger_stage", stage);

  // Processar em background
  Promise.all(
    triggerCampaigns.map(campaign =>
      generateAutoMessagesForLeadAction(leadId, campaign.id)
        .catch(err => console.error(err))
    )
  );
}
```

---

## 📊 Migrations

### Versionamento do Schema

Todas as mudanças no banco são versionadas via migrations SQL:

```
supabase/migrations/
├── 20260111014411_extensions.sql
├── 20260111014430_profiles.sql
├── 20260111014505_workspaces.sql
├── 20260111014535_storage.sql
├── 20260111014549_custom_fields.sql
├── 20260111014603_campaigns.sql
├── 20260111014627_pipeline_stages.sql
├── 20260111014711_leads.sql
├── 20260111015322_rls_helpers.sql
├── 20260111015338_rls_profiles.sql
├── 20260111015420_rls_workspaces.sql
├── 20260111015442_rls_custom_fields.sql
├── 20260111015453_rls_campaigns.sql
├── 20260111015508_rls_pipeline_stages.sql
├── 20260111015529_rls_leads.sql
└── ... (24 migrations no total)
```

### Estrutura de uma Migration

```sql
-- ============================================================================
-- FEATURE: LEADS
-- ============================================================================
-- Gerenciamento completo de leads do CRM
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  -- Definição da tabela
);

-- Índices
CREATE INDEX IF NOT EXISTS leads_workspace_id_idx ON leads(workspace_id);

-- Grants
GRANT ALL ON public.leads TO authenticated, anon, service_role;

-- Triggers
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE leads IS 'Gerenciamento de leads do CRM';
```

---

## 🔍 Queries e Performance

### Otimizações Implementadas

#### 1. Índices Estratégicos

```sql
-- Índices para queries frequentes
CREATE INDEX leads_workspace_id_stage_idx 
  ON leads(workspace_id, stage);

CREATE INDEX leads_workspace_id_created_at_idx 
  ON leads(workspace_id, created_at DESC);
```

#### 2. Carregamento Paralelo

```typescript
// Carregar múltiplos dados em paralelo
const [leads, campaigns, users] = await Promise.all([
  getLeadsAction(),
  getCampaignsAction(),
  getUsersAction(),
]);
```

#### 3. Queries Eficientes

```typescript
// Selecionar apenas campos necessários
const { data } = await supabase
  .from("leads")
  .select("id, name, email, stage")
  .eq("workspace_id", workspaceId);
```

---

## 📊 Métricas do Backend

- **12+ tabelas** principais
- **24 migrations** SQL versionadas
- **50+ políticas RLS** implementadas
- **2 Edge Functions** (IA e convites)
- **~30+ Server Actions** organizadas
- **100% TypeScript** no backend

---

## 🎯 Conclusão

O backend foi desenvolvido com foco em:

- ✅ **Segurança**: RLS implementado em todas as tabelas
- ✅ **Performance**: Índices otimizados, queries eficientes
- ✅ **Escalabilidade**: Multi-tenancy seguro, arquitetura flexível
- ✅ **Manutenibilidade**: Migrations versionadas, código organizado
- ✅ **Integração**: Edge Functions para operações complexas (IA)

A combinação de Supabase (PostgreSQL + Auth + Storage + Edge Functions) com Server Actions do Next.js resulta em um backend robusto, seguro e fácil de manter.
