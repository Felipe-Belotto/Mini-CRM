import type { LeadOrigin, KanbanStage } from "@/shared/types/crm";
import { LEAD_ORIGINS, KANBAN_COLUMNS } from "@/shared/types/crm";

export interface JsonLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  origin?: string;
  stage?: string;
  notes?: string;
  linkedIn?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  source?: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  origem?: string;
  etapa?: string;
  observacoes?: string;
  notas?: string;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  origin: string;
  stage: KanbanStage;
  responsibleIds: string[];
  notes: string;
  avatarFile: File | null;
}

function mapOriginToId(value: string): LeadOrigin {
  const normalized = value.toLowerCase().trim();
  
  const origin = LEAD_ORIGINS.find(
    (o) =>
      o.id === normalized ||
      o.label.toLowerCase() === normalized ||
      o.label.toLowerCase().includes(normalized) ||
      normalized.includes(o.label.toLowerCase()),
  );
  
  return origin?.id || "outro";
}

function mapStageToId(value: string): KanbanStage {
  const normalized = value.toLowerCase().trim();
  
  const stage = KANBAN_COLUMNS.find(
    (s) =>
      s.id === normalized ||
      s.title.toLowerCase() === normalized ||
      s.title.toLowerCase().includes(normalized) ||
      normalized.includes(s.title.toLowerCase()),
  );
  
  return stage?.id || "base";
}

export function parseJsonToFormData(
  json: JsonLeadInput,
  currentData: LeadFormData
): Partial<LeadFormData> {
  const data: Partial<LeadFormData> = {};

  if (json.name) {
    data.name = json.name.trim();
  } else if (json.firstName || json.lastName) {
    data.name = [json.firstName, json.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  if (json.email) {
    data.email = json.email.trim();
  }

  if (json.phone || json.telefone) {
    data.phone = (json.phone || json.telefone || "").trim();
  }

  if (json.position || json.role || json.cargo) {
    data.position = (json.position || json.role || json.cargo || "").trim();
  }

  if (json.company || json.empresa) {
    data.company = (json.company || json.empresa || "").trim();
  }

  const originValue = json.origin || json.source || json.origem;
  if (originValue) {
    data.origin = mapOriginToId(originValue);
  }

  const stageValue = json.stage || json.etapa;
  if (stageValue) {
    data.stage = mapStageToId(stageValue);
  }

  if (json.notes || json.observacoes || json.notas) {
    data.notes = (json.notes || json.observacoes || json.notas || "").trim();
  }

  return data;
}
