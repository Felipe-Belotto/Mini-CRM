# Mini CRM SDR - Sistema de Gestão de Leads com IA

## 📋 Descrição do Projeto

Este é um **Mini CRM voltado para equipes de Pré-Vendas (SDR)** desenvolvido como prova técnica. O sistema permite gerenciar leads em um funil personalizável, criar campanhas de abordagem e gerar mensagens personalizadas utilizando Inteligência Artificial.

### Principais Funcionalidades

- 🎯 **Gestão de Leads**: Cadastro, edição e visualização em formato Kanban
- 🚀 **Campanhas de Marketing**: Criação de campanhas com contexto e prompts personalizados
- 🤖 **Geração de Mensagens com IA**: Mensagens personalizadas usando Google Gemini AI
- ⚡ **Automação**: Geração automática de mensagens quando leads atingem etapas específicas
- 👥 **Multi-Workspace**: Isolamento completo de dados por empresa/equipe
- 🔐 **Segurança**: Row Level Security (RLS) implementado em todas as tabelas
- 📊 **Dashboard**: Métricas e visualizações do workspace
- 📝 **Histórico**: Log completo de atividades e mensagens enviadas

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **[Next.js 16.1.1](https://nextjs.org/)** - Framework React com App Router
- **[React 19.2.3](https://react.dev/)** - Biblioteca UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS utility-first
- **[Radix UI](https://www.radix-ui.com/)** - Componentes acessíveis (49 componentes)
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)** - Formulários e validação
- **[@dnd-kit](https://dndkit.com/)** - Biblioteca de drag and drop para Kanban
- **[TanStack Query](https://tanstack.com/query)** - Gerenciamento de estado servidor
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones
- **[date-fns](https://date-fns.org/)** - Manipulação de datas
- **[Recharts](https://recharts.org/)** - Gráficos e visualizações

### Backend
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - **PostgreSQL** - Banco de dados relacional
  - **Supabase Auth** - Sistema de autenticação
  - **Supabase Storage** - Armazenamento de arquivos (avatars)
  - **Edge Functions** - Funções serverless (TypeScript/Deno)

### Integração IA
- **[Google Gemini AI](https://ai.google.dev/)** (Gemini 2.5 Flash Lite) - Geração de mensagens personalizadas

### Ferramentas de Desenvolvimento
- **[Biome](https://biomejs.dev/)** - Linter e formatter
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[pnpm](https://pnpm.io/)** - Gerenciador de pacotes

---

## 🏗️ Decisões Técnicas

### 1. Arquitetura Vertical Sliced (Feature-Based)

**Por que escolhi esta arquitetura:**

A arquitetura Vertical Sliced organiza o código por funcionalidades de negócio ao invés de por camadas técnicas, promovendo:

- **Alta Coesão**: Todos os arquivos relacionados a uma feature ficam próximos
- **Baixo Acoplamento**: Features dependem principalmente de código compartilhado
- **Autonomia**: Cada feature evolui independentemente
- **Manutenibilidade**: Facilita localização e modificação de código
- **Escalabilidade**: Novas features podem ser adicionadas sem impactar existentes

**Estrutura:**
```
src/
├── app/                    # Rotas (Next.js App Router)
├── features/               # Features do negócio
│   ├── auth/              # Autenticação e onboarding
│   ├── workspaces/        # Workspaces e membros
│   ├── leads/             # Gestão de leads
│   ├── campaigns/         # Campanhas de marketing
│   ├── ai-messages/       # Geração de mensagens IA
│   ├── custom-fields/     # Campos personalizados
│   ├── pipeline-config/   # Configuração do funil
│   ├── dashboard/         # Dashboard e métricas
│   └── activities/        # Histórico de atividades
└── shared/                # Código compartilhado
    ├── components/        # Componentes UI reutilizáveis
    ├── lib/               # Utilitários gerais
    └── types/             # Tipos TypeScript compartilhados
```

Cada feature contém:
- `actions/` - Server Actions do Next.js
- `components/` - Componentes específicos
- `hooks/` - Hooks personalizados
- `lib/` - Utilitários específicos
- `types/` - Tipos TypeScript (opcional)

### 2. Estrutura de Banco de Dados

**Por que PostgreSQL no Supabase:**

- **Relacional adequado**: Dados estruturados (leads, campanhas, workspaces) se beneficiam de relacionamentos
- **JSONB flexível**: Campos personalizados armazenados como JSONB permitem flexibilidade sem schema rígido
- **RLS nativo**: Row Level Security implementado diretamente no banco para multi-tenancy seguro
- **Performance**: Índices otimizados e queries eficientes
- **Migrations versionadas**: Controle de versão do schema via migrations SQL

**Principais tabelas:**
- `workspaces` - Isolamento multi-tenant
- `workspace_members` - Membros e papéis (owner, admin, member)
- `workspace_invites` - Sistema de convites
- `leads` - Dados dos leads com campos padrão e personalizados (JSONB)
- `custom_fields` - Definição de campos personalizados por workspace
- `campaigns` - Campanhas de marketing com contexto e prompts
- `pipeline_stages` - Etapas do funil (customizáveis)
- `pipeline_configs` - Configuração de campos obrigatórios por etapa
- `lead_activities` - Histórico de atividades (criação, movimentações, edições)
- `lead_messages_sent` - Mensagens efetivamente enviadas
- `lead_ai_suggestions` - Mensagens geradas automaticamente por gatilhos

### 3. Integração com LLM

**Por que Google Gemini:**

- **Modelo eficiente**: Gemini 2.5 Flash Lite oferece boa qualidade com baixo custo
- **Performance**: Respostas rápidas adequadas para uso em produção
- **API simples**: Integração direta e confiável
- **Custo-benefício**: Adequado para geração de mensagens em escala

**Como estruturado:**

1. **Edge Function dedicada** (`generate-ai-messages`):
   - Processamento isolado do frontend
   - Retry logic para erros 503 (service overloaded)
   - Suporte a múltiplos canais (WhatsApp e Email)
   - Geração paralela de variações

2. **Prompt Engineering**:
   - Contexto estruturado da campanha
   - Dados do lead (padrão + personalizados)
   - Instruções de estilo e tom de voz
   - Formato específico por canal
   - Resposta em JSON estruturado

3. **Processamento Assíncrono**:
   - Geração automática em background (não bloqueia UI)
   - Mensagens salvas em `lead_ai_suggestions` para visualização posterior
   - Tratamento de erros silencioso (não quebra fluxo principal)

### 4. Multi-Tenancy

**Como implementado:**

- **Row Level Security (RLS)** no Supabase:
  - Todas as tabelas têm `workspace_id`
  - Políticas RLS baseadas em `workspace_members`
  - Funções helper: `is_workspace_member()`, `is_workspace_admin_or_owner()`
  - Service role para operações administrativas

**Vantagens:**
- **Segurança no banco**: Isolamento garantido no nível do banco de dados
- **Performance**: Filtros automáticos via RLS
- **Escalável**: Suporta múltiplos workspaces sem impacto de performance
- **Manutenível**: Políticas centralizadas e reutilizáveis

**Desafio resolvido:**
- **Problema**: Owner não conseguia ver workspace imediatamente após criação (SELECT falhava antes do trigger adicionar como membro)
- **Solução**: Política adicional que permite owner ver por `owner_id` diretamente, sem depender de `workspace_members`

### 5. Server Actions Pattern

**Por que Server Actions do Next.js:**

- **Simplicidade**: Não precisa criar rotas API explícitas
- **Type-safety**: TypeScript end-to-end
- **Performance**: Execução no servidor, menos round-trips
- **Segurança**: Validação e autenticação no servidor

**Organização:**
- Todas as Server Actions em `features/[feature]/actions/`
- Diretiva `"use server"` no topo do arquivo
- Validação com Zod
- Tratamento de erros consistente
- Revalidação de cache com `revalidatePath`

### 6. Validação de Campos Obrigatórios

**Como funciona:**

- Configuração dinâmica por etapa em `pipeline_configs`
- Validação antes de mover lead entre etapas
- Suporte a campos padrão e personalizados
- Mensagens de erro específicas e informativas

**Regras especiais:**
- Etapas "Base" e "Desqualificado" não requerem validação
- Para sair de "Base": nome + pelo menos um contato (telefone OU email)
- Validação unificada via `validateLeadForStage()`

---

## 🚀 Funcionalidades Implementadas

### ✅ Requisitos Obrigatórios

#### 1. Autenticação e Workspaces
- ✅ Sistema de cadastro e login de usuários
- ✅ Criação de workspaces (representa empresa/equipe)
- ✅ Isolamento de dados por workspace
- ✅ Controle de acesso básico (RLS)

#### 2. Gestão de Leads
- ✅ Cadastro com campos padrão: nome, email, telefone, empresa, cargo, origem, observações
- ✅ Campos personalizados por workspace
- ✅ Responsável pelo lead (atribuição opcional)
- ✅ Visualização Kanban por etapas do funil
- ✅ Drag and drop entre etapas
- ✅ Visualização e edição de detalhes

#### 3. Funil de Pré-Vendas
- ✅ 7 etapas padrão configuráveis:
  1. Base
  2. Lead Mapeado
  3. Tentando Contato
  4. Conexão Iniciada
  5. Desqualificado
  6. Qualificado
  7. Reunião Agendada

#### 4. Campanhas e Geração de Mensagens com IA
- ✅ Criação de campanhas com:
  - Nome da campanha
  - Contexto (descrição, produto, oferta)
  - Prompt de geração (persona, tom de voz, formato)
  - Etapa gatilho (diferencial)
- ✅ Geração de mensagens personalizadas:
  - Seleção de campanha ativa
  - 2-3 variações por canal (WhatsApp/Email)
  - Considera contexto, prompt e dados do lead
  - Regeneração de mensagens
  - Envio simulado (move lead para "Tentando Contato")

#### 5. Regras de Transição entre Etapas
- ✅ Configuração de campos obrigatórios por etapa
- ✅ Validação antes de mover lead
- ✅ Suporte a campos padrão e personalizados
- ✅ Mensagens de erro informativas

#### 6. Dashboard
- ✅ Métricas básicas:
  - Leads por etapa do funil
  - Total de leads cadastrados
  - Leads por responsável
  - Campanhas ativas

### ⭐ Requisitos Diferenciais Implementados

#### 1. Geração Automática por Gatilho ⭐
- ✅ Campanha vinculada a etapa do funil
- ✅ Geração automática quando lead atinge etapa gatilho
- ✅ Processamento em background (não bloqueia UI)
- ✅ Mensagens salvas em `lead_ai_suggestions`
- ✅ Visualização de mensagens pré-geradas

#### 2. Edição de Funil ⭐
- ✅ Criar novas etapas
- ✅ Editar etapas existentes (nome, cor, ordem)
- ✅ Deletar etapas (com validação)
- ✅ Reordenar etapas (drag and drop)
- ✅ Paletas de cores customizáveis

#### 3. Multi-Workspace ⭐
- ✅ Usuário pode participar de múltiplos workspaces
- ✅ Troca de workspace no header
- ✅ Isolamento completo de dados por workspace

#### 4. Convite de Usuários ⭐
- ✅ Sistema de convites por email
- ✅ Diferentes papéis: owner, admin, member
- ✅ Aceite de convite via token
- ✅ Edge Function para envio de emails (Resend)

#### 5. Histórico de Atividades ⭐
- ✅ Log de ações no lead:
  - Criação
  - Movimentações entre etapas
  - Mensagens enviadas
  - Edições
- ✅ Timeline visual
- ✅ Histórico do workspace

#### 6. Histórico de Mensagens Enviadas ⭐
- ✅ Registro de mensagens efetivamente enviadas
- ✅ Associação com campanha
- ✅ Data e hora de envio
- ✅ Visualização no detalhe do lead

#### 7. Filtros e Busca ⭐
- ✅ Filtrar por responsável
- ✅ Filtrar por etapa
- ✅ Buscar por nome/empresa
- ✅ Filtros combinados

#### 8. Métricas Avançadas ⭐
- ✅ Taxa de conversão entre etapas
- ✅ Leads por período
- ✅ Mensagens geradas por campanha
- ✅ Performance por responsável

#### 9. Row Level Security (RLS) ⭐
- ✅ Políticas RLS bem implementadas
- ✅ Isolamento por workspace
- ✅ Controle de acesso granular
- ✅ Service role para operações administrativas

---

## 🎯 Desafios Encontrados e Como Resolvi

### Desafio 1: RLS e Criação de Workspace
**Problema:** Owner não conseguia ver workspace imediatamente após criação. O SELECT falhava porque a política RLS verificava `workspace_members`, mas o trigger que adiciona o owner como membro ainda não havia executado.

**Solução:** Adicionei uma política adicional que permite ao owner ver o workspace diretamente pelo campo `owner_id`, sem depender de `workspace_members`. Isso garante que o fluxo de criação funcione corretamente.

### Desafio 2: Geração Automática Não Bloqueante
**Problema:** A geração de mensagens IA pode demorar vários segundos. Se executada de forma síncrona, bloquearia a UI e a experiência do usuário seria ruim.

**Solução:** Implementei processamento em background usando `Promise.all` com tratamento de erros silencioso. A função `triggerAutoMessageGeneration()` é chamada após operações principais, mas não bloqueia a resposta. Erros são logados mas não propagados.

### Desafio 3: Validação Dinâmica de Campos
**Problema:** A validação precisa considerar tanto campos padrão (nome, email, telefone) quanto campos personalizados criados pelo usuário, de forma unificada.

**Solução:** Criei a função `validateLeadForStage()` que:
- Mapeia campos padrão para valores do lead
- Busca campos personalizados por ID (UUID)
- Valida ambos de forma unificada
- Retorna erros específicos com nomes corretos dos campos

### Desafio 4: Drag and Drop com Ordenação
**Problema:** Manter a ordenação de leads dentro de cada etapa do Kanban, permitindo reordenação via drag and drop.

**Solução:** Adicionei campo `sort_order` na tabela `leads` e implementei `reorderLeadsAction()` que atualiza múltiplos leads em uma única transação, mantendo a ordenação consistente.

### Desafio 5: Retry Logic para IA
**Problema:** A API do Gemini pode retornar erro 503 (service overloaded) ocasionalmente, quebrando a geração de mensagens.

**Solução:** Implementei retry logic na Edge Function com:
- 3 tentativas máximas
- Delay progressivo entre tentativas (2s, 4s, 6s)
- Detecção específica de erros 503
- Fallback gracioso se todas as tentativas falharem

---

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- pnpm (ou npm/yarn)
- Conta no Supabase
- Chave da API do Google Gemini

### Passos

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd mini-crm
```

2. **Instale as dependências:**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp env.example .env.local
```

Edite `.env.local` com suas credenciais:
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_PROJECT_ID` - ID do projeto
- `GEMINI_API_KEY` - Chave da API do Google Gemini
- `RESEND_API_KEY` - Chave do Resend (opcional, para convites)
- `RESEND_FROM_EMAIL` - Email remetente (opcional)

4. **Configure o Supabase:**
   - Crie um projeto no Supabase
   - Execute as migrations em `supabase/migrations/`
   - Configure os secrets para Edge Functions:
     - `GEMINI_API_KEY`
     - `RESEND_API_KEY` (opcional)

5. **Execute as migrations:**
```bash
# Via Supabase CLI ou Dashboard
supabase db push
```

6. **Gere os tipos TypeScript:**
```bash
pnpm supabase:types
```

7. **Inicie o servidor de desenvolvimento:**
```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 📚 Estrutura do Projeto

```
mini-crm/
├── src/
│   ├── app/                    # Rotas Next.js
│   │   ├── (auth)/            # Rotas de autenticação
│   │   ├── (dashboard)/       # Rotas do dashboard
│   │   └── invites/           # Rotas de convites
│   ├── features/              # Features do negócio
│   │   ├── auth/              # Autenticação
│   │   ├── workspaces/        # Workspaces
│   │   ├── leads/             # Leads
│   │   ├── campaigns/        # Campanhas
│   │   ├── ai-messages/       # Mensagens IA
│   │   ├── custom-fields/     # Campos personalizados
│   │   ├── pipeline-config/   # Configuração do funil
│   │   ├── dashboard/         # Dashboard
│   │   └── activities/        # Atividades
│   └── shared/                # Código compartilhado
│       ├── components/        # Componentes UI
│       ├── lib/               # Utilitários
│       └── types/             # Tipos TypeScript
├── supabase/
│   ├── functions/             # Edge Functions
│   │   ├── generate-ai-messages/
│   │   └── send-workspace-invite/
│   └── migrations/           # Migrations SQL
├── docs/                      # Documentação
│   ├── projeto.md            # Especificação do projeto
│   ├── estrutura.md          # Arquitetura
│   └── resumo-apresentacao.md # Resumo para apresentação
└── public/                    # Arquivos estáticos
```

---

## 🔒 Segurança

- **Row Level Security (RLS)**: Implementado em todas as tabelas
- **Autenticação**: Supabase Auth com JWT
- **Validação**: Zod schemas em todas as Server Actions
- **Sanitização**: Validação de entrada no servidor
- **Secrets**: Variáveis sensíveis em variáveis de ambiente
- **CORS**: Configurado nas Edge Functions

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Linter
pnpm lint

# Formatter
pnpm format

# Gerar tipos do Supabase
pnpm supabase:types
```

---

## 🤝 Contribuindo

Este é um projeto de prova técnica, mas sugestões e melhorias são bem-vindas!

---

## 📄 Licença

Este projeto foi desenvolvido como prova técnica.

---

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através do repositório.

---

## 🎥 Apresentação em Vídeo

[[Link do vídeo de apresentação será adicionado aqui](https://www.youtube.com/watch?v=AuJEMz_NUc0)]

---

**Desenvolvido com ❤️ usando Next.js, Supabase e Google Gemini AI**
