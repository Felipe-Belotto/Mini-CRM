"use client";

import { useCallback, useEffect, useState } from "react";
import type { Campaign, CustomField, Lead, KanbanStage, ValidationError } from "@/shared/types/crm";
import { useAISuggestions } from "../hooks/use-ai-suggestions";
import { useToast } from "@/shared/hooks/use-toast";
import { getLeadMessagesAction, saveMessageAction, type LeadMessageSent } from "../actions/messages";
import { getNextStageAfterMessage, shouldMoveToContactingStage } from "../lib/stage-utils";
import { LeadAIMessagesSection } from "./LeadAIMessagesSection";
import { MessageHistory } from "./MessageHistory";
import { Separator } from "@/shared/components/ui/separator";

interface LeadMessagesTabProps {
  lead: Lead;
  campaigns: Campaign[];
  customFields?: CustomField[];
  customFieldValues?: Record<string, string>;
  initialMessages?: LeadMessageSent[];
  onMoveLead?: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
  onMessageSent?: () => void;
}

export function LeadMessagesTab({
  lead,
  campaigns,
  customFields,
  customFieldValues,
  initialMessages = [],
  onMoveLead,
  onMessageSent,
}: LeadMessagesTabProps) {
  const { toast } = useToast();
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LeadMessageSent[]>(initialMessages);
  const [selectedChannels, setSelectedChannels] = useState<("whatsapp" | "email")[]>(["whatsapp", "email"]);

  // Atualizar mensagens quando initialMessages prop muda (drawer busca novas mensagens)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const {
    isGenerating,
    showSuggestions,
    suggestions,
    error,
    generateSuggestions,
    clearSuggestions,
  } = useAISuggestions();

  const handleGenerate = useCallback(
    (campaign: Campaign, channels: ("whatsapp" | "email")[]) => {
      setSelectedCampaignId(campaign.id);
      setSelectedChannels(channels);
      generateSuggestions(campaign, lead, customFields, customFieldValues, channels);
    },
    [lead, customFields, customFieldValues, generateSuggestions],
  );

  const handleRegenerate = useCallback(
    (campaign: Campaign, channels: ("whatsapp" | "email")[]) => {
      clearSuggestions();
      setSelectedCampaignId(campaign.id);
      setSelectedChannels(channels);
      generateSuggestions(campaign, lead, customFields, customFieldValues, channels);
    },
    [lead, customFields, customFieldValues, generateSuggestions, clearSuggestions],
  );

  const handleSendMessage = useCallback(
    async (messageType: string, messageContent: string) => {
      setSendingMessage(true);

      try {
        // Salvar mensagem no histórico
        await saveMessageAction({
          leadId: lead.id,
          workspaceId: lead.workspaceId,
          campaignId: selectedCampaignId || undefined,
          channel: messageType.toLowerCase(),
          content: messageContent,
        });

        // Mover lead para próxima etapa se necessário
        if (onMoveLead && shouldMoveToContactingStage(lead)) {
          const nextStage = getNextStageAfterMessage(lead.stage);
          const errors = await onMoveLead(lead.id, nextStage);

          if (errors && errors.length > 0) {
            toast({
              title: "Campos obrigatórios",
              description: errors.map((e) => e.message).join(", "),
              variant: "destructive",
            });
            setSendingMessage(false);
            return;
          }
        }

        toast({
          title: "Mensagem registrada!",
          description: `Mensagem de ${messageType} registrada para ${lead.name}.`,
        });

        // Recarregar mensagens após salvar (revalidação do Next.js vai atualizar no próximo render)
        try {
          const updatedMessages = await getLeadMessagesAction(lead.id);
          setMessages(updatedMessages);
        } catch (error) {
          console.error("Error reloading messages:", error);
        }

        // Callback para atualizar UI externa
        onMessageSent?.();
      } catch (err) {
        toast({
          title: "Erro ao registrar mensagem",
          description:
            err instanceof Error ? err.message : "Não foi possível registrar a mensagem",
          variant: "destructive",
        });
      } finally {
        setSendingMessage(false);
      }
    },
    [lead, selectedCampaignId, onMoveLead, onMessageSent, toast],
  );

  return (
    <div className="space-y-6">
      {/* Seção de geração de mensagens com IA */}
      <LeadAIMessagesSection
        lead={lead}
        campaigns={campaigns}
        customFields={customFields}
        customFieldValues={customFieldValues}
        isGenerating={isGenerating}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        error={error}
        selectedChannels={selectedChannels}
        onGenerate={handleGenerate}
        onRegenerate={handleRegenerate}
        onSendMessage={handleSendMessage}
        sendingMessage={sendingMessage}
      />

      <Separator />

      {/* Histórico de mensagens enviadas */}
      <MessageHistory messages={messages} />
    </div>
  );
}
