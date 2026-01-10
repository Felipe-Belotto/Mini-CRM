"use client";

import { useState, useMemo, useCallback } from "react";
import type { Lead, Campaign, User, CustomField } from "@/shared/types/crm";

export interface LeadFilters {
  search: string;
  campaignId: string | null;
  responsibleId: string | null;
  origin: string | null;
  dateRange: { from: Date | null; to: Date | null };
  customFields: Record<string, unknown>;
  showArchived: boolean;
}

const initialFilters: LeadFilters = {
  search: "",
  campaignId: null,
  responsibleId: null,
  origin: null,
  dateRange: { from: null, to: null },
  customFields: {},
  showArchived: false,
};

interface UseLeadFiltersProps {
  leads: Lead[];
  archivedLeads?: Lead[];
  campaigns?: Campaign[];
  users?: User[];
  customFields?: CustomField[];
}

export function useLeadFilters({
  leads,
  archivedLeads = [],
  campaigns = [],
  users = [],
  customFields = [],
}: UseLeadFiltersProps) {
  const [filters, setFilters] = useState<LeadFilters>(initialFilters);

  // Conta quantos filtros estão ativos (excluindo busca vazia)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.campaignId) count++;
    if (filters.responsibleId) count++;
    if (filters.origin) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.showArchived) count++;
    count += Object.keys(filters.customFields).filter(
      (key) => filters.customFields[key] !== null && filters.customFields[key] !== undefined && filters.customFields[key] !== ""
    ).length;
    return count;
  }, [filters]);

  // Filtra os leads baseado nos filtros aplicados
  const filteredLeads = useMemo(() => {
    // Determina qual lista usar baseado no filtro showArchived
    const sourceLeads = filters.showArchived ? archivedLeads : leads;
    
    return sourceLeads.filter((lead) => {
      // Filtro de busca textual
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.toLowerCase().includes(searchLower) ||
          lead.company?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por campanha
      if (filters.campaignId && lead.campaignId !== filters.campaignId) {
        return false;
      }

      // Filtro por responsável
      if (filters.responsibleId && !lead.responsibleIds.includes(filters.responsibleId)) {
        return false;
      }

      // Filtro por origem
      if (filters.origin && lead.origin !== filters.origin) {
        return false;
      }

      // Filtro por data de criação
      if (filters.dateRange.from || filters.dateRange.to) {
        const leadDate = new Date(lead.createdAt);
        if (filters.dateRange.from && leadDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to) {
          const endOfDay = new Date(filters.dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (leadDate > endOfDay) {
            return false;
          }
        }
      }

      return true;
    });
  }, [leads, archivedLeads, filters]);

  const updateFilter = useCallback(<K extends keyof LeadFilters>(
    key: K,
    value: LeadFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateCustomFieldFilter = useCallback((fieldId: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldId]: value,
      },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const clearSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: "" }));
  }, []);

  return {
    filters,
    filteredLeads,
    activeFiltersCount,
    updateFilter,
    updateCustomFieldFilter,
    clearFilters,
    clearSearch,
    campaigns,
    users,
    customFields,
  };
}
