import { getLeadsCountByStage } from "@/shared/data/mockData";
import { type Campaign, KanbanStage, type Lead } from "@/shared/types/crm";

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
