"use server";

import { getCampaignsAction } from "@/features/campaigns/actions/campaigns";
import { getLeadsAction } from "@/features/leads/actions/leads";
import { getWorkspaceMembersAction } from "@/features/workspaces/actions/members";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import type { Campaign, KanbanStage, Lead, User } from "@/shared/types/crm";
import { getLeadsCountByStage } from "../lib/metrics-utils";

export interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  activeCampaigns: number;
  meetingsScheduled: number;
  leadsByStage: Record<KanbanStage, number>;
  leads: Lead[];
  campaigns: Campaign[];
}

/**
 * Server Action para buscar métricas do dashboard
 */
export async function getDashboardMetricsAction(): Promise<DashboardMetrics | null> {
  try {
    // Obter workspace atual
    const currentWorkspace = await getCurrentWorkspaceAction();

    if (!currentWorkspace) {
      return null;
    }

    // Buscar leads e campanhas em paralelo
    const [leads, campaigns] = await Promise.all([
      getLeadsAction(currentWorkspace.id),
      getCampaignsAction(currentWorkspace.id),
    ]);

    // Calcular métricas
    const leadsByStage = getLeadsCountByStage(leads);
    const qualifiedLeads =
      leadsByStage.qualificado + leadsByStage.reuniao_agendada;
    const activeCampaigns = campaigns.filter(
      (c) => c.status === "active",
    ).length;
    const meetingsScheduled = leadsByStage.reuniao_agendada;

    return {
      totalLeads: leads.length,
      qualifiedLeads,
      activeCampaigns,
      meetingsScheduled,
      leadsByStage,
      leads,
      campaigns,
    };
  } catch (error) {
    console.error("Error in getDashboardMetricsAction:", error);
    return null;
  }
}

/**
 * Server Action para buscar leads do workspace atual
 */
export async function getCurrentWorkspaceLeadsAction(): Promise<Lead[]> {
  try {
    const currentWorkspace = await getCurrentWorkspaceAction();

    if (!currentWorkspace) {
      return [];
    }

    return getLeadsAction(currentWorkspace.id);
  } catch (error) {
    console.error("Error in getCurrentWorkspaceLeadsAction:", error);
    return [];
  }
}

/**
 * Server Action para buscar campanhas do workspace atual
 */
export async function getCurrentWorkspaceCampaignsAction(): Promise<
  Campaign[]
> {
  try {
    const currentWorkspace = await getCurrentWorkspaceAction();

    if (!currentWorkspace) {
      return [];
    }

    return getCampaignsAction(currentWorkspace.id);
  } catch (error) {
    console.error("Error in getCurrentWorkspaceCampaignsAction:", error);
    return [];
  }
}

/**
 * Server Action para buscar membros do workspace atual como User[]
 * Usado para o ResponsibleSelect
 */
export async function getCurrentWorkspaceUsersAction(): Promise<User[]> {
  try {
    const currentWorkspace = await getCurrentWorkspaceAction();

    if (!currentWorkspace) {
      return [];
    }

    const members = await getWorkspaceMembersAction(currentWorkspace.id);

    // Converter WorkspaceMember[] para User[]
    return members.map((member) => ({
      id: member.userId,
      email: member.user.email,
      fullName: member.user.fullName,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
      createdAt: member.createdAt,
    }));
  } catch (error) {
    console.error("Error in getCurrentWorkspaceUsersAction:", error);
    return [];
  }
}
