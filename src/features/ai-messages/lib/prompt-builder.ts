import type { Campaign, Lead, CustomField } from "@/shared/types/crm";

export type MessageChannel = "whatsapp" | "email";

/**
 * Interface para dados do lead enviados à Edge Function
 */
export interface LeadDataForAI {
  name: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  segment?: string;
  revenue?: string;
  notes?: string;
  customFields?: Record<string, string>;
}

/**
 * Interface para dados da campanha enviados à Edge Function
 */
export interface CampaignDataForAI {
  name: string;
  context: string;
  voiceTone: "formal" | "informal" | "neutro";
  aiInstructions: string;
  formalityLevel?: number;
}

/**
 * Prepara os dados do lead para envio à Edge Function
 * Inclui campos personalizados se fornecidos
 */
export function prepareLeadDataForAI(
  lead: Lead,
  customFields?: CustomField[],
  customFieldValues?: Record<string, string>,
): LeadDataForAI {
  const leadData: LeadDataForAI = {
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    position: lead.position || "",
    company: lead.company || "",
    segment: lead.segment,
    revenue: lead.revenue,
    notes: lead.notes,
  };

  // Adicionar campos personalizados se existirem
  if (customFields && customFieldValues) {
    const customFieldsMap: Record<string, string> = {};
    
    for (const field of customFields) {
      const value = customFieldValues[field.id];
      if (value) {
        customFieldsMap[field.name] = value;
      }
    }

    if (Object.keys(customFieldsMap).length > 0) {
      leadData.customFields = customFieldsMap;
    }
  }

  return leadData;
}

/**
 * Prepara os dados da campanha para envio à Edge Function
 */
export function prepareCampaignDataForAI(campaign: Campaign): CampaignDataForAI {
  return {
    name: campaign.name,
    context: campaign.context,
    voiceTone: campaign.voiceTone,
    aiInstructions: campaign.aiInstructions,
    formalityLevel: campaign.formalityLevel,
  };
}

/**
 * Constrói o prompt para geração de mensagens com IA (legado - usado localmente)
 * Mantido para compatibilidade, a Edge Function tem sua própria lógica de prompts
 */
export function buildPrompt(
  campaign: Campaign,
  lead: Lead,
): string {
  const leadData = `
Dados do Lead:
- Nome: ${lead.name || "Não informado"}
- Cargo: ${lead.position || "Não informado"}
- Empresa: ${lead.company || "Não informado"}
- Email: ${lead.email || "Não informado"}
- Telefone: ${lead.phone || "Não informado"}
${lead.segment ? `- Segmento: ${lead.segment}` : ""}
${lead.revenue ? `- Faturamento: ${lead.revenue}` : ""}
${lead.notes ? `- Observações: ${lead.notes}` : ""}
`.trim();

  const prompt = `
Você é um especialista em prospecção de vendas (SDR).

CONTEXTO DA CAMPANHA:
${campaign.context}

INSTRUÇÕES DE ESTILO:
${campaign.aiInstructions || "Seja profissional e direto ao ponto."}

TOM DE VOZ: ${campaign.voiceTone}

NÍVEL DE FORMALIDADE: ${campaign.formalityLevel || "Automático por canal"}

${leadData}

Gere 2 variações de mensagens para WhatsApp e 2 para Email, considerando:
1. O contexto da campanha
2. Os dados específicos do lead
3. O tom de voz solicitado
4. As instruções de estilo fornecidas

As mensagens devem ser:
- Personalizadas (usar nome, cargo, empresa do lead)
- Relevantes ao contexto da campanha
- No tom de voz especificado
- Concisas mas informativas
- Com call-to-action claro

Para WhatsApp: mais casual, pode usar emojis moderadamente
Para Email: estrutura formal com assunto, saudação, corpo e fechamento

Formato de resposta: JSON com array de objetos, cada um contendo:
- type: "WhatsApp" | "Email"
- message: string (mensagem completa)
`.trim();

  return prompt;
}

/**
 * Extrai dados do lead para uso em templates
 */
export function extractLeadData(lead: Lead): Record<string, string> {
  return {
    nome: lead.name || "Lead",
    cargo: lead.position || "profissional",
    empresa: lead.company || "sua empresa",
    email: lead.email || "",
    telefone: lead.phone || "",
    segmento: lead.segment || "",
    faturamento: lead.revenue || "",
  };
}
