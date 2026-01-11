# Roteiro de Apresentação - Mini CRM SDR

## 🎯 Estrutura da Apresentação

A apresentação está organizada em **3 partes principais**:

1. **Estrutura do Projeto** (5-7 min)
2. **Frontend** (5-7 min)
3. **Backend** (5-7 min)

**Tempo total estimado: 15-21 minutos** (+ tempo para Q&A)

---

## 📋 Roteiro Detalhado

### Parte 1: Estrutura do Projeto (5-7 min)

#### 1.1 Visão Geral (1 min)
- O que é o projeto: Mini CRM para equipes SDR
- Problema resolvido: Gestão de leads e geração de mensagens personalizadas
- Solução: Sistema completo com IA

#### 1.2 Arquitetura Vertical Sliced (2-3 min)
- **O que é**: Organização por features, não por camadas
- **Por quê**: Alta coesão, baixo acoplamento, autonomia
- **Estrutura**: Mostrar árvore de diretórios
- **Benefícios**: Manutenibilidade, escalabilidade

#### 1.3 Organização por Features (2-3 min)
- **9 features principais**: Listar e explicar cada uma
- **Estrutura de uma feature**: actions, components, hooks, lib
- **Código compartilhado**: Quando usar `shared`
- **Exemplo prático**: Mostrar estrutura da feature `leads`

**Arquivos de referência:**
- `docs/apresentacao/01-estrutura-projeto.md`

---

### Parte 2: Frontend (5-7 min)

#### 2.1 Stack Tecnológica (1-2 min)
- **Core**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI (49 componentes)
- **Formulários**: React Hook Form + Zod
- **Interatividade**: @dnd-kit para Kanban
- **Estado**: TanStack Query

#### 2.2 Arquitetura Frontend (2-3 min)
- **Next.js App Router**: Server Components vs Client Components
- **Estrutura de rotas**: Route groups, layouts aninhados
- **Server Actions**: Operações de servidor sem rotas API
- **Sistema de design**: Componentes base + customização

#### 2.3 Componentes e Funcionalidades (2 min)
- **Layout components**: Header, Sidebar, WorkspaceSwitcher
- **Feature components**: Componentes específicos por feature
- **UI components**: 49 componentes base (Radix UI)
- **Exemplos**: Mostrar código de componentes principais

**Arquivos de referência:**
- `docs/apresentacao/02-frontend.md`

---

### Parte 3: Backend (5-7 min)

#### 3.1 Arquitetura Backend (1-2 min)
- **Supabase**: Backend as a Service
- **Componentes**: PostgreSQL, Auth, Storage, Edge Functions
- **Por quê Supabase**: RLS nativo, escalabilidade, facilidade

#### 3.2 Banco de Dados (2-3 min)
- **PostgreSQL**: Relacional para dados estruturados
- **JSONB**: Campos personalizados flexíveis
- **Schema**: Principais tabelas e relacionamentos
- **Índices**: Otimizações de performance

#### 3.3 Row Level Security (RLS) (1-2 min)
- **O que é**: Segurança no nível do banco
- **Como implementado**: Políticas por tabela
- **Multi-tenancy**: Isolamento por workspace
- **Desafio resolvido**: Criação de workspace

#### 3.4 Edge Functions e IA (1-2 min)
- **Edge Functions**: Funções serverless (Deno)
- **generate-ai-messages**: Geração de mensagens com Gemini
- **Integração IA**: Prompt engineering, retry logic
- **Geração automática**: Por gatilho de etapa

**Arquivos de referência:**
- `docs/apresentacao/03-backend.md`

---

## 🎬 Ordem Sugerida de Apresentação

### Opção 1: Estrutura → Frontend → Backend (Recomendado)

1. **Estrutura do Projeto** (5-7 min)
   - Visão geral
   - Arquitetura Vertical Sliced
   - Organização por features

2. **Frontend** (5-7 min)
   - Stack tecnológica
   - Arquitetura (App Router, Server Components)
   - Componentes e funcionalidades

3. **Backend** (5-7 min)
   - Arquitetura (Supabase)
   - Banco de dados (PostgreSQL, RLS)
   - Edge Functions e IA

