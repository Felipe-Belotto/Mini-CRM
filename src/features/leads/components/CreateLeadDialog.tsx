"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { KanbanStage, User } from "@/shared/types/crm";
import { CreateLeadWizard } from "./CreateLeadWizard";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStage?: KanbanStage;
  users: User[];
}

export function CreateLeadDialog({
  open,
  onOpenChange,
  initialStage,
  users,
}: CreateLeadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
        </DialogHeader>
        <CreateLeadWizard
          initialStage={initialStage}
          users={users}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
