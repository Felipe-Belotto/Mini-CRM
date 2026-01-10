"use client";

import { useState } from "react";
import type { Campaign, Lead } from "@/shared/types/crm";
import { useCustomFields } from "@/features/custom-fields/hooks/use-custom-fields";
import { useAISuggestions } from "./use-ai-suggestions";

interface UseLeadDrawerProps {
  lead: Lead;
  campaigns: Campaign[];
}

export function useLeadDrawer({ lead, campaigns }: UseLeadDrawerProps) {
  const { fields: customFields } = useCustomFields();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const selectedCampaign = activeCampaigns.find(
    (c) => c.id === selectedCampaignId,
  );

  const { isGenerating, showSuggestions, suggestions, generateSuggestions } =
    useAISuggestions();

  const getCustomFieldValue = (fieldId: string): string | undefined => {
    const field = customFields.find((f) => f.id === fieldId);
    if (!field) return undefined;

    // Mapear campos conhecidos (temporário até backend)
    if (field.name.toLowerCase() === "segmento") {
      return lead.segment;
    }
    if (field.name.toLowerCase() === "faturamento") {
      return lead.revenue;
    }

    return undefined;
  };

  const handleGenerateSuggestions = () => {
    if (selectedCampaign) {
      generateSuggestions(selectedCampaign, lead);
    }
  };

  return {
    customFields,
    activeCampaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCampaign,
    getCustomFieldValue,
    isGenerating,
    showSuggestions,
    suggestions,
    handleGenerateSuggestions,
  };
}
