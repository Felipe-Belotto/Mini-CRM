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
  return !!(lead.name && lead.phone && lead.position);
}

/**
 * Retorna o status de validação do lead
 */
export function getLeadValidationStatus(lead: Lead): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!lead.name || lead.name.trim() === "") {
    missingFields.push("name");
  }
  if (!lead.phone || lead.phone.trim() === "") {
    missingFields.push("phone");
  }
  if (!lead.position || lead.position.trim() === "") {
    missingFields.push("position");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
