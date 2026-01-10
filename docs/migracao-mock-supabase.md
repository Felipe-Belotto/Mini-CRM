# Migração: Mock Data → Supabase

> **Data:** Janeiro 2026  
> **Status:** ✅ Concluído  
> **Escopo:** Dashboard, Pipeline e Campanhas

---

## 📋 Resumo

Este documento descreve a migração das features de **Dashboard**, **Pipeline** e **Campanhas** do uso de dados mockados (`mockData.ts`) para integração real com o banco de dados **Supabase**.

---

## 🔄 O que foi alterado

### 1. Schema de Tipos (`supabase.ts`)

**Arquivo:** `src/shared/types/supabase.ts`

Os tipos do Supabase foram atualizados para refletir o schema em inglês definido nos arquivos de migração SQL:

| Tabela | Campos Atualizados |
|--------|-------------------|
| `campaigns` | `name`, `context`, `voice_tone`, `ai_instructions`, `trigger_stage` |
| `leads` | `name`, `email`, `phone`, `position`, `company`, `segment`, `revenue`, `notes`, `campaign_id`, `responsible_id` |
| `custom_fields` | `name`, `type`, `required`, `options`, `order` |

### 2. Server Actions

#### Dashboard (`src/features/dashboard/actions/dashboard.ts`)

Novas actions criadas:

| Action | Descrição |
|--------|-----------|
| `getDashboardMetricsAction()` | Retorna métricas completas (leads, campanhas, contagens) |
| `getCurrentWorkspaceLeadsAction()` | Busca leads do workspace atual |
| `getCurrentWorkspaceCampaignsAction()` | Busca campanhas do workspace atual |
| `getCurrentWorkspaceUsersAction()` | Busca usuários/membros do workspace atual |

#### Leads (`src/features/leads/actions/leads.ts`)

Mapeamento atualizado de `LeadRow` → `Lead`:

```typescript
// Antes (português)
name: dbLead.nome
phone: dbLead.telefone
position: dbLead.cargo
company: dbLead.empresa

// Depois (inglês)
name: dbLead.name
phone: dbLead.phone
position: dbLead.position
company: dbLead.company
```

#### Campaigns (`src/features/campaigns/actions/campaigns.ts`)

Mapeamento atualizado de `CampaignRow` → `Campaign`:

```typescript
// Antes (português)
name: dbCampaign.nome
context: dbCampaign.contexto
voiceTone: dbCampaign.tom_de_voz
aiInstructions: dbCampaign.instrucoes_ia

// Depois (inglês)
name: dbCampaign.name
context: dbCampaign.context
voiceTone: dbCampaign.voice_tone
aiInstructions: dbCampaign.ai_instructions
```

### 3. Páginas (App Router)

| Página | Mudança |
|--------|---------|
| `src/app/(dashboard)/page.tsx` | Usa `getDashboardMetricsAction()` |
| `src/app/(dashboard)/pipeline/page.tsx` | Busca leads, campanhas e usuários via actions |
| `src/app/(dashboard)/campanhas/page.tsx` | Usa `getCurrentWorkspaceCampaignsAction()` |

### 4. Componentes

| Componente | Mudança |
|------------|---------|
| `MetricsGrid.tsx` | Usa `getLeadsCountByStage` de `metrics-utils.ts` |
| `LeadsByStageChart.tsx` | Usa `getLeadsCountByStage` de `metrics-utils.ts` |
| `LeadEditForm.tsx` | Recebe `users: User[]` como prop |
| `CreateLeadForm.tsx` | Recebe `users: User[]` como prop |
| `LeadDrawer.tsx` | Recebe `users: User[]` como prop |
| `CreateLeadDialog.tsx` | Recebe `users: User[]` como prop |
| `PipelineUI.tsx` | Recebe `users: User[]` como prop |

### 5. Utilitários

**Arquivo:** `src/features/dashboard/lib/metrics-utils.ts`

A função `getLeadsCountByStage` foi movida para este arquivo (antes estava em `mockData.ts`).

### 6. Arquivos Removidos

- `src/shared/data/mockData.ts` - Arquivo de mock completamente removido

---

## ✅ Checklist de Validação

### Passo 1: Verificar Schema do Banco

Execute no Supabase SQL Editor para confirmar que o schema está correto:

```sql
-- Verificar estrutura da tabela leads
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela campaigns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela custom_fields
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'custom_fields' 
ORDER BY ordinal_position;
```

**Esperado:** Colunas devem estar em **inglês** (name, email, phone, etc.)

### Passo 2: Testar Autenticação

1. Faça login na aplicação
2. Verifique se redireciona para `/onboarding/workspace` se não houver workspace
3. Verifique se o workspace é carregado corretamente

### Passo 3: Testar Dashboard

1. Acesse a página inicial (`/`)
2. Verifique se as métricas são exibidas:
   - Total de Leads
   - Leads Qualificados
   - Campanhas Ativas
   - Reuniões Agendadas
