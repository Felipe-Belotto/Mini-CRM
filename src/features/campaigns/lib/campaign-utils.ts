import { cn } from "@/shared/lib/utils";
import type { Campaign } from "@/shared/types/crm";

export interface CampaignFormData {
  nome: string;
  contexto: string;
  tomDeVoz: "formal" | "informal" | "neutro";
  instrucoesIA: string;
  status: "ativa" | "pausada" | "finalizada";
}

/**
 * Mapeamento de cores para status de campanha
 */
export const CAMPAIGN_STATUS_COLORS = {
  ativa: "bg-success/10 text-success border-success/20",
  pausada: "bg-warning/10 text-warning border-warning/20",
  finalizada: "bg-muted text-muted-foreground border-muted",
} as const;

/**
 * Obtém a classe CSS para o status de uma campanha
 */
export function getCampaignStatusColorClass(
  status: Campaign["status"],
): string {
  return cn("status-badge", CAMPAIGN_STATUS_COLORS[status]);
}

/**
 * Valida os dados do formulário de campanha
 */
export function validateCampaignForm(formData: CampaignFormData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!formData.nome || formData.nome.trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (!formData.contexto || formData.contexto.trim() === "") {
    errors.push("Contexto é obrigatório");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Filtra campanhas por status
 */
export function getCampaignsByStatus(
  campaigns: Campaign[],
  status: Campaign["status"],
): Campaign[] {
  return campaigns.filter((campaign) => campaign.status === status);
}
