"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import type { Campaign, CampaignRow, KanbanStage } from "@/shared/types/crm";

/**
 * Mapeia dados do banco para o tipo Campaign
 */
function mapDbCampaignToCampaign(
  dbCampaign: CampaignRow,
  leadsCount: number,
): Campaign {
  return {
    id: dbCampaign.id,
    name: dbCampaign.name,
    context: dbCampaign.context,
    voiceTone: dbCampaign.voice_tone as "formal" | "informal" | "neutro",
    aiInstructions: dbCampaign.ai_instructions,
    status: dbCampaign.status as "active" | "paused" | "finished",
    triggerStage: dbCampaign.trigger_stage
      ? (dbCampaign.trigger_stage as KanbanStage)
      : undefined,
    workspaceId: dbCampaign.workspace_id,
    leadsCount,
    createdAt: new Date(dbCampaign.created_at),
  };
}

/**
 * Server Action wrapper para criar campanha (retorna void para compatibilidade com componentes)
 */
export async function addCampaignActionVoid(
  campaign: Omit<Campaign, "id" | "createdAt" | "leadsCount">,
): Promise<void> {
  await addCampaignAction(campaign);
}

/**
 * Server Action para criar campanha a partir de form data (obtém workspace atual automaticamente)
 */
export async function addCampaignFromFormAction(
  formData: Omit<Campaign, "id" | "createdAt" | "leadsCount" | "workspaceId">,
): Promise<void> {
  const { getCurrentWorkspaceAction } = await import("@/features/workspaces/actions/workspaces");
  const currentWorkspace = await getCurrentWorkspaceAction();
  
  if (!currentWorkspace) {
    throw new Error("Nenhum workspace encontrado");
  }

  const campaign: Omit<Campaign, "id" | "createdAt" | "leadsCount"> = {
    ...formData,
    workspaceId: currentWorkspace.id,
  };
  
  await addCampaignAction(campaign);
}

/**
 * Server Action para criar campanha
 */
export async function addCampaignAction(
  campaign: Omit<Campaign, "id" | "createdAt" | "leadsCount">,
): Promise<Campaign> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(campaign.workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const supabase = await createClient();

    // Criar campanha no banco
    const { data: dbCampaign, error } = await supabase
      .from("campaigns")
      .insert({
        workspace_id: campaign.workspaceId,
        name: campaign.name,
        context: campaign.context,
        voice_tone: campaign.voiceTone,
        ai_instructions: campaign.aiInstructions,
        status: campaign.status,
        trigger_stage: campaign.triggerStage ?? null,
      })
      .select()
      .single();

    if (error || !dbCampaign) {
      console.error("Error creating campaign:", error);
      throw new Error(error?.message || "Não foi possível criar a campanha");
    }

    return mapDbCampaignToCampaign(dbCampaign, 0);
  } catch (error) {
    console.error("Error in addCampaignAction:", error);
    throw error;
  }
}

/**
 * Server Action para listar campanhas de um workspace
 */
export async function getCampaignsAction(
  workspaceId: string,
): Promise<Campaign[]> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const supabase = await createClient();

    // Buscar campanhas do workspace
    const { data: dbCampaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }

    if (!dbCampaigns) {
      return [];
    }

    // Buscar contagem de leads para cada campanha
    const campaignsWithCounts = await Promise.all(
      dbCampaigns.map(async (dbCampaign) => {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", dbCampaign.id);

        return mapDbCampaignToCampaign(
          dbCampaign,
          count ?? 0,
        );
      }),
    );

    return campaignsWithCounts;
  } catch (error) {
    console.error("Error in getCampaignsAction:", error);
    return [];
  }
}

/**
 * Server Action para buscar campanha por ID
 */
export async function getCampaignByIdAction(
  campaignId: string,
): Promise<Campaign | null> {
  try {
    const supabase = await createClient();

    // Buscar campanha
    const { data: dbCampaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error || !dbCampaign) {
      console.error("Error fetching campaign:", error);
      return null;
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(dbCampaign.workspace_id);

    if (!hasAccess) {
      return null;
    }

    // Buscar contagem de leads
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", dbCampaign.id);

    return mapDbCampaignToCampaign(dbCampaign, count ?? 0);
  } catch (error) {
    console.error("Error in getCampaignByIdAction:", error);
    return null;
  }
}

/**
 * Server Action para atualizar campanha
 */
export async function updateCampaignAction(
  campaignId: string,
  updates: Partial<Omit<Campaign, "id" | "createdAt" | "leadsCount" | "workspaceId">>,
): Promise<void> {
  try {
    // Buscar campanha para verificar workspace
    const supabase = await createClient();
    const { data: existingCampaign, error: fetchError } = await supabase
      .from("campaigns")
      .select("workspace_id")
      .eq("id", campaignId)
      .single();

    if (fetchError || !existingCampaign) {
      throw new Error("Campanha não encontrada");
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingCampaign.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    // Preparar updates para o banco
    const dbUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.context !== undefined) dbUpdates.context = updates.context;
    if (updates.voiceTone !== undefined) dbUpdates.voice_tone = updates.voiceTone;
    if (updates.aiInstructions !== undefined)
      dbUpdates.ai_instructions = updates.aiInstructions;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.triggerStage !== undefined)
      dbUpdates.trigger_stage = updates.triggerStage ?? null;

    // Atualizar campanha no banco
    const { error } = await supabase
      .from("campaigns")
      .update(dbUpdates)
      .eq("id", campaignId);

    if (error) {
      console.error("Error updating campaign:", error);
      throw new Error(error.message || "Não foi possível atualizar a campanha");
    }
  } catch (error) {
    console.error("Error in updateCampaignAction:", error);
    throw error;
  }
}

/**
 * Server Action para deletar campanha
 */
export async function deleteCampaignAction(campaignId: string): Promise<void> {
  try {
    // Buscar campanha para verificar workspace
    const supabase = await createClient();
    const { data: existingCampaign, error: fetchError } = await supabase
      .from("campaigns")
      .select("workspace_id")
      .eq("id", campaignId)
      .single();

    if (fetchError || !existingCampaign) {
      throw new Error("Campanha não encontrada");
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingCampaign.workspace_id);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    // Deletar campanha (os leads serão atualizados para null no campaign_id devido ao ON DELETE SET NULL)
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) {
      console.error("Error deleting campaign:", error);
      throw new Error(error.message || "Não foi possível deletar a campanha");
    }
  } catch (error) {
    console.error("Error in deleteCampaignAction:", error);
    throw error;
  }
}
