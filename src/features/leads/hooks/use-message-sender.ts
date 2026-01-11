"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type { KanbanStage, Lead, ValidationError } from "@/shared/types/crm";
import { saveMessageAction } from "../actions/messages";
import {
  getNextStageAfterMessage,
  shouldMoveToContactingStage,
} from "../lib/stage-utils";

interface UseMessageSenderProps {
  lead: Lead;
  campaignId?: string;
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
  onMessageSent?: () => void;
}

export function useMessageSender({ lead, campaignId, onMoveLead, onMessageSent }: UseMessageSenderProps) {
  const { toast } = useToast();
  const [sendingMessage, setSendingMessage] = useState(false);

  const sendMessage = async (messageType: string, messageContent: string) => {
    setSendingMessage(true);

    try {
      // Simular delay de envio (em produção seria a chamada real à API)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Salvar mensagem no histórico
      await saveMessageAction({
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        campaignId,
        channel: messageType.toLowerCase(),
        content: messageContent,
      });

      // Mover lead para próxima etapa se necessário
      if (shouldMoveToContactingStage(lead)) {
        const nextStage = getNextStageAfterMessage(lead.stage);
        const errors = await onMoveLead(lead.id, nextStage);

        if (errors && errors.length > 0) {
          toast({
            title: "Campos obrigatórios",
            description: errors.map((e) => e.message).join(", "),
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Mensagem enviada!",
        description: `${messageType} enviado para ${lead.name}. Lead movido para "Tentando Contato".`,
      });

      // Callback para atualizar UI
      onMessageSent?.();
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return {
    sendingMessage,
    sendMessage,
  };
}
