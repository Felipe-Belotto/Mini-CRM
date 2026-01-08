"use server";

import type { Campaign } from "@/shared/types/crm";

export async function addCampaignAction(
  campaign: Omit<Campaign, "id" | "createdAt" | "leadsCount">,
): Promise<void> {
  // TODO: Implementar com Supabase
}
