import type { KanbanStage, Lead } from "@/shared/types/crm";

/**
 * Filtra leads por stage
 */
export function getLeadsByStage(leads: Lead[], stage: KanbanStage): Lead[] {
  return leads.filter((lead) => lead.stage === stage);
}

/**
 * Verifica se o lead tem os campos obrigatórios preenchidos
 */
export function hasRequiredFields(lead: Lead): boolean {
  return !!(lead.nome && lead.telefone && lead.cargo);
}

/**
 * Retorna o status de validação do lead
 */
export function getLeadValidationStatus(lead: Lead): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!lead.nome || lead.nome.trim() === "") {
    missingFields.push("nome");
  }
  if (!lead.telefone || lead.telefone.trim() === "") {
    missingFields.push("telefone");
  }
  if (!lead.cargo || lead.cargo.trim() === "") {
    missingFields.push("cargo");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
