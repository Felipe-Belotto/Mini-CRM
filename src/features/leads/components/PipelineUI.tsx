"use client";

import type React from "react";
import {
  useCallback,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import type {
  Campaign,
  CustomField,
  Lead,
  User,
} from "@/shared/types/crm";
import { useToast } from "@/shared/hooks/use-toast";
import { promoteEligibleLeadsAction, reorderLeadsAction } from "../actions/leads";
import { countEligibleLeadsForPromotion } from "../lib/lead-utils";
import { useLeadFilters } from "../hooks/use-lead-filters";
import { usePipelineUI } from "../hooks/use-pipeline-ui";
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
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
}

type OptimisticAction =
  | { type: "archive"; leadId: string }
  | { type: "restore"; leadId: string }
  | { type: "delete"; leadId: string };

export const PipelineUI: React.FC<PipelineUIProps> = ({
  leads: serverLeads,
  archivedLeads: serverArchivedLeads = [],
  campaigns = [],
  users = [],
  customFields = [],
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

  // Estado otimista para leads ativos
  const [optimisticLeads, setOptimisticLeads] = useOptimistic(
    serverLeads,
    (state, action: OptimisticAction) => {
      if (action.type === "archive" || action.type === "delete") {
        return state.filter((lead) => lead.id !== action.leadId);
      }
      if (action.type === "restore") {
        const restoredLead = serverArchivedLeads.find(
          (l) => l.id === action.leadId,
        );
        if (restoredLead) {
          return [...state, { ...restoredLead, archivedAt: undefined }];
        }
      }
      return state;
    },
  );

  // Estado otimista para leads arquivados
  const [optimisticArchivedLeads, setOptimisticArchivedLeads] = useOptimistic(
    serverArchivedLeads,
    (state, action: OptimisticAction) => {
      if (action.type === "restore" || action.type === "delete") {
        return state.filter((lead) => lead.id !== action.leadId);
      }
      if (action.type === "archive") {
        const archivedLead = serverLeads.find((l) => l.id === action.leadId);
        if (archivedLead) {
          return [...state, { ...archivedLead, archivedAt: new Date() }];
        }
      }
      return state;
    },
  );

  const [isPending, startTransition] = useTransition();

  // Handlers otimistas
  const handleOptimisticArchive = useCallback(
    (leadId: string) => {
      startTransition(() => {
        setOptimisticLeads({ type: "archive", leadId });
        setOptimisticArchivedLeads({ type: "archive", leadId });
      });
    },
    [setOptimisticLeads, setOptimisticArchivedLeads],
  );

  const handleOptimisticRestore = useCallback(
    (leadId: string) => {
      startTransition(() => {
        setOptimisticLeads({ type: "restore", leadId });
        setOptimisticArchivedLeads({ type: "restore", leadId });
      });
    },
    [setOptimisticLeads, setOptimisticArchivedLeads],
  );

  const handleOptimisticDelete = useCallback(
    (leadId: string) => {
      startTransition(() => {
        setOptimisticLeads({ type: "delete", leadId });
        setOptimisticArchivedLeads({ type: "delete", leadId });
      });
    },
    [setOptimisticLeads, setOptimisticArchivedLeads],
  );

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

  const { toast } = useToast();
  const [isPromoting, setIsPromoting] = useState(false);

  // Conta leads elegíveis para promoção
  const eligibleForPromotionCount = useMemo(
    () => countEligibleLeadsForPromotion(optimisticLeads),
    [optimisticLeads]
  );

  // Handler para reordenar leads
  const handleReorderLeads = useCallback(
    async (leadUpdates: { id: string; sortOrder: number }[]) => {
      await reorderLeadsAction(leadUpdates);
    },
    [],
  );

  // Handler para promover leads elegíveis
  const handlePromoteEligibleLeads = useCallback(async () => {
    setIsPromoting(true);
    try {
      const result = await promoteEligibleLeadsAction();
      
      if (result.success) {
        if (result.promotedCount > 0) {
          toast({
            title: "Leads promovidos!",
            description: `${result.promotedCount} lead${result.promotedCount > 1 ? "s" : ""} ${result.promotedCount > 1 ? "foram movidos" : "foi movido"} para "Lead Mapeado".`,
          });
        } else {
          toast({
            title: "Nenhum lead elegível",
            description: "Não há leads na Base que atendam aos critérios de promoção.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Erro ao promover leads",
          description: result.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error promoting leads:", error);
      toast({
        title: "Erro ao promover leads",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  }, [toast]);

  // Sincroniza o selectedLead com a lista de leads atualizada (incluindo arquivados)
  const allLeads = useMemo(
    () => [...optimisticLeads, ...optimisticArchivedLeads],
    [optimisticLeads, optimisticArchivedLeads],
  );
  const currentLead = useMemo(() => {
    if (!selectedLead) return null;
    return allLeads.find((l) => l.id === selectedLead.id) || selectedLead;
  }, [selectedLead, allLeads]);

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
        onClose={handleCloseDrawer}
        onUpdate={onUpdateLead}
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
