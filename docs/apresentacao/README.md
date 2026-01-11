# Documentação de Apresentação - Mini CRM SDR

## 📚 Índice

Esta pasta contém toda a documentação necessária para a apresentação do projeto, organizada em 3 partes principais:

### 🎯 Roteiro de Apresentação
- **[00-roteiro-apresentacao.md](./00-roteiro-apresentacao.md)** - Roteiro completo com tempo estimado e dicas

### 📁 Conteúdo da Apresentação

1. **[01-estrutura-projeto.md](./01-estrutura-projeto.md)** - Estrutura e Arquitetura
   - Arquitetura Vertical Sliced
   - Organização por Features
   - Estrutura de diretórios
   - Server Actions Pattern
   - Código compartilhado

2. **[02-frontend.md](./02-frontend.md)** - Frontend
   - Stack tecnológica
   - Next.js App Router
   - Componentes e UI
   - Formulários e validação
   - Drag and Drop (Kanban)
   - Performance e otimizações

3. **[03-backend.md](./03-backend.md)** - Backend
   - Arquitetura Supabase
   - Banco de dados PostgreSQL
   - Row Level Security (RLS)
   - Edge Functions
   - Integração com IA (Google Gemini)
   - Migrations

---

## 🎬 Como Usar

### Para Preparar a Apresentação

1. **Leia o roteiro primeiro**: `00-roteiro-apresentacao.md`
2. **Estude cada parte**: Estrutura → Frontend → Backend
3. **Pratique o fluxo**: Siga a ordem sugerida no roteiro
4. **Prepare exemplos**: Selecione código relevante para mostrar

### Ordem de Leitura Recomendada

1. `00-roteiro-apresentacao.md` - Entender estrutura geral
2. `01-estrutura-projeto.md` - Como o projeto está organizado
3. `02-frontend.md` - Tecnologias e componentes do frontend
4. `03-backend.md` - Banco de dados, segurança e IA

---

## 📊 Estrutura da Apresentação

```
Apresentação (15-21 min)
│
├── Parte 1: Estrutura do Projeto (5-7 min)
│   ├── Visão Geral
│   ├── Arquitetura Vertical Sliced
│   └── Organização por Features
│
├── Parte 2: Frontend (5-7 min)
│   ├── Stack Tecnológica
│   ├── Arquitetura (App Router)
│   └── Componentes e Funcionalidades
│
└── Parte 3: Backend (5-7 min)
    ├── Arquitetura (Supabase)
    ├── Banco de Dados (PostgreSQL + RLS)
    └── Edge Functions e IA
```

---

## 🎯 Pontos-Chave

### Estrutura
- Arquitetura Vertical Sliced
- 9 features principais
- Alta coesão, baixo acoplamento

### Frontend
- Next.js 16 + React 19
- Server Components
- 49 componentes base (Radix UI)

### Backend
- Supabase (PostgreSQL + RLS)
- Multi-tenancy seguro
- Edge Functions para IA

---

## 📝 Notas

- Cada arquivo é independente e pode ser usado como referência
- O roteiro sugere tempo, mas ajuste conforme necessário
- Enfatize os pontos que considera mais relevantes
- Prepare exemplos de código para mostrar durante a apresentação

---

**Boa apresentação! 🚀**
