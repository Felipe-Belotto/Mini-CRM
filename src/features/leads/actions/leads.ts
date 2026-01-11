"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess, getCurrentUser } from "@/shared/lib/supabase/utils";
import { validateLeadForStage } from "@/shared/lib/lead-utils";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { createActivityAction } from "@/features/activities/actions/activities";
import { KANBAN_COLUMNS } from "@/shared/types/crm";
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
 * Função auxiliar para gerar mensagens automaticamente quando um lead atinge uma etapa gatilho
 * Executa em background sem bloquear a resposta
 */
async function triggerAutoMessageGeneration(
  leadId: string,
  stage: KanbanStage,
  workspaceId: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Buscar campanhas ativas com trigger_stage correspondente à etapa
    const { data: triggerCampaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .eq("trigger_stage", stage);

    // Gerar mensagens automaticamente em background (não bloqueia a resposta)
    if (!campaignsError && triggerCampaigns && triggerCampaigns.length > 0) {
      const { generateAutoMessagesForLeadAction } = await import("@/features/ai-messages/actions/ai-messages");
      
      // Processar em background sem bloquear
      Promise.all(
        triggerCampaigns.map(campaign =>
          generateAutoMessagesForLeadAction(leadId, campaign.id).catch(err =>
            console.error(`Error generating auto messages for lead ${leadId} and campaign ${campaign.id}:`, err)
          )
        )
      ).catch(err => console.error("Error in background message generation:", err));
    }
  } catch (error) {
    // Não propagar erro - geração automática não deve bloquear operações principais
    console.error("Error triggering auto message generation:", error);
  }
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

    // Registrar atividades de mudança de etapa para cada lead promovido
    const currentUser = await getCurrentUser();
    const { createActivityAction } = await import("@/features/activities/actions/activities");
    
    for (const leadId of eligibleLeadIds) {
      await createActivityAction({
        leadId,
        workspaceId,
        userId: currentUser?.id,
        actionType: "stage_changed",
        oldValue: "base",
        newValue: "lead_mapeado",
        metadata: {
          oldStageName: "Base",
          newStageName: "Lead Mapeado",
        },
      }).catch(err => console.error("Error creating activity:", err));
    }

    // Gerar mensagens automaticamente para cada lead promovido (usa função auxiliar)
    for (const leadId of eligibleLeadIds) {
      triggerAutoMessageGeneration(leadId, "lead_mapeado", workspaceId);
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

    // Registrar atividade de criação
    const currentUser = await getCurrentUser();
    await createActivityAction({
      leadId: dbLead.id,
      workspaceId: lead.workspaceId,
      userId: currentUser?.id,
      actionType: "created",
      metadata: {
        leadName: lead.name,
        stage: lead.stage,
      },
    });

    // Gerar mensagens automaticamente se o lead foi criado em uma etapa gatilho
    triggerAutoMessageGeneration(dbLead.id, lead.stage, lead.workspaceId);

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
    // Buscar lead atual completo para comparação
    const supabase = await createClient();
    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("*, lead_responsibles(user_id)")
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

    const currentUser = await getCurrentUser();

    // Preparar updates para o banco e rastrear alterações
    const dbUpdates: Record<string, unknown> = {};
    const fieldChanges: Array<{ field: string; oldValue: unknown; newValue: unknown; label: string }> = [];

    const fieldLabels: Record<string, string> = {
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      position: "Cargo",
      company: "Empresa",
      origin: "Origem",
      segment: "Segmento",
      revenue: "Faturamento",
      linkedIn: "LinkedIn",
      notes: "Notas",
      avatarUrl: "Avatar",
      stage: "Etapa",
      campaignId: "Campanha",
    };

    if (updates.name !== undefined && updates.name !== existingLead.name) {
      dbUpdates.name = updates.name;
      fieldChanges.push({ field: "name", oldValue: existingLead.name, newValue: updates.name, label: fieldLabels.name });
    }
    if (updates.email !== undefined && updates.email !== existingLead.email) {
      dbUpdates.email = updates.email;
      fieldChanges.push({ field: "email", oldValue: existingLead.email, newValue: updates.email, label: fieldLabels.email });
    }
    if (updates.phone !== undefined && updates.phone !== existingLead.phone) {
      dbUpdates.phone = updates.phone;
      fieldChanges.push({ field: "phone", oldValue: existingLead.phone, newValue: updates.phone, label: fieldLabels.phone });
    }
    if (updates.position !== undefined && updates.position !== existingLead.position) {
      dbUpdates.position = updates.position;
      fieldChanges.push({ field: "position", oldValue: existingLead.position, newValue: updates.position, label: fieldLabels.position });
    }
    if (updates.company !== undefined && updates.company !== existingLead.company) {
      dbUpdates.company = updates.company;
      fieldChanges.push({ field: "company", oldValue: existingLead.company, newValue: updates.company, label: fieldLabels.company });
    }
    if (updates.origin !== undefined && updates.origin !== existingLead.origin) {
      dbUpdates.origin = updates.origin ?? null;
      fieldChanges.push({ field: "origin", oldValue: existingLead.origin, newValue: updates.origin, label: fieldLabels.origin });
    }
    if (updates.segment !== undefined && updates.segment !== existingLead.segment) {
      dbUpdates.segment = updates.segment ?? null;
      fieldChanges.push({ field: "segment", oldValue: existingLead.segment, newValue: updates.segment, label: fieldLabels.segment });
    }
    if (updates.revenue !== undefined && updates.revenue !== existingLead.revenue) {
      dbUpdates.revenue = updates.revenue ?? null;
      fieldChanges.push({ field: "revenue", oldValue: existingLead.revenue, newValue: updates.revenue, label: fieldLabels.revenue });
    }
    if (updates.linkedIn !== undefined && updates.linkedIn !== existingLead.linkedin) {
      dbUpdates.linkedin = updates.linkedIn ?? null;
      fieldChanges.push({ field: "linkedIn", oldValue: existingLead.linkedin, newValue: updates.linkedIn, label: fieldLabels.linkedIn });
    }
    if (updates.notes !== undefined && updates.notes !== existingLead.notes) {
      dbUpdates.notes = updates.notes ?? null;
      fieldChanges.push({ field: "notes", oldValue: existingLead.notes, newValue: updates.notes, label: fieldLabels.notes });
    }
    if (updates.avatarUrl !== undefined && updates.avatarUrl !== existingLead.avatar_url) {
      dbUpdates.avatar_url = updates.avatarUrl ?? null;
      fieldChanges.push({ field: "avatarUrl", oldValue: existingLead.avatar_url, newValue: updates.avatarUrl, label: fieldLabels.avatarUrl });
    }
    if (updates.stage !== undefined && updates.stage !== existingLead.stage) {
      dbUpdates.stage = updates.stage;
      fieldChanges.push({ field: "stage", oldValue: existingLead.stage, newValue: updates.stage, label: fieldLabels.stage });
    }
    if (updates.campaignId !== undefined && updates.campaignId !== existingLead.campaign_id) {
      dbUpdates.campaign_id = updates.campaignId ?? null;
      fieldChanges.push({ field: "campaignId", oldValue: existingLead.campaign_id, newValue: updates.campaignId, label: fieldLabels.campaignId });
    }

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

      // Registrar atividades para cada campo alterado
      for (const change of fieldChanges) {
        await createActivityAction({
          leadId: id,
          workspaceId: existingLead.workspace_id,
          userId: currentUser?.id,
          actionType: "field_updated",
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          metadata: { fieldLabel: change.label },
        });
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

      // Registrar atividade de alteração de responsáveis
      const oldResponsibles = existingLead.lead_responsibles?.map((r: { user_id: string }) => r.user_id) || [];
      if (JSON.stringify(oldResponsibles.sort()) !== JSON.stringify([...updates.responsibleIds].sort())) {
        await createActivityAction({
          leadId: id,
          workspaceId: existingLead.workspace_id,
          userId: currentUser?.id,
          actionType: "field_updated",
          fieldName: "responsibleIds",
          oldValue: oldResponsibles,
          newValue: updates.responsibleIds,
          metadata: { fieldLabel: "Responsáveis" },
        });
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

    const oldStage = lead.stage;

    // Atualizar stage e sort_order do lead
    const { error } = await supabase
      .from("leads")
      .update({ stage: newStage, sort_order: sortOrder })
      .eq("id", leadId);

    if (error) {
      console.error("Error moving lead:", error);
      throw new Error(error.message || "Não foi possível mover o lead");
    }

    // Registrar atividade de mudança de etapa
    const currentUser = await getCurrentUser();
    const oldStageName = KANBAN_COLUMNS.find(c => c.id === oldStage)?.title || oldStage;
    const newStageName = KANBAN_COLUMNS.find(c => c.id === newStage)?.title || newStage;
    
    await createActivityAction({
      leadId,
      workspaceId: dbLead.workspace_id,
      userId: currentUser?.id,
      actionType: "stage_changed",
      oldValue: oldStage,
      newValue: newStage,
      metadata: {
        oldStageName,
        newStageName,
      },
    });

    // Gerar mensagens automaticamente se o lead foi movido para uma etapa gatilho
    triggerAutoMessageGeneration(leadId, newStage, dbLead.workspace_id);

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

    // Buscar contagem de mensagens para todos os leads de uma vez
    const leadIds = dbLeads.map((l) => l.id);
    const messagesCountMap = new Map<string, number>();

    if (leadIds.length > 0) {
      const { data: messagesData } = await supabase
        .from("lead_messages_sent")
        .select("lead_id")
        .in("lead_id", leadIds);

      if (messagesData) {
        for (const msg of messagesData) {
          const currentCount = messagesCountMap.get(msg.lead_id) || 0;
          messagesCountMap.set(msg.lead_id, currentCount + 1);
        }
      }
    }

    // Adicionar contagem de mensagens aos leads (como JSON string para compatibilidade)
    const leadsWithCounts = dbLeads.map((lead) => {
      const messagesCount = messagesCountMap.get(lead.id) || 0;
      // Converter contagem para formato JSON array para compatibilidade com countJsonArray
      const messagesJson = messagesCount > 0 ? JSON.stringify(Array(messagesCount).fill(null)) : null;
      return {
        ...lead,
        messages: messagesJson || lead.messages,
      };
    });

    return leadsWithCounts.map(mapDbLeadToLead);
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
      .select("workspace_id, name")
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

    // Registrar atividade de arquivamento
    const currentUser = await getCurrentUser();
    await createActivityAction({
      leadId,
      workspaceId: existingLead.workspace_id,
      userId: currentUser?.id,
      actionType: "archived",
      metadata: { leadName: existingLead.name },
    });
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
      .select("workspace_id, name")
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

    // Registrar atividade de restauração
    const currentUser = await getCurrentUser();
    await createActivityAction({
      leadId,
      workspaceId: existingLead.workspace_id,
      userId: currentUser?.id,
      actionType: "restored",
      metadata: { leadName: existingLead.name },
    });
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

    // Buscar contagem de mensagens para todos os leads arquivados
    const leadIds = dbLeads.map((l) => l.id);
    const messagesCountMap = new Map<string, number>();

    if (leadIds.length > 0) {
      const { data: messagesData } = await supabase
        .from("lead_messages_sent")
        .select("lead_id")
        .in("lead_id", leadIds);

      if (messagesData) {
        for (const msg of messagesData) {
          const currentCount = messagesCountMap.get(msg.lead_id) || 0;
          messagesCountMap.set(msg.lead_id, currentCount + 1);
        }
      }
    }

    // Adicionar contagem de mensagens aos leads (como JSON string para compatibilidade)
    const leadsWithCounts = dbLeads.map((lead) => {
      const messagesCount = messagesCountMap.get(lead.id) || 0;
      // Converter contagem para formato JSON array para compatibilidade com countJsonArray
      const messagesJson = messagesCount > 0 ? JSON.stringify(Array(messagesCount).fill(null)) : null;
      return {
        ...lead,
        messages: messagesJson || lead.messages,
      };
    });

    return leadsWithCounts.map(mapDbLeadToLead);
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
