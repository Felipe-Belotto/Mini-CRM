import type { Campaign, Lead } from "@/shared/types/crm";

/**
 * Constrói o prompt para geração de mensagens com IA
 * Combina contexto da campanha, instruções e dados do lead
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

${leadData}

Gere 3 variações de mensagens personalizadas para este lead, considerando:
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

Formato de resposta: JSON com array de objetos, cada um contendo:
- type: "WhatsApp" | "Email" | "LinkedIn"
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
