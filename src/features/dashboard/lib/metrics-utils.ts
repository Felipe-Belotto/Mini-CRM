import { type Campaign, type KanbanStage, type Lead } from "@/shared/types/crm";

/**
 * Calcula a contagem de leads por etapa
 */
export function getLeadsCountByStage(leads: Lead[]): Record<KanbanStage, number> {
  const counts: Record<KanbanStage, number> = {
    base: 0,
    lead_mapeado: 0,
    tentando_contato: 0,
    conexao_iniciada: 0,
    desqualificado: 0,
    qualificado: 0,
    reuniao_agendada: 0,
  };

  for (const lead of leads) {
    counts[lead.stage]++;
  }

  return counts;
}

/**
 * Calcula o número de leads qualificados
 */
export function calculateQualifiedLeads(leads: Lead[]): number {
  const stageCounts = getLeadsCountByStage(leads);
  return stageCounts.qualificado + stageCounts.reuniao_agendada;
}

/**
 * Obtém o número de campanhas ativas
 */
export function getActiveCampaignsCount(campaigns: Campaign[]): number {
  return campaigns.filter((campaign) => campaign.status === "active").length;
}

/**
 * Calcula métricas do dashboard
 */
export function calculateDashboardMetrics(
  leads: Lead[],
  campaigns: Campaign[],
) {
  const stageCounts = getLeadsCountByStage(leads);
  const qualifiedLeads = calculateQualifiedLeads(leads);
  const activeCampaigns = getActiveCampaignsCount(campaigns);

  return {
    totalLeads: leads.length,
    qualifiedLeads,
    activeCampaigns,
    meetingsScheduled: stageCounts.reuniao_agendada,
    stageCounts,
  };
}
