/**
 * Utilitários relacionados a usuários e perfis
 */

/**
 * Extrai as iniciais de um nome completo
 * @param name - Nome completo (ex: "João Silva")
 * @returns Iniciais em maiúsculas (ex: "JS")
 */
export function getUserInitials(name: string): string {
  if (!name || typeof name !== "string") {
    return "U";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) {
    return "U";
  }

  // Se tiver apenas uma palavra, retorna as duas primeiras letras
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  // Se tiver múltiplas palavras, retorna a primeira letra de cada uma (máximo 2)
  return parts
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
}