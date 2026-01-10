"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import { validateLeadForStage } from "@/shared/lib/lead-utils";
import type {
  KanbanStage,
  Lead,
  LeadRow,
  ValidationError,
  PipelineConfig,
} from "@/shared/types/crm";

/**
 * Mapeia dados do banco para o tipo Lead
 */
function mapDbLeadToLead(dbLead: LeadRow): Lead {
  return {
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone,
    position: dbLead.position,
    company: dbLead.company,
    segment: dbLead.segment || undefined,
    revenue: dbLead.revenue || undefined,
    linkedIn: dbLead.linkedin || undefined,
    notes: dbLead.notes || undefined,
    messages: (dbLead as Record<string, unknown>).messages as string || undefined,
    avatarUrl: dbLead.avatar_url || undefined,
    stage: dbLead.stage as KanbanStage,
    campaignId: dbLead.campaign_id || undefined,
    responsibleId: dbLead.responsible_id || undefined,
    workspaceId: dbLead.workspace_id,
    createdAt: new Date(dbLead.created_at),
    updatedAt: new Date(dbLead.updated_at),
  };
}

/**
 * Server Action para criar lead
 */
export async function createLeadAction(
  lead: Omit<Lead, "id" | "createdAt" | "updatedAt">,
): Promise<Lead> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(lead.workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const supabase = await createClient();

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
        segment: lead.segment ?? null,
        revenue: lead.revenue ?? null,
        linkedin: lead.linkedIn ?? null,
        notes: lead.notes ?? null,
        avatar_url: lead.avatarUrl ?? null,
        stage: lead.stage,
        campaign_id: lead.campaignId ?? null,
        responsible_id: lead.responsibleId ?? null,
        custom_fields: null,
      })
      .select()
      .single();

    if (error || !dbLead) {
      console.error("Error creating lead:", error);
      throw new Error(error?.message || "Não foi possível criar o lead");
    }

    revalidatePath("/pipeline");

    return mapDbLeadToLead(dbLead);
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
    if (updates.responsibleId !== undefined)
      dbUpdates.responsible_id = updates.responsibleId ?? null;

    // Atualizar lead no banco
    const { error } = await supabase
      .from("leads")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating lead:", error);
      throw new Error(error.message || "Não foi possível atualizar o lead");
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
): Promise<ValidationError[] | null> {
  try {
    const supabase = await createClient();

    // Buscar lead atual
    const { data: dbLead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
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

    // Atualizar stage do lead
    await updateLeadAction(leadId, { stage: newStage });

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

    // Buscar leads do workspace
    const { data: dbLeads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
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

    // Buscar lead
    const { data: dbLead, error } = await supabase
      .from("leads")
      .select("*")
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
 * Server Action para deletar lead
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

    revalidatePath("/pipeline");
  } catch (error) {
    console.error("Error in deleteLeadAction:", error);
    throw error;
  }
}
