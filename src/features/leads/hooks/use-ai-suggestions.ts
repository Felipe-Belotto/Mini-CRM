"use client";

import { useState } from "react";
import type { Campaign, Lead, CustomField } from "@/shared/types/crm";
import { generateMessagesAction } from "@/features/ai-messages/actions/ai-messages";
import type { AISuggestion } from "../lib/message-utils";
import { useToast } from "@/shared/hooks/use-toast";

export function useAISuggestions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async (
    campaign: Campaign | null,
    lead: Lead,
    customFields?: CustomField[],
    customFieldValues?: Record<string, string>,
    channels: ("whatsapp" | "email")[] = ["whatsapp", "email"],
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
    setError(null);

    try {
      const result = await generateMessagesAction({
        campaign,
        lead,
        customFields,
        customFieldValues,
        channels,
      });

      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
        setShowSuggestions(true);
      } else {
        setError(result.error || "Não foi possível gerar as mensagens");
        toast({
          title: "Erro ao gerar mensagens",
          description: result.error || "Não foi possível gerar as mensagens",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao gerar mensagens:", err);
      setError("Ocorreu um erro ao gerar as mensagens");
      toast({
        title: "Erro ao gerar mensagens",
        description: "Ocorreu um erro ao gerar as mensagens",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  return {
    isGenerating,
    showSuggestions,
    suggestions,
    error,
    generateSuggestions,
    clearSuggestions,
  };
}
