import type { CustomField, KanbanStage, PipelineStage } from "@/shared/types/crm";
import { KANBAN_COLUMNS } from "@/shared/types/crm";

export function getConfigurableStages(stages: PipelineStage[]): KanbanStage[] {
  if (stages.length > 0) {
    return stages
      .filter((s) => !s.isHidden && s.slug !== "base" && s.slug !== "desqualificado")
      .map((s) => s.slug as KanbanStage);
  }
  
  return [
    "lead_mapeado",
    "tentando_contato",
    "conexao_iniciada",
    "qualificado",
    "reuniao_agendada",
  ];
}

export function getStageNames(stages: PipelineStage[]): Record<string, string> {
  if (stages.length > 0) {
    return Object.fromEntries(stages.map((s) => [s.slug, s.name]));
  }
  return Object.fromEntries(KANBAN_COLUMNS.map((c) => [c.id, c.title]));
}

export function getAvailableFields(customFields: CustomField[]): Array<{ id: string; nome: string }> {
  const defaultFields = [
    { id: "nome", nome: "Nome" },
    { id: "email", nome: "Email" },
    { id: "telefone", nome: "Telefone" },
    { id: "cargo", nome: "Cargo" },
    { id: "empresa", nome: "Empresa" },
  ];

  const customFieldsMapped = customFields.map((f) => ({
    id: f.id,
    nome: f.name,
  }));

  return [...defaultFields, ...customFieldsMapped];
}
