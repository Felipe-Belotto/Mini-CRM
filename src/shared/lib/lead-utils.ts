import type { KanbanStage, Lead, ValidationError } from "@/shared/types/crm";

export function validateLeadForStage(
  lead: Lead,
  targetStage: KanbanStage,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (
    targetStage === "lead_mapeado" ||
    targetStage === "tentando_contato" ||
    targetStage === "conexao_iniciada" ||
    targetStage === "qualificado" ||
    targetStage === "reuniao_agendada"
  ) {
    if (!lead.nome || lead.nome.trim() === "") {
      errors.push({ field: "nome", message: "Nome é obrigatório" });
    }
    if (!lead.telefone || lead.telefone.trim() === "") {
      errors.push({ field: "telefone", message: "Telefone é obrigatório" });
    }
    if (!lead.cargo || lead.cargo.trim() === "") {
      errors.push({ field: "cargo", message: "Cargo é obrigatório" });
    }
  }

  return errors;
}
