"use client";

import { useState } from "react";
import { usePipelineConfig } from "@/features/pipeline-config/hooks/use-pipeline-config";
import type { KanbanStage, Lead, ValidationError } from "@/shared/types/crm";
import { createLeadAction, moveLeadAction } from "../actions/leads";

interface UsePipelineUIReturn {
  selectedLead: Lead | null;
  isDrawerOpen: boolean;
  isCreateDialogOpen: boolean;
  createLeadStage: KanbanStage;
  setIsCreateDialogOpen: (open: boolean) => void;
  handleLeadSelect: (lead: Lead) => void;
  handleCloseDrawer: () => void;
  handleCreateLead: (stage: KanbanStage) => void;
  handleLeadCreated: (
    lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "sortOrder">,
  ) => Promise<Lead>;
  handleMoveLead: (
    leadId: string,
    newStage: KanbanStage,
    newSortOrder?: number,
  ) => Promise<ValidationError[] | null>;
}

export function usePipelineUI(): UsePipelineUIReturn {
  const { config: pipelineConfig } = usePipelineConfig();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLeadStage, setCreateLeadStage] = useState<KanbanStage>("base");

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedLead(null);
  };

  const handleCreateLead = (stage: KanbanStage) => {
    setCreateLeadStage(stage);
    setIsCreateDialogOpen(true);
  };

  const handleLeadCreated = async (
    lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "sortOrder">,
  ): Promise<Lead> => {
    return await createLeadAction(lead);
  };

  const handleMoveLead = async (
    leadId: string,
    newStage: KanbanStage,
    newSortOrder?: number,
  ): Promise<ValidationError[] | null> => {
    return await moveLeadAction(leadId, newStage, pipelineConfig, newSortOrder);
  };

  return {
    selectedLead,
    isDrawerOpen,
    isCreateDialogOpen,
    createLeadStage,
    setIsCreateDialogOpen,
    handleLeadSelect,
    handleCloseDrawer,
    handleCreateLead,
    handleLeadCreated,
    handleMoveLead,
  };
}
