import type { Lead } from "@/shared/types/crm";

export interface AISuggestion {
  id: string;
  type: "WhatsApp" | "Email" | "LinkedIn";
  message: string;
}

/**
 * Sugestões de mensagens de IA (mock - deve vir do servidor no futuro)
 */
export const AI_SUGGESTIONS: AISuggestion[] = [
  {
    id: "1",
    type: "WhatsApp",
    message:
      "Olá {nome}! Vi que você atua como {cargo} na {empresa}. Estamos ajudando empresas do segmento a aumentar a conversão de leads em até 40%. Posso te mostrar como em uma conversa de 15 minutos?",
  },
  {
    id: "2",
    type: "Email",
    message:
      "Prezado(a) {nome},\n\nEspero que esteja bem! Trabalho com soluções que têm gerado resultados expressivos para profissionais como você.\n\nGostaria de agendar uma breve conversa para entender seus desafios atuais?\n\nAbraços!",
  },
  {
    id: "3",
    type: "LinkedIn",
    message:
      "Oi {nome}! Acompanho o trabalho da {empresa} e admiro o que vocês têm construído. Acredito que podemos trocar algumas ideias sobre [proposta de valor]. Topa um café virtual?",
  },
];

/**
 * Formata uma mensagem template substituindo placeholders pelos dados do lead
 */
export function formatMessage(template: string, lead: Lead): string {
  return template
    .replace("{nome}", lead.nome || "Lead")
    .replace("{cargo}", lead.cargo || "profissional")
    .replace("{empresa}", lead.empresa || "sua empresa");
}
