"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type { Campaign, Lead, KanbanStage, ValidationError } from "@/shared/types/crm";
import { getLeadMessagesAction, saveMessageAction } from "../actions/messages";
import { getNextStageAfterMessage, shouldMoveToContactingStage } from "../lib/stage-utils";

interface UseSendMessageProps {
  lead: Lead;
  selectedCampaignId: string | null;
  onMoveLead?: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
  onMessageSent?: () => void;
}

interface UseSendMessageReturn {
  sendMessage: (messageType: string, messageContent: string, campaignId?: string) => Promise<void>;
  sendingMessage: boolean;
  refreshMessages: () => Promise<Array<import("../actions/messages").LeadMessageSent>>;
}

export function useSendMessage({
  lead,
  selectedCampaignId,
  onMoveLead,
  onMessageSent,
}: UseSendMessageProps): UseSendMessageReturn {
  const { toast } = useToast();
  const [sendingMessage, setSendingMessage] = useState(false);

  const sendMessage = useCallback(
    async (messageType: string, messageContent: string, campaignId?: string) => {
      setSendingMessage(true);

      try {
        await saveMessageAction({
          leadId: lead.id,
          workspaceId: lead.workspaceId,
          campaignId: campaignId || selectedCampaignId || undefined,
          channel: messageType.toLowerCase(),
          content: messageContent,
        });

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

  const refreshMessages = useCallback(async () => {
    try {
      return await getLeadMessagesAction(lead.id);
    } catch (error) {
      console.error("Error reloading messages:", error);
      return [];
    }
  }, [lead.id]);

  return {
    sendMessage,
    sendingMessage,
    refreshMessages,
  };
}
