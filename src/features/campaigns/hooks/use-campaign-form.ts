"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import {
  type CampaignFormData,
  validateCampaignForm,
} from "../lib/campaign-utils";

interface UseCampaignFormProps {
  onAddCampaign: (campaign: CampaignFormData) => Promise<void>;
}

const initialFormData: CampaignFormData = {
  name: "",
  context: "",
  voiceTone: "neutro",
  aiInstructions: "",
  status: "active",
  triggerStage: undefined,
};

export function useCampaignForm({ onAddCampaign }: UseCampaignFormProps) {
  const { toast } = useToast();
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
    const validation = validateCampaignForm(formData);

    if (!validation.isValid) {
      toast({
        title: "Campos obrigatórios",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return false;
    }

    await onAddCampaign(formData);
    resetForm();

    toast({
      title: "Campanha criada!",
      description: `A campanha "${formData.name}" foi criada com sucesso.`,
    });

    return true;
  };

  return {
    formData,
    updateField,
    resetForm,
    submit,
  };
}
