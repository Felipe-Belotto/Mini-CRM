"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { CreateLeadForm } from "./CreateLeadForm";
import type { KanbanStage, Lead, User } from "@/shared/types/crm";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStage?: KanbanStage;
  users: User[];
  onCreateLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export function CreateLeadDialog({
  open,
  onOpenChange,
  initialStage,
  users,
  onCreateLead,
}: CreateLeadDialogProps) {
  const handleSuccess = async () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha as informações do lead para adicioná-lo ao pipeline
          </DialogDescription>
        </DialogHeader>
        <CreateLeadForm
          initialStage={initialStage}
          users={users}
          onSubmit={async () => {
            // O lead já foi criado no CreateLeadForm, apenas fechar o dialog
            handleSuccess();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
