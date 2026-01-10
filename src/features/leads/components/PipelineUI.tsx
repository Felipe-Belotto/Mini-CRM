"use client";

import type React from "react";
import type {
  KanbanStage,
  Lead,
  ValidationError,
  Campaign,
} from "@/shared/types/crm";
import { KanbanBoard } from "./KanbanBoard";
import { LeadDrawer } from "./LeadDrawer";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { usePipelineUI } from "../hooks/use-pipeline-ui";

interface PipelineUIProps {
  leads: Lead[];
  campaigns?: Campaign[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
  onLeadCreated?: (lead: Lead) => void;
}

export const PipelineUI: React.FC<PipelineUIProps> = ({
  leads,
  campaigns = [],
  onUpdateLead,
  onMoveLead,
  onLeadCreated,
}) => {
  const {
    selectedLead,
    isDrawerOpen,
    isCreateDialogOpen,
    createLeadStage,
    setIsCreateDialogOpen,
    handleLeadSelect,
    handleCloseDrawer,
    handleCreateLead,
    handleLeadCreated: handleLeadCreatedInternal,
    handleMoveLead,
  } = usePipelineUI();

  const handleLeadCreated = async (
    lead: Omit<Lead, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newLead = await handleLeadCreatedInternal(lead);
    if (onLeadCreated) {
      onLeadCreated(newLead);
    }
  };

  return (
    <>
      <div className="p-6">
        <KanbanBoard
          leads={leads}
          onMoveLead={handleMoveLead}
          onLeadSelect={handleLeadSelect}
          onCreateLead={handleCreateLead}
        />
      </div>
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onUpdate={onUpdateLead}
        onMoveLead={handleMoveLead}
        campaigns={campaigns}
      />
      <CreateLeadDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialStage={createLeadStage}
        onCreateLead={handleLeadCreated}
      />
    </>
  );
};
