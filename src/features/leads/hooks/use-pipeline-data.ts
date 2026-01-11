"use client";

import { useMemo } from "react";
import type { Lead } from "@/shared/types/crm";

interface UsePipelineDataProps {
  optimisticLeads: Lead[];
  optimisticArchivedLeads: Lead[];
  selectedLead: Lead | null;
}

interface UsePipelineDataReturn {
  allLeads: Lead[];
  currentLead: Lead | null;
}

/**
 * Hook para combinar e processar dados do pipeline
 */
export function usePipelineData({
  optimisticLeads,
  optimisticArchivedLeads,
  selectedLead,
}: UsePipelineDataProps): UsePipelineDataReturn {
  const allLeads = useMemo(
    () => [...optimisticLeads, ...optimisticArchivedLeads],
    [optimisticLeads, optimisticArchivedLeads]
  );

  const currentLead = useMemo(() => {
    if (!selectedLead) return null;
    return allLeads.find((l) => l.id === selectedLead.id) || selectedLead;
  }, [selectedLead, allLeads]);

  return {
    allLeads,
    currentLead,
  };
}
