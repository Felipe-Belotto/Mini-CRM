"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useToast } from "@/shared/hooks/use-toast";
import type { Campaign } from "@/shared/types/crm";
import type { CampaignFormData } from "../lib/campaign-utils";
import { useCampaignForm } from "../hooks/use-campaign-form";
import { useCampaignEdit } from "../hooks/use-campaign-edit";
import { deleteCampaignAction } from "../actions/campaigns";
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
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  const { formData, updateField, resetForm, submit } = useCampaignForm({
    onAddCampaign,
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submit();
    if (success) {
      setCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleCreateOpenChange = (isOpen: boolean) => {
    setCreateDialogOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
  };

  const handleDelete = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
  };

  const handleDeleteConfirm = () => {
    if (!deletingCampaign) return;

    startTransition(async () => {
      try {
        await deleteCampaignAction(deletingCampaign.id);
        toast({
          title: "Campanha deletada!",
          description: `A campanha "${deletingCampaign.name}" foi deletada com sucesso.`,
        });
        router.refresh();
        setDeletingCampaign(null);
      } catch (error) {
        toast({
          title: "Erro ao deletar campanha",
          description: error instanceof Error ? error.message : "Não foi possível deletar a campanha",
          variant: "destructive",
        });
      }
    });
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

        <Dialog open={createDialogOpen} onOpenChange={handleCreateOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleCreateSubmit}>
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
                  onClick={() => handleCreateOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Campanha
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {editingCampaign && (
        <EditCampaignDialog
          campaign={editingCampaign}
          open={!!editingCampaign}
          onOpenChange={(open) => !open && setEditingCampaign(null)}
        />
      )}

      <AlertDialog
        open={!!deletingCampaign}
        onOpenChange={(open) => !open && setDeletingCampaign(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a campanha "{deletingCampaign?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface EditCampaignDialogProps {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditCampaignDialog({ campaign, open, onOpenChange }: EditCampaignDialogProps) {
  const { formData, updateField, resetForm, submit, isPending } = useCampaignEdit({
    campaign,
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submit();
    if (success) {
      onOpenChange(false);
      resetForm();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>
              Atualize as informações da campanha.
            </DialogDescription>
          </DialogHeader>

          <CampaignForm formData={formData} onFieldChange={updateField} showStatus />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
