"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import { validateLeadForStage } from "@/shared/lib/lead-utils";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import type {
  KanbanStage,
  Lead,
  LeadRow,
  ValidationError,
  PipelineConfig,
} from "@/shared/types/crm";
import { isLeadEligibleForPromotion } from "../lib/lead-utils";

export interface PromoteLeadsResult {
  success: boolean;
  promotedCount: number;
  eligibleCount: number;
  error?: string;
}

/**
 * Server Action para promover leads elegíveis de "base" para "lead_mapeado"
 */
export async function promoteEligibleLeadsAction(): Promise<PromoteLeadsResult> {
  try {
    await requireAuth();
    const currentWorkspace = await getCurrentWorkspaceAction();
    
    if (!currentWorkspace) {
      return {
        success: false,
        promotedCount: 0,
        eligibleCount: 0,
        error: "Workspace não encontrado",
      };
    }

    const workspaceId = currentWorkspace.id;

    const supabase = await createClient();

    // Buscar todos os leads em "base" do workspace
    const { data: baseLeads, error: fetchError } = await supabase
      .from("leads")
      .select("*, lead_responsibles(user_id)")
      .eq("workspace_id", workspaceId)
      .eq("stage", "base")
      .is("archived_at", null);

    if (fetchError) {
      console.error("Error fetching base leads:", fetchError);
      return {
        success: false,
        promotedCount: 0,
        eligibleCount: 0,
        error: "Erro ao buscar leads",
      };
    }

    if (!baseLeads || baseLeads.length === 0) {
      return {
        success: true,
        promotedCount: 0,
        eligibleCount: 0,
      };
    }

    // Mapear e filtrar leads elegíveis
    const eligibleLeadIds: string[] = [];
    
    for (const dbLead of baseLeads) {
      const lead = mapDbLeadToLead(dbLead);
      if (isLeadEligibleForPromotion(lead)) {
        eligibleLeadIds.push(lead.id);
      }
    }

    if (eligibleLeadIds.length === 0) {
      return {
        success: true,
        promotedCount: 0,
        eligibleCount: 0,
      };
    }

    // Atualizar todos os leads elegíveis para "lead_mapeado"
    const { error: updateError } = await supabase
      .from("leads")
      .update({ stage: "lead_mapeado" })
      .in("id", eligibleLeadIds);

    if (updateError) {
      console.error("Error promoting leads:", updateError);
      return {
        success: false,
        promotedCount: 0,
        eligibleCount: eligibleLeadIds.length,
        error: "Erro ao promover leads",
      };
    }

    revalidatePath("/pipeline");

    return {
      success: true,
      promotedCount: eligibleLeadIds.length,
      eligibleCount: eligibleLeadIds.length,
    };
  } catch (error) {
    console.error("Error in promoteEligibleLeadsAction:", error);
    return {
      success: false,
      promotedCount: 0,
      eligibleCount: 0,
      error: "Erro inesperado ao promover leads",
    };
  }
}

interface LeadWithResponsibles extends LeadRow {
  lead_responsibles?: { user_id: string }[];
}

/**
 * Mapeia dados do banco para o tipo Lead
 */
function mapDbLeadToLead(dbLead: LeadWithResponsibles): Lead {
  return {
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone,
    position: dbLead.position,
    company: dbLead.company,
    origin: dbLead.origin || undefined,
    segment: dbLead.segment || undefined,
    revenue: dbLead.revenue || undefined,
    linkedIn: dbLead.linkedin || undefined,
    notes: dbLead.notes || undefined,
    messages: dbLead.messages || undefined,
    avatarUrl: dbLead.avatar_url || undefined,
    stage: dbLead.stage as KanbanStage,
    campaignId: dbLead.campaign_id || undefined,
    responsibleIds: dbLead.lead_responsibles?.map(r => r.user_id) || [],
    workspaceId: dbLead.workspace_id,
    sortOrder: dbLead.sort_order,
    createdAt: new Date(dbLead.created_at),
    updatedAt: new Date(dbLead.updated_at),
    archivedAt: dbLead.archived_at ? new Date(dbLead.archived_at) : undefined,
  };
}

