import type { KanbanStage, Lead } from "@/shared/types/crm";

/**
 * Verifica se o lead deve ser movido para a etapa "Tentando Contato"
 * quando uma mensagem é enviada
 */
export function shouldMoveToContactingStage(lead: Lead): boolean {
  return lead.stage === "base" || lead.stage === "lead_mapeado";
}

/**
 * Obtém o próximo stage apropriado após enviar mensagem
 */
export function getNextStageAfterMessage(
  currentStage: KanbanStage,
): KanbanStage {
  if (currentStage === "base" || currentStage === "lead_mapeado") {
    return "tentando_contato";
  }
  return currentStage;
}