3. Verifique se o gráfico "Leads por Etapa" exibe dados corretos
4. Verifique se a seção "Campanhas" lista as campanhas ativas

### Passo 4: Testar Pipeline

1. Acesse `/pipeline`
2. Verifique se o Kanban é carregado com os leads do workspace
3. Teste arrastar um lead entre colunas
4. Clique em um lead para abrir o drawer
5. Verifique se o formulário de edição funciona
6. Verifique se o select de "Responsável" mostra os membros do workspace

### Passo 5: Testar Criar Lead

1. No Pipeline, clique em "+" em qualquer coluna
2. Preencha o formulário
3. Verifique se o lead é criado e aparece na coluna correta
4. Verifique no Supabase se o registro foi salvo

### Passo 6: Testar Campanhas

1. Acesse `/campanhas`
2. Verifique se as campanhas existentes são listadas
3. Teste criar uma nova campanha
4. Verifique se a campanha aparece na lista

### Passo 7: Testar Edição de Lead

1. No Pipeline, clique em um lead
2. Edite os campos (nome, email, telefone, etc.)
3. Verifique se as alterações são salvas
4. Recarregue a página e confirme que os dados persistiram

### Passo 8: Verificar Erros no Console

1. Abra o DevTools do navegador (F12)
2. Vá para a aba Console
3. Navegue pelas páginas e verifique se há erros

---

## 🐛 Problemas Conhecidos / A Verificar

### 1. Campos Personalizados (Custom Fields)

Os custom fields ainda podem precisar de ajustes no mapeamento. Verificar:

- [ ] Se `getCustomFieldsAction` usa os nomes corretos das colunas
- [ ] Se `CustomFieldInput` funciona corretamente

### 2. Pipeline Config

Verificar se a configuração do pipeline está sendo buscada corretamente:

- [ ] `getPipelineConfigAction` usa o schema correto
- [ ] As validações de etapa funcionam

### 3. Geração de Mensagens IA

Verificar se a feature de IA continua funcionando:

- [ ] Seleção de campanha no drawer do lead
- [ ] Botão "Gerar Sugestões" funciona
- [ ] Mensagens são geradas corretamente

---

## 📁 Estrutura de Arquivos Afetados

```
src/
├── app/(dashboard)/
│   ├── page.tsx                    # ✅ Atualizado
│   ├── pipeline/page.tsx           # ✅ Atualizado
│   └── campanhas/page.tsx          # ✅ Atualizado
│
├── features/
│   ├── dashboard/
│   │   ├── actions/
│   │   │   └── dashboard.ts        # ✅ Criado
│   │   ├── components/
│   │   │   ├── MetricsGrid.tsx     # ✅ Atualizado
│   │   │   └── LeadsByStageChart.tsx # ✅ Atualizado
│   │   └── lib/
│   │       └── metrics-utils.ts    # ✅ Atualizado
│   │
│   ├── leads/
│   │   ├── actions/
│   │   │   └── leads.ts            # ✅ Atualizado
│   │   └── components/
│   │       ├── PipelineUI.tsx      # ✅ Atualizado
│   │       ├── LeadDrawer.tsx      # ✅ Atualizado
│   │       ├── LeadEditForm.tsx    # ✅ Atualizado
│   │       ├── CreateLeadForm.tsx  # ✅ Atualizado
│   │       └── CreateLeadDialog.tsx # ✅ Atualizado
│   │
│   └── campaigns/
│       └── actions/
│           └── campaigns.ts        # ✅ Atualizado
│
└── shared/
    ├── types/
    │   └── supabase.ts             # ✅ Atualizado
    └── data/
        └── mockData.ts             # ❌ Removido
```

---

## 🚀 Próximos Passos

1. **Testar toda a aplicação** seguindo o checklist acima
2. **Verificar Custom Fields** - Podem precisar de ajustes similares
3. **Verificar Pipeline Config** - Mesma situação
4. **Rodar build de produção** - `npm run build` para detectar erros de tipo
5. **Deploy para staging** - Testar em ambiente similar à produção

---

## 📝 Notas Importantes

### Convenção de Nomes

O projeto agora segue a convenção de nomes em **inglês** para o banco de dados, conforme definido nos arquivos de migração SQL em `supabase/migrations/`.

### Mapeamento DB → Domain

Os tipos do Supabase (`LeadRow`, `CampaignRow`) são mapeados para tipos de domínio (`Lead`, `Campaign`) nas Server Actions. Isso permite:

- Nomes de colunas em snake_case no banco
- Nomes de propriedades em camelCase no código TypeScript

### Autenticação

Todas as actions verificam autenticação e acesso ao workspace antes de executar operações. Se houver problemas de permissão, verifique:

1. Se o usuário está autenticado
2. Se o workspace atual está definido no profile
3. Se o usuário tem acesso ao workspace (owner ou member)