/**
 * Server Action para criar lead
 */
export async function createLeadAction(
  lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "sortOrder">,
): Promise<Lead> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(lead.workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const supabase = await createClient();

    // Obter o próximo sort_order para a coluna
    const nextSortOrder = await getNextSortOrderAction(lead.workspaceId, lead.stage);

    // Criar lead no banco
    const { data: dbLead, error } = await supabase
      .from("leads")
      .insert({
        workspace_id: lead.workspaceId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        position: lead.position,
        company: lead.company,
        origin: lead.origin ?? null,
        segment: lead.segment ?? null,
        revenue: lead.revenue ?? null,
        linkedin: lead.linkedIn ?? null,
        notes: lead.notes ?? null,
        avatar_url: lead.avatarUrl ?? null,
        stage: lead.stage,
        campaign_id: lead.campaignId ?? null,
        custom_fields: null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error || !dbLead) {
      console.error("Error creating lead:", error);
      throw new Error(error?.message || "Não foi possível criar o lead");
    }

    // Inserir responsáveis na tabela de relacionamento
    if (lead.responsibleIds && lead.responsibleIds.length > 0) {
      const responsiblesData = lead.responsibleIds.map(userId => ({
        lead_id: dbLead.id,
        user_id: userId,
      }));

      const { error: responsiblesError } = await supabase
        .from("lead_responsibles")
        .insert(responsiblesData);

      if (responsiblesError) {
        console.error("Error inserting lead responsibles:", responsiblesError);
      }
    }

    revalidatePath("/pipeline");

    return {
      ...mapDbLeadToLead(dbLead),
      responsibleIds: lead.responsibleIds || [],
    };
  } catch (error) {
    console.error("Error in createLeadAction:", error);
    throw error;
  }
}

/**
 * Server Action para atualizar lead
 */
export async function updateLeadAction(
  id: string,
  updates: Partial<Lead>,
): Promise<void> {
  try {
    // Buscar lead para verificar workspace
    const supabase = await createClient();
    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingLead) {
      throw new Error("Lead não encontrado");
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingLead.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    // Preparar updates para o banco
    const dbUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.position !== undefined) dbUpdates.position = updates.position;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.origin !== undefined)
      dbUpdates.origin = updates.origin ?? null;
    if (updates.segment !== undefined)
      dbUpdates.segment = updates.segment ?? null;
    if (updates.revenue !== undefined)
      dbUpdates.revenue = updates.revenue ?? null;
    if (updates.linkedIn !== undefined)
      dbUpdates.linkedin = updates.linkedIn ?? null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes ?? null;
    if (updates.avatarUrl !== undefined)
      dbUpdates.avatar_url = updates.avatarUrl ?? null;
    if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
    if (updates.campaignId !== undefined)
      dbUpdates.campaign_id = updates.campaignId ?? null;

    // Atualizar lead no banco (se houver campos para atualizar)
    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase
        .from("leads")
        .update(dbUpdates)
        .eq("id", id);

      if (error) {
        console.error("Error updating lead:", error);
        throw new Error(error.message || "Não foi possível atualizar o lead");
      }
    }

    // Atualizar responsáveis se fornecido
    if (updates.responsibleIds !== undefined) {
      // Remover todos os responsáveis atuais
      await supabase
        .from("lead_responsibles")
        .delete()
        .eq("lead_id", id);

      // Inserir novos responsáveis
      if (updates.responsibleIds.length > 0) {
        const responsiblesData = updates.responsibleIds.map(userId => ({
          lead_id: id,
          user_id: userId,
        }));

        const { error: responsiblesError } = await supabase
          .from("lead_responsibles")
          .insert(responsiblesData);

        if (responsiblesError) {
          console.error("Error updating lead responsibles:", responsiblesError);
        }
      }
    }

    revalidatePath("/pipeline");
  } catch (error) {
    console.error("Error in updateLeadAction:", error);
    throw error;
  }
}

