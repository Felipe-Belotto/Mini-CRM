import type { Lead, AISuggestion } from "@/shared/types/crm";

export function groupSuggestionsByChannel(suggestions: AISuggestion[]): Record<string, AISuggestion[]> {
  const groups: Record<string, AISuggestion[]> = {
    WhatsApp: [],
    Email: [],
  };

  for (const suggestion of suggestions) {
    if (groups[suggestion.type]) {
      groups[suggestion.type].push(suggestion);
    }
  }

  return groups;
}

/**
 * Formata número de telefone para uso no WhatsApp (wa.me)
 * Remove caracteres especiais e garante código do país
 * @param phone - Número de telefone em qualquer formato
 * @param defaultCountryCode - Código do país padrão (default: 55 para Brasil)
 * @returns Número formatado para wa.me (ex: 5511999999999)
 */
export function formatPhoneForWhatsApp(
  phone: string | undefined | null,
  defaultCountryCode = "55"
): string | null {
  if (!phone) return null;

  // Remove todos os caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, "");

  if (digitsOnly.length === 0) return null;

  // Se já começa com código do país (55), retorna como está
  if (digitsOnly.startsWith("55") && digitsOnly.length >= 12) {
    return digitsOnly;
  }

  // Se tem 10 ou 11 dígitos (DDD + número), adiciona código do país
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `${defaultCountryCode}${digitsOnly}`;
  }

  // Se tem 8 ou 9 dígitos (só número sem DDD), retorna null pois precisa do DDD
  if (digitsOnly.length < 10) {
    return null;
  }

  // Para outros casos, tenta usar como está
  return digitsOnly;
}

/**
 * Constrói link wa.me para WhatsApp
 * @param phone - Número de telefone
 * @param message - Mensagem a ser enviada
 * @returns URL do wa.me ou null se telefone inválido
 */
export function buildWhatsAppLink(
  phone: string | undefined | null,
  message: string
): string | null {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return null;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Extrai assunto do e-mail da mensagem
 * Procura por linha "Assunto:" ou usa primeira linha
 */
function extractEmailSubject(message: string, fallback: string): string {
  const lines = message.split("\n");
  
  // Procura por linha que começa com "Assunto:"
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("assunto:")) {
      return trimmed.substring(8).trim();
    }
  }

  // Se não encontrou, usa a primeira linha não vazia (limitada a 100 chars)
  const firstLine = lines.find((l) => l.trim().length > 0)?.trim() || fallback;
  return firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;
}

/**
 * Remove linha de assunto do corpo do e-mail
 */
function removeSubjectFromBody(message: string): string {
  const lines = message.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    // Remove linhas que começam com "Assunto:" (case insensitive)
    return !trimmed.toLowerCase().startsWith("assunto:");
  });
  
  // Remove linhas vazias do início
  while (filteredLines.length > 0 && filteredLines[0].trim() === "") {
    filteredLines.shift();
  }
  
  return filteredLines.join("\n").trim();
}

/**
 * Constrói link mailto para e-mail
 * @param email - Endereço de e-mail
 * @param message - Mensagem a ser enviada
 * @param campaignName - Nome da campanha (usado como fallback para assunto)
 * @returns URL mailto ou null se e-mail inválido
 */
export function buildMailtoLink(
  email: string | undefined | null,
  message: string,
  campaignName?: string
): string | null {
  if (!email || !email.includes("@")) return null;

  const fallbackSubject = campaignName 
    ? `Mensagem - ${campaignName}` 
    : "Oportunidade";
  
  const subject = extractEmailSubject(message, fallbackSubject);
  const body = removeSubjectFromBody(message);

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Extrai preview/assunto da mensagem (primeira linha ou primeiros 60 caracteres)
 */
export function getMessagePreview(content: string): string {
  const lines = content.split("\n");
  const firstLine = lines[0]?.trim() || "";
  
  // Se a primeira linha começa com "Assunto:", pega o que vem depois
  if (firstLine.toLowerCase().startsWith("assunto:")) {
    return firstLine.substring(8).trim();
  }
  
  // Caso contrário, usa a primeira linha ou primeiros 60 caracteres
  if (firstLine.length > 0) {
    return firstLine.length > 60 ? firstLine.substring(0, 60) + "..." : firstLine;
  }
  
  // Fallback: primeiros 60 caracteres do conteúdo
  return content.length > 60 ? content.substring(0, 60) + "..." : content;
}
