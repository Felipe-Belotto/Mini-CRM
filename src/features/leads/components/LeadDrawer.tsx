"use client";

import { Sparkles, User } from "lucide-react";
import type React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import type { KanbanStage, Lead, ValidationError, Campaign } from "@/shared/types/crm";
import { useLeadDrawer } from "../hooks/use-lead-drawer";
import { useMessageSender } from "../hooks/use-message-sender";
import { LeadEditForm } from "./LeadEditForm";
import { LeadAISection } from "./LeadAISection";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
  campaigns?: Campaign[];
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdate,
  onMoveLead,
  campaigns = [],
}) => {
  const mockLead: Lead = {
    id: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    company: "",
    stage: "base",
    workspaceId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const actualLead = lead || mockLead;

  const {
    customFields,
    activeCampaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    getCustomFieldValue,
    isGenerating,
    showSuggestions,
    suggestions,
    handleGenerateSuggestions,
  } = useLeadDrawer({ lead: actualLead, campaigns });

  const { sendingMessage, sendMessage } = useMessageSender({
    lead: actualLead,
    onMoveLead,
  });

  if (!lead) return null;

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    const field = customFields.find((f) => f.id === fieldId);
    if (!field) return;

    if (field.name.toLowerCase() === "segmento") {
      onUpdate(lead.id, { segment: value });
    } else if (field.name.toLowerCase() === "faturamento") {
      onUpdate(lead.id, { revenue: value });
    }
  };

  const handleSendMessage = async (messageType: string) => {
    await sendMessage(messageType);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <div className="flex-shrink-0 p-6 border-b">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-left">{lead.name || "Lead sem nome"}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {lead.company}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Edição
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  IA
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="space-y-4">
                <LeadEditForm
                  lead={lead}
                  customFields={customFields}
                  getCustomFieldValue={getCustomFieldValue}
                  onUpdate={onUpdate}
                  onCustomFieldChange={handleCustomFieldChange}
                />
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <LeadAISection
                  lead={lead}
                  activeCampaigns={activeCampaigns}
                  selectedCampaignId={selectedCampaignId}
                  onCampaignChange={setSelectedCampaignId}
                  isGenerating={isGenerating}
                  showSuggestions={showSuggestions}
                  suggestions={suggestions}
                  onGenerate={handleGenerateSuggestions}
                  onSendMessage={handleSendMessage}
                  sendingMessage={sendingMessage}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
