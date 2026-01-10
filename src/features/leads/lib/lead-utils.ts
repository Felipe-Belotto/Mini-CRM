import type { KanbanStage, Lead } from "@/shared/types/crm";

/**
 * Filtra leads por stage e ordena por sortOrder
 */
export function getLeadsByStage(leads: Lead[], stage: KanbanStage): Lead[] {
  return leads
    .filter((lead) => lead.stage === stage)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Verifica se um lead é elegível para promoção de "base" para "lead_mapeado"
 * Critérios:
 * - Nome preenchido
 * - Empresa OU Cargo preenchido
 * - Email OU Telefone preenchido (alguma forma de contato)
 */
export function isLeadEligibleForPromotion(lead: Lead): boolean {
  const hasName = Boolean(lead.name?.trim());
  const hasCompanyOrPosition = Boolean(lead.company?.trim() || lead.position?.trim());
  const hasContact = Boolean(lead.email?.trim() || lead.phone?.trim());
  
  return hasName && hasCompanyOrPosition && hasContact;
}

/**
 * Conta quantos leads na "base" são elegíveis para promoção
 */
export function countEligibleLeadsForPromotion(leads: Lead[]): number {
  return leads.filter(
    (lead) => lead.stage === "base" && isLeadEligibleForPromotion(lead)
  ).length;
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
