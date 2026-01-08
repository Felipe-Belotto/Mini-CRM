"use client";

import type React from "react";
import { useState } from "react";
import type { KanbanStage, Lead, ValidationError } from "@/shared/types/crm";
import { KanbanBoard } from "./KanbanBoard";
import { LeadDrawer } from "./LeadDrawer";

interface PipelineUIProps {
  leads: Lead[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
}

export const PipelineUI: React.FC<PipelineUIProps> = ({
  leads,
  onUpdateLead,
  onMoveLead,
}) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedLead(null);
  };

  return (
    <>
      <div className="p-6">
        <KanbanBoard
          leads={leads}
          onMoveLead={onMoveLead}
          onLeadSelect={handleLeadSelect}
        />
      </div>
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onUpdate={onUpdateLead}
        onMoveLead={onMoveLead}
      />
    </>
  );
};
