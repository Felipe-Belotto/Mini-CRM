"use server";

import type { Campaign, Lead, CustomField, AISuggestion } from "@/shared/types/crm";
import {
  prepareLeadDataForAI,
  prepareCampaignDataForAI,
  type MessageChannel,
} from "../lib/prompt-builder";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import { getCurrentWorkspace } from "@/shared/lib/workspace-utils";

export interface GenerateMessagesInput {
  campaign: Campaign;
  lead: Lead;
  customFields?: CustomField[];
  customFieldValues?: Record<string, string>;
  channels?: MessageChannel[];
}

export interface GenerateMessagesResult {
  success: boolean;
  suggestions?: AISuggestion[];
  error?: string;
}

/**
 * Server Action para gerar mensagens com IA
 * Chama a Edge Function do Supabase que usa Google Gemini
 */
export async function generateMessagesAction(
  input: GenerateMessagesInput,
): Promise<GenerateMessagesResult> {
  const { campaign, lead, customFields, customFieldValues, channels = ["whatsapp", "email"] } = input;

  try {
    // Buscar dados do usuário e workspace
    const [user, workspace] = await Promise.all([
      getCurrentUser(),
      getCurrentWorkspace(),
    ]);

    // Preparar dados para a Edge Function
    const leadData = prepareLeadDataForAI(lead, customFields, customFieldValues);
    const campaignData = prepareCampaignDataForAI(campaign);

    // Preparar dados do remetente (usuário/workspace)
    const senderData = {
      name: user?.fullName || "Usuário",
      position: "", // Não temos cargo do usuário no sistema
      company: workspace?.name || "Workspace",
    };

    // URL da Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Usa service_role key (segura, só existe no servidor) para chamar Edge Function
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
      return {
        success: false,
        error: "Configuração do servidor incompleta. Contate o suporte.",
      };
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-ai-messages`;

    // Chamar Edge Function com autenticação
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        campaign: campaignData,
        lead: leadData,
        channels,
        variationsPerChannel: 2,
        sender: senderData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Edge Function error:", response.status, errorData);

      if (response.status === 404) {
        return {
          success: false,
          error: "Serviço de IA não configurado. Verifique se a Edge Function está deployada.",
        };
      }

      if (response.status === 500) {
        return {
          success: false,
          error: "Erro no serviço de IA. Verifique se a GEMINI_API_KEY está configurada no Supabase.",
        };
      }

      return {
        success: false,
        error: errorData.error || `Erro ao gerar mensagens (${response.status})`,
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erro desconhecido ao gerar mensagens",
      };
    }

    return {
      success: true,
      suggestions: result.suggestions,
    };
  } catch (error) {
    console.error("Error in generateMessagesAction:", error);
    
    return {
      success: false,
      error: "Erro de conexão com o serviço de IA. Tente novamente.",
    };
  }
}

/**
 * Gera mensagens automaticamente para um lead quando ele atinge uma etapa gatilho
 * Salva as mensagens na tabela lead_ai_suggestions
 */
export async function generateAutoMessagesForLeadAction(
  leadId: string,
  campaignId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { createClient } = await import("@/shared/lib/supabase/server");
    const { getLeadsAction } = await import("@/features/leads/actions/leads");
    const { getCampaignByIdAction } = await import("@/features/campaigns/actions/campaigns");
    const { getCustomFieldsAction } = await import("@/features/custom-fields/actions/custom-fields");
    const { getCurrentWorkspace } = await import("@/shared/lib/workspace-utils");
    const { requireAuth, hasWorkspaceAccess } = await import("@/shared/lib/supabase/utils");
    
    await requireAuth();
    const workspace = await getCurrentWorkspace();
    
    if (!workspace) {
      return { success: false, error: "Workspace não encontrado" };
    }

    // Buscar lead, campanha e campos personalizados
    const [leads, campaign, customFields] = await Promise.all([
      getLeadsAction(workspace.id),
      getCampaignByIdAction(campaignId),
      getCustomFieldsAction(workspace.id),
    ]);

    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
      return { success: false, error: "Lead não encontrado" };
    }

    if (!campaign) {
      return { success: false, error: "Campanha não encontrada" };
    }

    // Verificar se a campanha tem trigger_stage configurado e se corresponde à etapa do lead
    if (!campaign.triggerStage || campaign.triggerStage !== lead.stage) {
      return { success: false, error: "Campanha não está configurada para esta etapa" };
    }

    // Verificar se a campanha está ativa
    if (campaign.status !== "active") {
      return { success: false, error: "Campanha não está ativa" };
    }

    // Buscar valores de campos personalizados do lead
    // Os campos personalizados são mapeados através dos nomes dos campos
    const customFieldValues: Record<string, string> = {};
    for (const field of customFields) {
      let value: string | undefined;
      
      // Mapear campos personalizados conhecidos
      if (field.name.toLowerCase() === "segmento") {
        value = lead.segment;
      } else if (field.name.toLowerCase() === "faturamento") {
        value = lead.revenue;
      }
      
      if (value) {
        customFieldValues[field.id] = value;
      }
    }

    // Gerar mensagens
    const result = await generateMessagesAction({
      campaign,
      lead,
      customFields,
      customFieldValues,
      channels: ["whatsapp", "email"],
    });

    if (!result.success || !result.suggestions) {
      return { 
        success: false, 
        error: result.error || "Erro ao gerar mensagens" 
      };
    }

    // Salvar mensagens na tabela lead_ai_suggestions
    const supabase = await createClient();
    const hasAccess = await hasWorkspaceAccess(workspace.id);
    
    if (!hasAccess) {
      return { success: false, error: "Sem acesso ao workspace" };
    }

    // Usar upsert para atualizar se já existir
    const { error: insertError } = await supabase
      .from("lead_ai_suggestions")
      .upsert({
        lead_id: leadId,
        workspace_id: workspace.id,
        campaign_id: campaignId,
        suggestions: result.suggestions,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: "lead_id,campaign_id",
      });

    if (insertError) {
      console.error("Error saving AI suggestions:", insertError);
      return { 
        success: false, 
        error: "Erro ao salvar mensagens geradas" 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in generateAutoMessagesForLeadAction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro inesperado" 
    };
  }
}

/**
 * Busca mensagens pré-geradas automaticamente para um lead
 */
export async function getLeadAISuggestionsAction(
  leadId: string,
): Promise<Array<{ campaignId: string; campaignName: string; suggestions: AISuggestion[]; generatedAt: Date }>> {
  try {
    const { createClient } = await import("@/shared/lib/supabase/server");
    const { requireAuth, hasWorkspaceAccess } = await import("@/shared/lib/supabase/utils");
    const { getCampaignByIdAction } = await import("@/features/campaigns/actions/campaigns");
    
    await requireAuth();
    const supabase = await createClient();

    // Buscar lead para obter workspace_id
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return [];
    }

    const hasAccess = await hasWorkspaceAccess(lead.workspace_id);
    if (!hasAccess) {
      return [];
    }

    // Buscar sugestões pré-geradas
    const { data: suggestions, error } = await supabase
      .from("lead_ai_suggestions")
      .select("campaign_id, suggestions, generated_at")
      .eq("lead_id", leadId)
      .order("generated_at", { ascending: false });

    if (error || !suggestions) {
      console.error("Error fetching AI suggestions:", error);
      return [];
    }

    // Buscar nomes das campanhas e formatar resultado
    const result = await Promise.all(
      suggestions.map(async (s) => {
        const campaign = await getCampaignByIdAction(s.campaign_id);
        return {
          campaignId: s.campaign_id,
          campaignName: campaign?.name || "Campanha desconhecida",
          suggestions: (s.suggestions as AISuggestion[]) || [],
          generatedAt: new Date(s.generated_at),
        };
      })
    );

    return result;
  } catch (error) {
    console.error("Error in getLeadAISuggestionsAction:", error);
    return [];
  }
}

/**
 * Marca mensagens pré-geradas como visualizadas
 */
export async function markAISuggestionsAsViewedAction(
  leadId: string,
  campaignId: string,
): Promise<void> {
  try {
    const { createClient } = await import("@/shared/lib/supabase/server");
    const { requireAuth, hasWorkspaceAccess } = await import("@/shared/lib/supabase/utils");
    
    await requireAuth();
    const supabase = await createClient();

    // Buscar lead para obter workspace_id
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return;
    }

    const hasAccess = await hasWorkspaceAccess(lead.workspace_id);
    if (!hasAccess) {
      return;
    }

    // Atualizar viewed_at
    await supabase
      .from("lead_ai_suggestions")
      .update({ viewed_at: new Date().toISOString() })
      .eq("lead_id", leadId)
      .eq("campaign_id", campaignId);
  } catch (error) {
    console.error("Error in markAISuggestionsAsViewedAction:", error);
  }
}