/**
 * Server Action para mover lead para outra etapa
 */
export async function moveLeadAction(
  leadId: string,
  newStage: KanbanStage,
  pipelineConfig?: PipelineConfig | null,
  newSortOrder?: number,
): Promise<ValidationError[] | null> {
  try {
    const supabase = await createClient();

    // Buscar lead atual com responsáveis
    const { data: dbLead, error: fetchError } = await supabase
      .from("leads")
      .select("*, lead_responsibles(user_id)")
      .eq("id", leadId)
      .single();

    if (fetchError || !dbLead) {
      throw new Error("Lead não encontrado");
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(dbLead.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    // Converter para tipo Lead
    const lead = mapDbLeadToLead(dbLead);

    // Validar lead para a nova etapa
    const errors = validateLeadForStage(lead, newStage, pipelineConfig);
    if (errors.length > 0) {
      return errors;
    }

    // Obter o próximo sort_order para a nova coluna se não foi fornecido
    const sortOrder = newSortOrder ?? await getNextSortOrderAction(dbLead.workspace_id, newStage);

    // Atualizar stage e sort_order do lead
    const { error } = await supabase
      .from("leads")
      .update({ stage: newStage, sort_order: sortOrder })
      .eq("id", leadId);

    if (error) {
      console.error("Error moving lead:", error);
      throw new Error(error.message || "Não foi possível mover o lead");
    }

    revalidatePath("/pipeline");

    return null;
  } catch (error) {
    console.error("Error in moveLeadAction:", error);
    throw error;
  }
}

/**
 * Server Action para buscar leads de um workspace
 */
export async function getLeadsAction(
  workspaceId: string,
): Promise<Lead[]> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const supabase = await createClient();

    // Buscar leads ativos (não arquivados) do workspace com responsáveis
    const { data: dbLeads, error } = await supabase
      .from("leads")
      .select("*, lead_responsibles(user_id)")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching leads:", JSON.stringify(error, null, 2));
      console.error("Error raw:", error);
      return [];
    }

    if (!dbLeads) {
      return [];
    }

    return dbLeads.map(mapDbLeadToLead);
  } catch (error) {
    console.error("Error in getLeadsAction:", error);
    return [];
  }
}

/**
 * Server Action para buscar lead por ID
 */
export async function getLeadByIdAction(
  leadId: string,
): Promise<Lead | null> {
  try {
    const supabase = await createClient();

    // Buscar lead com responsáveis
    const { data: dbLead, error } = await supabase
      .from("leads")
      .select("*, lead_responsibles(user_id)")
      .eq("id", leadId)
      .single();

    if (error || !dbLead) {
      console.error("Error fetching lead:", error);
      return null;
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(dbLead.workspace_id);

    if (!hasAccess) {
      return null;
    }

    return mapDbLeadToLead(dbLead);
  } catch (error) {
    console.error("Error in getLeadByIdAction:", error);
    return null;
  }
}

/**
 * Server Action para arquivar lead (soft delete)
 */
export async function archiveLeadAction(leadId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadId)
      .single();

    if (fetchError || !existingLead) {
      throw new Error("Lead não encontrado");
    }

    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingLead.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const { error } = await supabase
      .from("leads")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", leadId);

    if (error) {
      console.error("Error archiving lead:", error);
      throw new Error(error.message || "Não foi possível arquivar o lead");
    }
    // Não usamos revalidatePath aqui pois o cliente usa optimistic updates
  } catch (error) {
    console.error("Error in archiveLeadAction:", error);
    throw error;
  }
}

/**
 * Server Action para restaurar lead arquivado
 */
