"use client";

import { useCallback } from "react";
import { reorderLeadsAction } from "../actions/leads";

interface UsePipelineOperationsReturn {
  handleReorderLeads: (
    leadUpdates: { id: string; sortOrder: number }[]
  ) => Promise<void>;
}

/**
 * Hook para gerenciar operações do pipeline (reordenação, etc.)
 */
export function usePipelineOperations(): UsePipelineOperationsReturn {
  const handleReorderLeads = useCallback(
    async (leadUpdates: { id: string; sortOrder: number }[]) => {
      await reorderLeadsAction(leadUpdates);
    },
    []
  );

  return {
    handleReorderLeads,
  };
}
