"use server";

import type { Campaign, Lead } from "@/shared/types/crm";
import { buildPrompt } from "../lib/prompt-builder";
import type { AISuggestion } from "@/features/leads/lib/message-utils";

export interface GenerateMessagesInput {
  campaign: Campaign;
  lead: Lead;
}

export interface GenerateMessagesResult {
  success: boolean;
  suggestions?: AISuggestion[];
  error?: string;
}

/**
 * Server Action para gerar mensagens com IA
 * TODO: Implementar chamada real para Edge Function do Supabase
 * A Edge Function chamará a API de LLM (OpenAI, Google AI, Anthropic, etc.)
 */
export async function generateMessagesAction(
  input: GenerateMessagesInput,
): Promise<GenerateMessagesResult> {
  // Simulação de delay de rede (chamada à API)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock: construir prompt e simular resposta da IA
  const prompt = buildPrompt(input.campaign, input.lead);

  // No backend real, isso seria:
  // 1. Chamar Edge Function do Supabase
  // 2. Edge Function chama API de LLM
  // 3. Retorna mensagens geradas

  // Mock: gerar sugestões baseadas no contexto
  const suggestions: AISuggestion[] = [
    {
      id: "1",
      type: "WhatsApp",
      message: `Olá ${input.lead.name}! Vi que você atua como ${input.lead.position} na ${input.lead.company}. ${input.campaign.context} Posso te mostrar como isso pode ajudar sua empresa em uma conversa de 15 minutos?`,
    },
    {
      id: "2",
      type: "Email",
      message: `Prezado(a) ${input.lead.name},\n\nEspero que esteja bem! ${input.campaign.context}\n\nGostaria de agendar uma breve conversa para entender seus desafios atuais?\n\nAbraços!`,
    },
    {
      id: "3",
      type: "LinkedIn",
      message: `Oi ${input.lead.name}! Acompanho o trabalho da ${input.lead.company} e admiro o que vocês têm construído. ${input.campaign.context} Topa um café virtual?`,
    },
  ];

  return {
    success: true,
    suggestions,
  };
}
