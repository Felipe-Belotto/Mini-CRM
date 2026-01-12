"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";
import type { Campaign } from "@/shared/types/crm";
import type { CampaignFormData } from "../lib/campaign-utils";
import { updateCampaignAction } from "../actions/campaigns";

interface UseCampaignEditProps {
  campaign: Campaign;
  onSuccess?: () => void;
}

export function useCampaignEdit({ campaign, onSuccess }: UseCampaignEditProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const initialFormData: CampaignFormData = {
    name: campaign.name,
    context: campaign.context,
    voiceTone: campaign.voiceTone,
    aiInstructions: campaign.aiInstructions,
    status: campaign.status,
    triggerStage: campaign.triggerStage,
    formalityLevel: campaign.formalityLevel,
  };

  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);

  const updateField = <K extends keyof CampaignFormData>(
    field: K,
    value: CampaignFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const submit = async () => {
    setIsPending(true);
    try {
      await updateCampaignAction(campaign.id, formData);
      toast({
        title: "Campanha atualizada!",
        description: `A campanha "${formData.name}" foi atualizada com sucesso.`,
      });
      router.refresh();
      onSuccess?.();
      return true;
    } catch (error) {
      toast({
        title: "Erro ao atualizar campanha",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a campanha",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return {
    formData,
    updateField,
    resetForm,
    submit,
    isPending,
  };
}
