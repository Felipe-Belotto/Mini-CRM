"use client";

import { useState } from "react";
import type { Campaign, Lead } from "@/shared/types/crm";
import { generateMessagesAction } from "@/features/ai-messages/actions/ai-messages";
import type { AISuggestion } from "../lib/message-utils";
import { useToast } from "@/shared/hooks/use-toast";

export function useAISuggestions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const { toast } = useToast();

  const generateSuggestions = async (
    campaign: Campaign | null,
    lead: Lead,
  ) => {
    if (!campaign) {
      toast({
        title: "Campanha necessária",
        description: "Selecione uma campanha antes de gerar mensagens",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setShowSuggestions(false);

    try {
      const result = await generateMessagesAction({ campaign, lead });

      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
        setShowSuggestions(true);
      } else {
        toast({
          title: "Erro ao gerar mensagens",
          description: result.error || "Não foi possível gerar as mensagens",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao gerar mensagens:", error);
      toast({
        title: "Erro ao gerar mensagens",
        description: "Ocorreu um erro ao gerar as mensagens",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    showSuggestions,
    suggestions,
    generateSuggestions,
  };
}
