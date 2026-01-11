"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess, getCurrentUser } from "@/shared/lib/supabase/utils";
import { createActivityAction } from "@/features/activities/actions/activities";

export interface LeadMessageSent {
  id: string;
  leadId: string;
  workspaceId: string;
  campaignId: string | null;
  userId: string | null;
  channel: string;
  content: string;
  sentAt: Date;
  // Dados do usuário (join)
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  // Dados da campanha (join)
  campaign?: {
    id: string;
    name: string;
  };
}

export interface SaveMessageInput {
  leadId: string;
  workspaceId: string;
  campaignId?: string;
  channel: string;
  content: string;
}

/**
 * Salva uma mensagem enviada para um lead
 */
export async function saveMessageAction(
  input: SaveMessageInput
): Promise<LeadMessageSent | null> {
  try {
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(input.workspaceId);

    if (!hasAccess) {
      throw new Error("Você não tem acesso a este workspace");
    }

    const currentUser = await getCurrentUser();
    const supabase = await createClient();

    // Inserir mensagem
    const { data, error } = await supabase
      .from("lead_messages_sent")
      .insert({
        lead_id: input.leadId,
        workspace_id: input.workspaceId,
        campaign_id: input.campaignId || null,
        user_id: currentUser?.id || null,
        channel: input.channel,
        content: input.content,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error saving message:", error);
      throw new Error(error?.message || "Não foi possível salvar a mensagem");
    }

    // Registrar atividade de mensagem enviada
    await createActivityAction({
      leadId: input.leadId,
      workspaceId: input.workspaceId,
      userId: currentUser?.id,
      actionType: "message_sent",
      metadata: {
        channel: input.channel,
        campaignId: input.campaignId,
      },
    });

    return {
      id: data.id,
      leadId: data.lead_id,
      workspaceId: data.workspace_id,
      campaignId: data.campaign_id,
      userId: data.user_id,
      channel: data.channel,
      content: data.content,
      sentAt: new Date(data.sent_at),
    };
  } catch (error) {
    console.error("Error in saveMessageAction:", error);
    throw error;
  }
}

/**
 * Busca mensagens enviadas para um lead
 */
export async function getLeadMessagesAction(
  leadId: string
): Promise<LeadMessageSent[]> {
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

    // Buscar mensagens com dados do usuário e campanha
    const { data: messages, error } = await supabase
      .from("lead_messages_sent")
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        ),
        campaigns:campaign_id (
          id,
          name
        )
      `)
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    if (!messages) {
      return [];
    }

    return messages.map((msg) => ({
      id: msg.id,
      leadId: msg.lead_id,
      workspaceId: msg.workspace_id,
      campaignId: msg.campaign_id,
      userId: msg.user_id,
      channel: msg.channel,
      content: msg.content,
      sentAt: new Date(msg.sent_at),
      user: msg.profiles
        ? {
            id: msg.profiles.id,
            fullName: msg.profiles.full_name,
            avatarUrl: msg.profiles.avatar_url || undefined,
          }
        : undefined,
      campaign: msg.campaigns
        ? {
            id: msg.campaigns.id,
            name: msg.campaigns.name,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error in getLeadMessagesAction:", error);
    return [];
  }
}

/**
 * Busca contagem de mensagens por campanha
 */
export async function getMessagesByCampaignAction(
  workspaceId: string
): Promise<Array<{ campaignId: string; campaignName: string; count: number }>> {
  try {
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("lead_messages_sent")
      .select(`
        campaign_id,
        campaigns:campaign_id (
          name
        )
      `)
      .eq("workspace_id", workspaceId)
      .not("campaign_id", "is", null);

    if (error) {
      console.error("Error fetching messages by campaign:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Agrupar por campanha
    const counts = new Map<string, { name: string; count: number }>();
    for (const msg of data) {
      if (msg.campaign_id) {
        const existing = counts.get(msg.campaign_id);
        if (existing) {
          existing.count++;
        } else {
          const campaign = msg.campaigns as { name: string } | { name: string }[] | null;
          const campaignName = Array.isArray(campaign)
            ? campaign[0]?.name || "Sem nome"
            : campaign?.name || "Sem nome";
          counts.set(msg.campaign_id, {
            name: campaignName,
            count: 1,
          });
        }
      }
    }

    return Array.from(counts.entries()).map(([campaignId, data]) => ({
      campaignId,
      campaignName: data.name,
      count: data.count,
    }));
  } catch (error) {
    console.error("Error in getMessagesByCampaignAction:", error);
    return [];
  }
}
