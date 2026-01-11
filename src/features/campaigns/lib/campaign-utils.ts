import { cn } from "@/shared/lib/utils";
import type { Campaign, KanbanStage } from "@/shared/types/crm";

export interface CampaignFormData {
  name: string;
  context: string;
  voiceTone: "formal" | "informal" | "neutro";
  aiInstructions: string;
  status: "active" | "paused" | "finished";
  triggerStage?: KanbanStage;
  formalityLevel?: number;
}

export const FORMALITY_LEVEL_LABELS: Record<number, string> = {
  1: "Muito informal",
  2: "Informal",
  3: "Neutro",
  4: "Formal",
  5: "Muito formal",
};

export const CAMPAIGN_STATUS_COLORS = {
  active: "bg-success/10 text-success border-success/20",
  paused: "bg-warning/10 text-warning border-warning/20",
  finished: "bg-muted text-muted-foreground border-muted",
} as const;

export function getCampaignStatusColorClass(
  status: Campaign["status"],
): string {
  return cn("status-badge", CAMPAIGN_STATUS_COLORS[status]);
}

export function validateCampaignForm(formData: CampaignFormData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!formData.name || formData.name.trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (!formData.context || formData.context.trim() === "") {
    errors.push("Contexto é obrigatório");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getCampaignsByStatus(
  campaigns: Campaign[],
  status: Campaign["status"],
): Campaign[] {
  return campaigns.filter((campaign) => campaign.status === status);
}

export function getFormalityLabel(level: number | undefined): string | null {
  if (!level) return null;
  return FORMALITY_LEVEL_LABELS[level] || null;
}
