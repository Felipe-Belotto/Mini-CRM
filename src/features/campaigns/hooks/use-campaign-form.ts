"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type { Campaign } from "@/shared/types/crm";
import {
  type CampaignFormData,
  validateCampaignForm,
} from "../lib/campaign-utils";

interface UseCampaignFormProps {
  onAddCampaign: (
    campaign: Omit<Campaign, "id" | "createdAt" | "leadsCount">,
  ) => Promise<void>;
}

const initialFormData: CampaignFormData = {
  nome: "",
  contexto: "",
  tomDeVoz: "neutro",
  instrucoesIA: "",
  status: "ativa",
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
      description: `A campanha "${formData.nome}" foi criada com sucesso.`,
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
