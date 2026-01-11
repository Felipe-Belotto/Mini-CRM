"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import type { Lead } from "@/shared/types/crm";

type OptimisticAction =
  | { type: "archive"; leadId: string }
  | { type: "restore"; leadId: string }
  | { type: "delete"; leadId: string };

interface UseOptimisticLeadsProps {
  leads: Lead[];
  archivedLeads: Lead[];
}

interface UseOptimisticLeadsReturn {
  optimisticLeads: Lead[];
  optimisticArchivedLeads: Lead[];
  handleOptimisticArchive: (leadId: string) => void;
  handleOptimisticRestore: (leadId: string) => void;
  handleOptimisticDelete: (leadId: string) => void;
  isPending: boolean;
}

export function useOptimisticLeads({
  leads,
  archivedLeads,
}: UseOptimisticLeadsProps): UseOptimisticLeadsReturn {
  const [isPending, startTransition] = useTransition();

  const [optimisticLeads, setOptimisticLeads] = useOptimistic(
    leads,
    (state, action: OptimisticAction) => {
      if (action.type === "archive" || action.type === "delete") {
        return state.filter((lead) => lead.id !== action.leadId);
      }
      if (action.type === "restore") {
        const restoredLead = archivedLeads.find(
          (l) => l.id === action.leadId,
        );
        if (restoredLead) {
          return [...state, { ...restoredLead, archivedAt: undefined }];
        }
      }
      return state;
    },
  );

  const [optimisticArchivedLeads, setOptimisticArchivedLeads] = useOptimistic(
    archivedLeads,
    (state, action: OptimisticAction) => {
      if (action.type === "restore" || action.type === "delete") {
        return state.filter((lead) => lead.id !== action.leadId);
      }
      if (action.type === "archive") {
        const archivedLead = leads.find((l) => l.id === action.leadId);
        if (archivedLead) {
          return [...state, { ...archivedLead, archivedAt: new Date() }];
        }
      }
      return state;
    },
  );

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

  return {
    optimisticLeads,
    optimisticArchivedLeads,
    handleOptimisticArchive,
    handleOptimisticRestore,
    handleOptimisticDelete,
    isPending,
  };
}
