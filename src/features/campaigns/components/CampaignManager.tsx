"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Campaign } from "@/shared/types/crm";
import { useCampaignForm } from "../hooks/use-campaign-form";
import { getCampaignStatusColorClass } from "../lib/campaign-utils";

interface CampaignManagerProps {
  campaigns: Campaign[];
  onAddCampaign: (
    campaign: Omit<Campaign, "id" | "createdAt" | "leadsCount">,
  ) => Promise<void>;
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

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Campanha *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    placeholder="Ex: Prospecção Q1 2024"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contexto">Contexto *</Label>
                  <Textarea
                    id="contexto"
                    value={formData.contexto}
                    onChange={(e) => updateField("contexto", e.target.value)}
                    placeholder="Descreva o objetivo e público-alvo da campanha..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tomDeVoz">Tom de Voz</Label>
                  <Select
                    value={formData.tomDeVoz}
                    onValueChange={(value: "formal" | "informal" | "neutro") =>
                      updateField("tomDeVoz", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="informal">Informal</SelectItem>
                      <SelectItem value="neutro">Neutro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="instrucoesIA">Instruções para IA</Label>
                  <Textarea
                    id="instrucoesIA"
                    value={formData.instrucoesIA}
                    onChange={(e) =>
                      updateField("instrucoesIA", e.target.value)
                    }
                    placeholder="Instruções específicas para geração de mensagens..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(
                      value: "ativa" | "pausada" | "finalizada",
                    ) => updateField("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="pausada">Pausada</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
          <Card
            key={campaign.id}
            className="metric-card hover:border-accent/30"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold">
                  {campaign.nome}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={getCampaignStatusColorClass(campaign.status)}
                >
                  {campaign.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {campaign.contexto}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Tom:{" "}
                  <span className="font-medium text-foreground capitalize">
                    {campaign.tomDeVoz}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {campaign.leadsCount}
                  </span>{" "}
                  leads
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
