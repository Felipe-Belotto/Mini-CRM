"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import type { Campaign } from "@/shared/types/crm";
import type { CampaignFormData } from "../lib/campaign-utils";
import { useCampaignForm } from "../hooks/use-campaign-form";
import { CampaignForm } from "./CampaignForm";
import { CampaignCard } from "./CampaignCard";

interface CampaignManagerProps {
  campaigns: Campaign[];
  onAddCampaign: (campaign: CampaignFormData) => Promise<void>;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  campaigns,
  onAddCampaign,
}) => {
  const [open, setOpen] = useState(false);
  const { formData, updateField, resetForm, submit } = useCampaignForm({
    onAddCampaign,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submit();
    if (success) {
      setOpen(false);
      resetForm();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas de prospecção
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
                <DialogDescription>
                  Configure os parâmetros da sua campanha de prospecção.
                </DialogDescription>
              </DialogHeader>

              <CampaignForm formData={formData} onFieldChange={updateField} />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Criar Campanha
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
};
