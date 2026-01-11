"use server";

import type { Campaign, Lead, CustomField } from "@/shared/types/crm";
import {
  prepareLeadDataForAI,
  prepareCampaignDataForAI,
  type MessageChannel,
} from "../lib/prompt-builder";
import type { AISuggestion } from "@/features/leads/lib/message-utils";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";

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
      getCurrentWorkspaceAction(),
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
