"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Lead } from "@/shared/types/crm";

interface UsePipelineUrlSyncProps {
  allLeads: Lead[];
  selectedLead: Lead | null;
  isDrawerOpen: boolean;
  onLeadSelect: (lead: Lead) => void;
}

/**
 * Hook para sincronizar o estado do pipeline com parâmetros da URL
 */
export function usePipelineUrlSync({
  allLeads,
  selectedLead,
  isDrawerOpen,
  onLeadSelect,
}: UsePipelineUrlSyncProps): void {
  const searchParams = useSearchParams();

  useEffect(() => {
    const leadIdFromParams = searchParams.get("lead");
    if (leadIdFromParams && !isDrawerOpen && allLeads.length > 0) {
      const leadFromParams = allLeads.find((l) => l.id === leadIdFromParams);
      if (leadFromParams && (!selectedLead || selectedLead.id !== leadIdFromParams)) {
        onLeadSelect(leadFromParams);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLeads.length]);
}
