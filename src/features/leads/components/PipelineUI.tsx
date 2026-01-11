"use client";

import type React from "react";
import type {
  Campaign,
  CustomField,
  Lead,
  PipelineStage,
  User,
} from "@/shared/types/crm";
import { useLeadFilters } from "../hooks/use-lead-filters";
import { useLeadPromotion } from "../hooks/use-lead-promotion";
import { useOptimisticLeads } from "../hooks/use-optimistic-leads";
import { usePipelineData } from "../hooks/use-pipeline-data";
import { usePipelineOperations } from "../hooks/use-pipeline-operations";
import { usePipelineUI } from "../hooks/use-pipeline-ui";
import { usePipelineUrlSync } from "../hooks/use-pipeline-url-sync";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { KanbanBoard } from "./KanbanBoard";
import { LeadDrawer } from "./LeadDrawer";
import { PipelineFilters } from "./PipelineFilters";

interface PipelineUIProps {
  leads: Lead[];
  archivedLeads?: Lead[];
  campaigns?: Campaign[];
  users?: User[];
  customFields?: CustomField[];
  stages?: PipelineStage[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
}

export const PipelineUI: React.FC<PipelineUIProps> = ({
  leads: serverLeads,
  archivedLeads: serverArchivedLeads = [],
  campaigns = [],
  users = [],
  customFields = [],
  stages,
  onUpdateLead,
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
    handleMoveLead,
  } = usePipelineUI();

  const {
    optimisticLeads,
    optimisticArchivedLeads,
    handleOptimisticArchive,
    handleOptimisticRestore,
    handleOptimisticDelete,
  } = useOptimisticLeads({
    leads: serverLeads,
    archivedLeads: serverArchivedLeads,
  });

  const {
    filters,
    filteredLeads,
    activeFiltersCount,
    updateFilter,
    updateCustomFieldFilter,
    clearFilters,
    clearSearch,
  } = useLeadFilters({
    leads: optimisticLeads,
    archivedLeads: optimisticArchivedLeads,
    campaigns,
    users,
    customFields,
  });

  const { allLeads, currentLead } = usePipelineData({
    optimisticLeads,
    optimisticArchivedLeads,
    selectedLead,
  });

  const { eligibleForPromotionCount, isPromoting, handlePromoteEligibleLeads } =
    useLeadPromotion({
      leads: optimisticLeads,
    });

  const { handleReorderLeads } = usePipelineOperations();

  usePipelineUrlSync({
    allLeads,
    selectedLead,
    isDrawerOpen,
    onLeadSelect: handleLeadSelect,
  });

  return (
    <div className="flex flex-col h-full">
      <PipelineFilters
        filters={filters}
        activeFiltersCount={activeFiltersCount}
        campaigns={campaigns}
        users={users}
        customFields={customFields}
        eligibleForPromotionCount={eligibleForPromotionCount}
        isPromoting={isPromoting}
        onUpdateFilter={updateFilter}
        onUpdateCustomFieldFilter={updateCustomFieldFilter}
        onClearFilters={clearFilters}
        onClearSearch={clearSearch}
        onPromoteEligibleLeads={handlePromoteEligibleLeads}
      />
      <div className="flex-1 min-h-0">
        <KanbanBoard
          leads={filteredLeads}
          users={users}
          stages={stages}
          onMoveLead={handleMoveLead}
          onReorderLeads={handleReorderLeads}
          onLeadSelect={handleLeadSelect}
          onCreateLead={handleCreateLead}
        />
      </div>
      <LeadDrawer
        lead={currentLead}
        isOpen={isDrawerOpen}
        users={users}
        campaigns={campaigns}
        onClose={handleCloseDrawer}
        onUpdate={onUpdateLead}
        onMoveLead={handleMoveLead}
        onArchive={handleOptimisticArchive}
        onRestore={handleOptimisticRestore}
        onDelete={handleOptimisticDelete}
      />
      <CreateLeadDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialStage={createLeadStage}
        users={users}
      />
    </div>
  );
};
