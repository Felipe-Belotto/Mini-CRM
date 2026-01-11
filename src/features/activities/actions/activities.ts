"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import type { CreateActivityInput, LeadActivity } from "../types";

/**
 * Cria uma nova atividade para um lead
 * Esta função é chamada internamente pelas outras actions (leads, messages, etc.)
 */
export async function createActivityAction(
  input: CreateActivityInput
): Promise<void> {
  try {
    const supabase = await createClient();

    // Inserir atividade (campos JSONB não precisam de stringify)
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: input.leadId,
      workspace_id: input.workspaceId,
      user_id: input.userId || null,
      action_type: input.actionType,
      field_name: input.fieldName || null,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("Error creating activity:", error);
      // Não lançamos erro para não interromper a operação principal
    }
  } catch (error) {
    console.error("Error in createActivityAction:", error);
    // Silencioso para não afetar a operação principal
  }
}

/**
 * Busca atividades de um lead específico
 */
export async function getLeadActivitiesAction(
  leadId: string
): Promise<LeadActivity[]> {
  try {
    const supabase = await createClient();

    // Primeiro buscar o lead para verificar o workspace
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Lead not found:", leadError);
      return [];
    }

    // Verificar autenticação e acesso
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(lead.workspace_id);

    if (!hasAccess) {
      return [];
    }

    // Buscar atividades com dados do usuário
    const { data: activities, error } = await supabase
      .from("lead_activities")
      .select(`
        *,
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching activities:", error);
      return [];
    }

    if (!activities) {
      return [];
    }

    // Mapear para o tipo LeadActivity (campos JSONB já vêm como objetos)
    return activities.map((activity) => {
      const profile = activity.profiles as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      } | null;

      const fullName = profile
        ? profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name || profile.last_name || ""
        : "";

      return {
        id: activity.id,
        leadId: activity.lead_id,
        workspaceId: activity.workspace_id,
        userId: activity.user_id,
        actionType: activity.action_type as LeadActivity["actionType"],
        fieldName: activity.field_name,
        oldValue: activity.old_value ?? null,
        newValue: activity.new_value ?? null,
        metadata: activity.metadata ?? null,
        createdAt: new Date(activity.created_at),
        user: profile
          ? {
              id: profile.id,
              fullName,
              avatarUrl: profile.avatar_url || undefined,
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error("Error in getLeadActivitiesAction:", error);
    return [];
  }
}

/**
 * Busca atividades recentes de um workspace (para dashboard)
 */
export async function getRecentWorkspaceActivitiesAction(
  workspaceId: string,
  limit = 20
): Promise<LeadActivity[]> {
  try {
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return [];
    }

    const supabase = await createClient();

    const { data: activities, error } = await supabase
      .from("lead_activities")
      .select(`
        *,
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching workspace activities:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    if (!activities) {
      return [];
    }

    // Campos JSONB já vêm como objetos do Supabase
    return activities.map((activity) => {
      const profile = activity.profiles as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      } | null;

      const fullName = profile
        ? profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name || profile.last_name || ""
        : "";

      return {
        id: activity.id,
        leadId: activity.lead_id,
        workspaceId: activity.workspace_id,
        userId: activity.user_id,
        actionType: activity.action_type as LeadActivity["actionType"],
        fieldName: activity.field_name,
        oldValue: activity.old_value ?? null,
        newValue: activity.new_value ?? null,
        metadata: activity.metadata ?? null,
        createdAt: new Date(activity.created_at),
        user: profile
          ? {
              id: profile.id,
              fullName,
              avatarUrl: profile.avatar_url || undefined,
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error("Error in getRecentWorkspaceActivitiesAction:", error);
    return [];
  }
}
