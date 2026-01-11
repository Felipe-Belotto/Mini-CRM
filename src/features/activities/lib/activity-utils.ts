import { createClient } from "@/shared/lib/supabase/server";
import type { ActivityActionType, CreateActivityInput, LeadActivity } from "../types";

export async function createActivity(input: CreateActivityInput): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("lead_activities").insert({
      lead_id: input.leadId,
      workspace_id: input.workspaceId,
      user_id: input.userId || null,
      action_type: input.actionType,
      field_name: input.fieldName || null,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("Error creating activity:", error);
    }
  } catch (error) {
    console.error("Error in createActivity:", error);
  }
}

/**
 * Retorna o ícone apropriado para cada tipo de atividade
 */
export function getActivityIcon(actionType: ActivityActionType): string {
  const icons: Record<ActivityActionType, string> = {
    created: "plus-circle",
    stage_changed: "arrow-right",
    field_updated: "edit",
    message_sent: "send",
    archived: "archive",
    restored: "rotate-ccw",
  };
  return icons[actionType] || "activity";
}

/**
 * Retorna a cor associada a cada tipo de atividade
 */
export function getActivityColor(actionType: ActivityActionType): string {
  const colors: Record<ActivityActionType, string> = {
    created: "text-green-600 dark:text-green-400",
    stage_changed: "text-blue-600 dark:text-blue-400",
    field_updated: "text-amber-600 dark:text-amber-400",
    message_sent: "text-purple-600 dark:text-purple-400",
    archived: "text-red-600 dark:text-red-400",
    restored: "text-emerald-600 dark:text-emerald-400",
  };
  return colors[actionType] || "text-muted-foreground";
}

/**
 * Formata a mensagem de atividade para exibição
 */
export function formatActivityMessage(activity: LeadActivity): string {
  const userName = activity.user?.fullName || "Sistema";

  switch (activity.actionType) {
    case "created":
      return `${userName} criou o lead`;

    case "stage_changed": {
      const oldStage = activity.metadata?.oldStageName || activity.oldValue;
      const newStage = activity.metadata?.newStageName || activity.newValue;
      return `${userName} moveu de "${oldStage}" para "${newStage}"`;
    }

    case "field_updated": {
      const fieldLabel = activity.metadata?.fieldLabel || activity.fieldName;
      const oldVal = formatValue(activity.oldValue);
      const newVal = formatValue(activity.newValue);
      
      if (!oldVal && newVal) {
        return `${userName} definiu ${fieldLabel} como "${newVal}"`;
      }
      if (oldVal && !newVal) {
        return `${userName} removeu ${fieldLabel}`;
      }
      return `${userName} alterou ${fieldLabel} de "${oldVal}" para "${newVal}"`;
    }

    case "message_sent": {
      const channel = activity.metadata?.channel || "mensagem";
      const campaignName = activity.metadata?.campaignName;
      if (campaignName) {
        return `${userName} enviou ${channel} (campanha: ${campaignName})`;
      }
      return `${userName} enviou ${channel}`;
    }

    case "archived":
      return `${userName} arquivou o lead`;

    case "restored":
      return `${userName} restaurou o lead`;

    default:
      return `${userName} realizou uma ação`;
  }
}

/**
 * Formata um valor para exibição
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  return JSON.stringify(value);
}

/**
 * Agrupa atividades por data
 */
export function groupActivitiesByDate(
  activities: LeadActivity[]
): Map<string, LeadActivity[]> {
  const grouped = new Map<string, LeadActivity[]>();

  for (const activity of activities) {
    const dateKey = activity.createdAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const existing = grouped.get(dateKey) || [];
    existing.push(activity);
    grouped.set(dateKey, existing);
  }

  return grouped;
}
