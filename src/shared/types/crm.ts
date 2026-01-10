import type { Tables } from "./supabase";

// Re-exportar tipos do Supabase diretamente
export type Profile = Tables<"profiles">;
export type WorkspaceRow = Tables<"workspaces">;
export type LeadRow = Tables<"leads">;
export type CampaignRow = Tables<"campaigns">;
export type CustomFieldRow = Tables<"custom_fields">;
export type PipelineConfigRow = Tables<"pipeline_configs">;

// Tipos de domínio baseados nos tipos do Supabase
// User - derivado de Profile
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  createdAt: Date;
}

// Workspace - derivado de WorkspaceRow
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: Date;
  ownerId: string;
}

// Lead - derivado de LeadRow
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  segment?: string;
  revenue?: string;
  linkedIn?: string;
  notes?: string;
  stage: KanbanStage;
  campaignId?: string;
  responsibleId?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign - derivado de CampaignRow
export interface Campaign {
  id: string;
  name: string;
  context: string;
  voiceTone: "formal" | "informal" | "neutro";
  aiInstructions: string;
  status: "active" | "paused" | "finished";
  triggerStage?: KanbanStage;
  workspaceId: string;
  leadsCount: number;
  createdAt: Date;
}

// CustomField - derivado de CustomFieldRow
export interface CustomField {
  id: string;
  workspaceId: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[];
  order: number;
  createdAt: Date;
}

// Tipos específicos do domínio (não existem no Supabase)
export type KanbanStage =
  | "base"
  | "lead_mapeado"
  | "tentando_contato"
  | "conexao_iniciada"
  | "desqualificado"
  | "qualificado"
  | "reuniao_agendada";

export type CustomFieldType =
  | "text"
  | "number"
  | "email"
  | "phone"
  | "select"
  | "textarea"
  | "date";

export interface StageConfig {
  stage: KanbanStage;
  requiredFields: string[]; // IDs dos campos (padrão + customizados)
}

export interface PipelineConfig {
  workspaceId: string;
  stages: StageConfig[];
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

// Workspace Role type
export type WorkspaceRole = "owner" | "admin" | "member";

// Workspace Member - representa um membro do workspace
export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: Date;
}

// Workspace Invite - representa um convite pendente para o workspace
export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  status: "pending" | "accepted" | "expired" | "cancelled";
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}
