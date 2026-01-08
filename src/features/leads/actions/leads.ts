"use server";

import { validateLeadForStage } from "@/shared/lib/lead-utils";
import type { KanbanStage, Lead, ValidationError } from "@/shared/types/crm";

export async function updateLeadAction(
  id: string,
  updates: Partial<Lead>,
): Promise<void> {
  // TODO: Implementar com Supabase
}

export async function moveLeadAction(
  leadId: string,
  newStage: KanbanStage,
): Promise<ValidationError[] | null> {
  // TODO: Implementar com Supabase
  const { mockLeads } = await import("@/shared/data/mockData");
  const lead = mockLeads.find((l) => l.id === leadId);
  if (!lead) return null;

  const errors = validateLeadForStage(lead, newStage);
  if (errors.length > 0) {
    return errors;
  }

  await updateLeadAction(leadId, { stage: newStage });
  return null;
}
