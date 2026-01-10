"use client";

import type React from "react";
import { useMemo } from "react";
import type {
  KanbanStage,
  Lead,
  ValidationError,
  Campaign,
  User,
} from "@/shared/types/crm";
import { KanbanBoard } from "./KanbanBoard";
import { LeadDrawer } from "./LeadDrawer";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { usePipelineUI } from "../hooks/use-pipeline-ui";

interface PipelineUIProps {
  leads: Lead[];
  campaigns?: Campaign[];
  users?: User[];
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
  users = [],
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

  // Sincroniza o selectedLead com a lista de leads atualizada
  const currentLead = useMemo(() => {
    if (!selectedLead) return null;
    return leads.find((l) => l.id === selectedLead.id) || selectedLead;
  }, [selectedLead, leads]);

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
          users={users}
          onMoveLead={handleMoveLead}
          onLeadSelect={handleLeadSelect}
          onCreateLead={handleCreateLead}
        />
      </div>
      <LeadDrawer
        lead={currentLead}
        isOpen={isDrawerOpen}
        users={users}
        onClose={handleCloseDrawer}
        onUpdate={onUpdateLead}
      />
      <CreateLeadDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialStage={createLeadStage}
        users={users}
        onCreateLead={handleLeadCreated}
      />
    </>
  );
};