### Opção 2: Visão Geral → Detalhamento

1. **Visão Geral Completa** (3-4 min)
   - O que é o projeto
   - Stack geral (frontend + backend)
   - Arquitetura geral

2. **Estrutura do Projeto** (3-4 min)
   - Vertical Sliced
   - Features
   - Organização

3. **Frontend Detalhado** (4-5 min)
   - Stack e arquitetura
   - Componentes principais

4. **Backend Detalhado** (4-5 min)
   - Banco de dados
   - RLS
   - Edge Functions

---

## 📝 Pontos-Chave por Parte

### Estrutura do Projeto
- ✅ Arquitetura Vertical Sliced
- ✅ 9 features principais
- ✅ Alta coesão, baixo acoplamento
- ✅ Server Actions pattern

### Frontend
- ✅ Next.js 16 com App Router
- ✅ Server Components + Client Components
- ✅ 49 componentes base (Radix UI)
- ✅ React Hook Form + Zod
- ✅ @dnd-kit para Kanban

### Backend
- ✅ Supabase (PostgreSQL + Auth + Storage)
- ✅ Row Level Security (RLS)
- ✅ Edge Functions (IA e convites)
- ✅ Multi-tenancy seguro
- ✅ Google Gemini AI

---

## 🎯 Dicas de Apresentação

### Antes de Começar
- [ ] Revisar os 3 arquivos de apresentação
- [ ] Testar aplicação funcionando
- [ ] Ter link de deploy pronto
- [ ] Preparar demo ao vivo (opcional)

### Durante a Apresentação

#### Estrutura do Projeto
- Mostrar árvore de diretórios
- Explicar conceito de Vertical Sliced
- Dar exemplo de uma feature completa
- Enfatizar benefícios

#### Frontend
- Mostrar código de componentes
- Explicar Server vs Client Components
- Demonstrar Kanban (se possível)
- Mostrar sistema de design

#### Backend
- Explicar RLS com exemplo
- Mostrar estrutura do banco
- Explicar Edge Function de IA
- Enfatizar segurança

### Pontos a Enfatizar
- ✅ **Arquitetura**: Vertical Sliced facilita manutenção
- ✅ **Segurança**: RLS garante isolamento
- ✅ **Performance**: Server Components, otimizações
- ✅ **Escalabilidade**: Multi-tenancy, estrutura flexível
- ✅ **IA**: Geração automática por gatilho

---

## ⏱️ Controle de Tempo

### Distribuição Sugerida

| Parte | Tempo | Conteúdo |
|-------|-------|----------|
| **Estrutura** | 5-7 min | Visão geral, arquitetura, features |
| **Frontend** | 5-7 min | Stack, arquitetura, componentes |
| **Backend** | 5-7 min | Supabase, RLS, Edge Functions |
| **Q&A** | 5-10 min | Perguntas e respostas |
| **Total** | 20-31 min | Apresentação completa |

### Se Estiver Atrasado

**Priorizar:**
1. Estrutura do Projeto (essencial)
2. Backend (RLS e IA são diferenciais)
3. Frontend (pode ser resumido)

---

## 📊 Checklist Final

### Antes da Apresentação
- [ ] Ler todos os arquivos de apresentação
- [ ] Praticar o roteiro
- [ ] Preparar exemplos de código
- [ ] Testar demo (se aplicável)

### Durante a Apresentação
- [ ] Seguir o roteiro
- [ ] Controlar o tempo
- [ ] Enfatizar pontos-chave
- [ ] Responder perguntas

### Após a Apresentação
- [ ] Disponibilizar links (GitHub, deploy)
- [ ] Compartilhar documentação
- [ ] Agradecer e encerrar

---

## 🎯 Conclusão

A apresentação está organizada para cobrir:

1. **Como o projeto está estruturado** (arquitetura)
2. **Como o frontend funciona** (tecnologias e componentes)
3. **Como o backend funciona** (banco, segurança, IA)

Cada parte é independente mas complementar, permitindo uma visão completa do sistema desenvolvido.

**Boa apresentação! 🚀**
