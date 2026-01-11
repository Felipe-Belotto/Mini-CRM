"use server";

import { getCampaignsAction } from "@/features/campaigns/actions/campaigns";
import { getCustomFieldsAction } from "@/features/custom-fields/actions/custom-fields";
import { getLeadsAction, getArchivedLeadsAction } from "@/features/leads/actions/leads";
import { getWorkspaceMembersAction } from "@/features/workspaces/actions/members";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import type { Campaign, CustomField, KanbanStage, Lead, User } from "@/shared/types/crm";
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
export async function getCurrentWorkspaceLeadsAction(workspaceId?: string): Promise<Lead[]> {
  try {
    const finalWorkspaceId = workspaceId || (await getCurrentWorkspaceAction())?.id;

    if (!finalWorkspaceId) {
      return [];
    }

    return getLeadsAction(finalWorkspaceId);
  } catch (error) {
    console.error("Error in getCurrentWorkspaceLeadsAction:", error);
    return [];
  }
}

/**
 * Server Action para buscar campanhas do workspace atual
 */
export async function getCurrentWorkspaceCampaignsAction(workspaceId?: string): Promise<
  Campaign[]
> {
  try {
    const finalWorkspaceId = workspaceId || (await getCurrentWorkspaceAction())?.id;

    if (!finalWorkspaceId) {
      return [];
    }

    return getCampaignsAction(finalWorkspaceId);
  } catch (error) {
    console.error("Error in getCurrentWorkspaceCampaignsAction:", error);
    return [];
  }
}

/**
 * Server Action para buscar membros do workspace atual como User[]
 * Usado para o ResponsibleSelect
 */
export async function getCurrentWorkspaceUsersAction(workspaceId?: string): Promise<User[]> {
  try {
    const finalWorkspaceId = workspaceId || (await getCurrentWorkspaceAction())?.id;

    if (!finalWorkspaceId) {
      return [];
    }

    const members = await getWorkspaceMembersAction(finalWorkspaceId);

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

/**
 * Server Action para buscar campos personalizados do workspace atual
 */
export async function getCurrentWorkspaceCustomFieldsAction(workspaceId?: string): Promise<CustomField[]> {
  try {
    const finalWorkspaceId = workspaceId || (await getCurrentWorkspaceAction())?.id;

    if (!finalWorkspaceId) {
      return [];
    }

    return getCustomFieldsAction(finalWorkspaceId);
  } catch (error) {
    console.error("Error in getCurrentWorkspaceCustomFieldsAction:", error);
    return [];
  }
}

/**
 * Server Action para buscar leads arquivados do workspace atual
 */
export async function getCurrentWorkspaceArchivedLeadsAction(workspaceId?: string): Promise<Lead[]> {
  try {
    const finalWorkspaceId = workspaceId || (await getCurrentWorkspaceAction())?.id;

    if (!finalWorkspaceId) {
      return [];
    }

    return getArchivedLeadsAction(finalWorkspaceId);
  } catch (error) {
    console.error("Error in getCurrentWorkspaceArchivedLeadsAction:", error);
    return [];
  }
}
