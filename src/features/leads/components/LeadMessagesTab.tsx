"use client";

import { MessageSquare } from "lucide-react";
import type { Lead } from "@/shared/types/crm";

interface LeadMessagesTabProps {
  lead: Lead;
}

export function LeadMessagesTab({ lead }: LeadMessagesTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">Mensagens</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Esta funcionalidade estará disponível em breve. Você poderá visualizar
        e gerenciar todas as mensagens relacionadas a este lead aqui.
      </p>
    </div>
  );
}