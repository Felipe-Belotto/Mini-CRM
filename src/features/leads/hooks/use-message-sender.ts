"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type { KanbanStage, Lead, ValidationError } from "@/shared/types/crm";
import {
  getNextStageAfterMessage,
  shouldMoveToContactingStage,
} from "../lib/stage-utils";

interface UseMessageSenderProps {
  lead: Lead;
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
}

export function useMessageSender({ lead, onMoveLead }: UseMessageSenderProps) {
  const { toast } = useToast();
  const [sendingMessage, setSendingMessage] = useState(false);

  const sendMessage = async (messageType: string) => {
    setSendingMessage(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
    } finally {
      setSendingMessage(false);
    }
  };

  return {
    sendingMessage,
    sendMessage,
  };
}
