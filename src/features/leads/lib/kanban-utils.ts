/**
 * Mapeamento de cores para as colunas do Kanban
 */
export const KANBAN_COLOR_MAP: Record<string, string> = {
  "kanban-base": "border-t-slate-400",
  "kanban-mapped": "border-t-cyan-500",
  "kanban-contacting": "border-t-amber-500",
  "kanban-connection": "border-t-violet-500",
  "kanban-disqualified": "border-t-red-500",
  "kanban-qualified": "border-t-emerald-500",
  "kanban-meeting": "border-t-blue-500",
};

/**
 * Mapeamento de cores de fundo para gráficos
 */
export const KANBAN_BG_COLOR_MAP: Record<string, string> = {
  "kanban-base": "bg-slate-400",
  "kanban-mapped": "bg-cyan-500",
  "kanban-contacting": "bg-amber-500",
  "kanban-connection": "bg-violet-500",
  "kanban-disqualified": "bg-red-500",
  "kanban-qualified": "bg-emerald-500",
  "kanban-meeting": "bg-blue-500",
};

/**
 * Obtém a classe CSS de cor para uma coluna do kanban
 */
export function getKanbanColorClass(colorKey: string): string {
  return KANBAN_COLOR_MAP[colorKey] || "border-t-slate-400";
}

/**
 * Obtém a classe CSS de cor de fundo para gráficos
 */
export function getKanbanBgColorClass(colorKey: string): string {
  return KANBAN_BG_COLOR_MAP[colorKey] || "bg-slate-400";
}