export async function restoreLeadAction(leadId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadId)
      .single();

    if (fetchError || !existingLead) {
      throw new Error("Lead não encontrado");
    }

    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingLead.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const { error } = await supabase
      .from("leads")
      .update({ archived_at: null })
      .eq("id", leadId);

    if (error) {
      console.error("Error restoring lead:", error);
      throw new Error(error.message || "Não foi possível restaurar o lead");
    }
    // Não usamos revalidatePath aqui pois o cliente usa optimistic updates
  } catch (error) {
    console.error("Error in restoreLeadAction:", error);
    throw error;
  }
}

/**
 * Server Action para buscar leads arquivados de um workspace
 */
export async function getArchivedLeadsAction(
  workspaceId: string,
): Promise<Lead[]> {
  try {
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const supabase = await createClient();

    const { data: dbLeads, error } = await supabase
      .from("leads")
      .select("*, lead_responsibles(user_id)")
      .eq("workspace_id", workspaceId)
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });

    if (error) {
      console.error("Error fetching archived leads:", error);
      return [];
    }

    if (!dbLeads) {
      return [];
    }

    return dbLeads.map(mapDbLeadToLead);
  } catch (error) {
    console.error("Error in getArchivedLeadsAction:", error);
    return [];
  }
}

/**
 * Server Action para deletar lead permanentemente
 */
export async function deleteLeadAction(leadId: string): Promise<void> {
  try {
    // Buscar lead para verificar workspace
    const supabase = await createClient();
    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadId)
      .single();

    if (fetchError || !existingLead) {
      throw new Error("Lead não encontrado");
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingLead.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    // Deletar lead
    const { error } = await supabase.from("leads").delete().eq("id", leadId);

    if (error) {
      console.error("Error deleting lead:", error);
      throw new Error(error.message || "Não foi possível deletar o lead");
    }
    // Não usamos revalidatePath aqui pois o cliente usa optimistic updates
  } catch (error) {
    console.error("Error in deleteLeadAction:", error);
    throw error;
  }
}

/**
 * Server Action para reordenar leads dentro de uma coluna do Kanban
 * @param leadId ID do lead sendo movido
 * @param newSortOrders Array com os novos sort_orders de todos os leads afetados
 */
export async function reorderLeadsAction(
  leadUpdates: { id: string; sortOrder: number }[],
): Promise<void> {
  try {
    if (leadUpdates.length === 0) return;

    const supabase = await createClient();

    // Buscar primeiro lead para verificar workspace
    const { data: firstLead, error: fetchError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadUpdates[0].id)
      .single();

    if (fetchError || !firstLead) {
      throw new Error("Lead não encontrado");
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(firstLead.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    // Atualizar sort_order de cada lead
    for (const update of leadUpdates) {
      const { error } = await supabase
        .from("leads")
        .update({ sort_order: update.sortOrder })
        .eq("id", update.id);

      if (error) {
        console.error("Error updating lead sort_order:", error);
        throw new Error(error.message || "Não foi possível reordenar os leads");
      }
    }

    revalidatePath("/pipeline");
  } catch (error) {
    console.error("Error in reorderLeadsAction:", error);
    throw error;
  }
}

/**
 * Server Action para obter o próximo sort_order disponível para um novo lead
 */
export async function getNextSortOrderAction(
  workspaceId: string,
  stage: KanbanStage,
): Promise<number> {
  try {
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const supabase = await createClient();

    // Buscar o maior sort_order atual na coluna
    const { data, error } = await supabase
      .from("leads")
      .select("sort_order")
      .eq("workspace_id", workspaceId)
      .eq("stage", stage)
      .is("archived_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching max sort_order:", error);
      return 1;
    }

    return (data?.sort_order ?? 0) + 1;
  } catch (error) {
    console.error("Error in getNextSortOrderAction:", error);
    return 1;
  }
}
