export type KanbanStage =
  | "base"
  | "lead_mapeado"
  | "tentando_contato"
  | "conexao_iniciada"
  | "desqualificado"
  | "qualificado"
  | "reuniao_agendada";

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  empresa: string;
  segmento?: string;
  faturamento?: string;
  linkedIn?: string;
  notas?: string;
  stage: KanbanStage;
  campanhaId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  nome: string;
  contexto: string;
  tomDeVoz: "formal" | "informal" | "neutro";
  instrucoesIA: string;
  status: "ativa" | "pausada" | "finalizada";
  leadsCount: number;
  createdAt: Date;
}

export interface KanbanColumn {
  id: KanbanStage;
  title: string;
  color: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "base", title: "Base", color: "kanban-base" },
  { id: "lead_mapeado", title: "Lead Mapeado", color: "kanban-mapped" },
  {
    id: "tentando_contato",
    title: "Tentando Contato",
    color: "kanban-contacting",
  },
  {
    id: "conexao_iniciada",
    title: "Conexão Iniciada",
    color: "kanban-connection",
  },
  {
    id: "desqualificado",
    title: "Desqualificado",
    color: "kanban-disqualified",
  },
  { id: "qualificado", title: "Qualificado", color: "kanban-qualified" },
  {
    id: "reuniao_agendada",
    title: "Reunião Agendada",
    color: "kanban-meeting",
  },
];

export interface ValidationError {
  field: string;
  message: string;
}
