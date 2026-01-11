"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type { Lead } from "@/shared/types/crm";
import { promoteEligibleLeadsAction } from "../actions/leads";
import { countEligibleLeadsForPromotion } from "../lib/lead-utils";

interface UseLeadPromotionProps {
  leads: Lead[];
}

interface UseLeadPromotionReturn {
  eligibleForPromotionCount: number;
  isPromoting: boolean;
  handlePromoteEligibleLeads: () => Promise<void>;
}

/**
 * Hook para gerenciar a lógica de promoção de leads elegíveis
 */
export function useLeadPromotion({
  leads,
}: UseLeadPromotionProps): UseLeadPromotionReturn {
  const { toast } = useToast();
  const [isPromoting, setIsPromoting] = useState(false);

  // Conta leads elegíveis para promoção
  const eligibleForPromotionCount = useMemo(
    () => countEligibleLeadsForPromotion(leads),
    [leads]
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

  return {
    eligibleForPromotionCount,
    isPromoting,
    handlePromoteEligibleLeads,
  };
}
