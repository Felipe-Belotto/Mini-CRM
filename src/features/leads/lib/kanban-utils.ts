import type { ColorPalette } from "@/shared/types/crm";

/**
 * Mapeamento de cores para as colunas do Kanban (fallback para compatibilidade)
 */
export const KANBAN_COLOR_MAP: Record<string, string> = {
  "kanban-base": "border-t-slate-400",
  "kanban-mapped": "border-t-cyan-500",
  "kanban-contacting": "border-t-amber-500",
  "kanban-connection": "border-t-violet-500",
  "kanban-disqualified": "border-t-red-500",
  "kanban-qualified": "border-t-emerald-500",
  "kanban-meeting": "border-t-blue-500",
  "custom-pink": "border-t-pink-500",
  "custom-indigo": "border-t-indigo-500",
  "custom-teal": "border-t-teal-500",
};

/**
 * Mapeamento de cores de fundo para gráficos (fallback para compatibilidade)
 */
export const KANBAN_BG_COLOR_MAP: Record<string, string> = {
  "kanban-base": "bg-slate-400",
  "kanban-mapped": "bg-cyan-500",
  "kanban-contacting": "bg-amber-500",
  "kanban-connection": "bg-violet-500",
  "kanban-disqualified": "bg-red-500",
  "kanban-qualified": "bg-emerald-500",
  "kanban-meeting": "bg-blue-500",
  "custom-pink": "bg-pink-500",
  "custom-indigo": "bg-indigo-500",
  "custom-teal": "bg-teal-500",
};

/**
 * Obtém a classe CSS de cor para uma coluna do kanban
 * Aceita tanto um colorKey (string) quanto um ColorPalette
 */
export function getKanbanColorClass(
  colorKeyOrPalette: string | ColorPalette | undefined
): string {
  if (!colorKeyOrPalette) {
    return "border-t-slate-400";
  }

  // Se for um ColorPalette, usar borderClass diretamente
  if (typeof colorKeyOrPalette === "object" && "borderClass" in colorKeyOrPalette) {
    return colorKeyOrPalette.borderClass;
  }

  // Se for uma string que já é uma classe CSS (começa com "border-t-"), retornar diretamente
  const colorKey = colorKeyOrPalette as string;
  if (colorKey.startsWith("border-t-")) {
    return colorKey;
  }

  // Caso contrário, usar o mapeamento hardcoded (compatibilidade)
  return KANBAN_COLOR_MAP[colorKey] || "border-t-slate-400";
}

/**
 * Obtém a classe CSS de cor de fundo para gráficos
 * Aceita tanto um colorKey (string) quanto um ColorPalette
 */
export function getKanbanBgColorClass(
  colorKeyOrPalette: string | ColorPalette | undefined
): string {
  if (!colorKeyOrPalette) {
    return "bg-slate-400";
  }

  // Se for um ColorPalette, usar bgClass diretamente
  if (typeof colorKeyOrPalette === "object" && "bgClass" in colorKeyOrPalette) {
    return colorKeyOrPalette.bgClass;
  }

  // Se for uma string que já é uma classe CSS de border, converter para bg
  const colorKey = colorKeyOrPalette as string;
  if (colorKey.startsWith("border-t-")) {
    // Converter border-t-[cor] para bg-[cor]
    return colorKey.replace("border-t-", "bg-");
  }

  // Caso contrário, usar o mapeamento hardcoded (compatibilidade)
  return KANBAN_BG_COLOR_MAP[colorKey] || "bg-slate-400";
}
