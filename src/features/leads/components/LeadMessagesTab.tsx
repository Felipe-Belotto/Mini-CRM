"use client";

import type { Lead } from "@/shared/types/crm";
import { MessageHistory } from "./MessageHistory";

interface LeadMessagesTabProps {
  lead: Lead;
}

export function LeadMessagesTab({ lead }: LeadMessagesTabProps) {
  return (
    <div className="space-y-6">
      <MessageHistory leadId={lead.id} />
    </div>
  );
}
