"use client";

import { FileText, List, Mail, MessageSquare, Phone } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { AvatarUpload } from "@/shared/components/ui/avatar-upload";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useToast } from "@/shared/hooks/use-toast";
import type { Lead, User as UserType } from "@/shared/types/crm";
import { uploadLeadAvatarAction } from "../actions/upload-avatar";
import { useLeadDrawer } from "../hooks/use-lead-drawer";
import { getInitials } from "../lib/avatar-utils";
import { LeadDetailsTab } from "./LeadDetailsTab";
import { LeadMessagesTab } from "./LeadMessagesTab";
import { LeadNotesTab } from "./LeadNotesTab";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  users: UserType[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  isOpen,
  users,
  onClose,
  onUpdate,
}) => {
  const { user: currentUser } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

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

  const { customFields, getCustomFieldValue } = useLeadDrawer({
    lead: actualLead,
    campaigns: [],
  });

  if (!lead) return null;

  // Convert single responsibleId to array for MultiResponsibleSelect
  const responsibleIds = lead.responsibleId ? [lead.responsibleId] : [];

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    const field = customFields.find((f) => f.id === fieldId);
    if (!field) return;

    if (field.name.toLowerCase() === "segmento") {
      onUpdate(lead.id, { segment: value });
    } else if (field.name.toLowerCase() === "faturamento") {
      onUpdate(lead.id, { revenue: value });
    }
  };

  const handleAvatarChange = async (file: File | null) => {
    setAvatarFile(file);

    if (file && currentWorkspace) {
      setIsUploadingAvatar(true);
      try {
        const result = await uploadLeadAvatarAction(
          lead.id,
          currentWorkspace.id,
          file,
        );

        if (result.success && result.url) {
          await onUpdate(lead.id, { avatarUrl: result.url });
          setAvatarFile(null);
          toast({
            title: "Avatar atualizado",
            description: "O avatar do lead foi atualizado com sucesso.",
          });
        } else {
          toast({
            title: "Erro ao fazer upload",
            description:
              result.error || "Não foi possível fazer upload do avatar",
            variant: "destructive",
          });
          setAvatarFile(null);
        }
      } catch (error) {
        toast({
          title: "Erro ao fazer upload",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro ao fazer upload do avatar",
          variant: "destructive",
        });
        setAvatarFile(null);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    onUpdate(lead.id, { avatarUrl: undefined });
  };

  const handleResponsibleChange = async (responsibleIds: string[]) => {
    // Por enquanto, pega o primeiro responsável do array
    // TODO: Criar tabela de relacionamento para múltiplos responsáveis
    const responsibleId =
      responsibleIds.length > 0 ? responsibleIds[0] : undefined;
    await onUpdate(lead.id, { responsibleId });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        {/* Header com avatar e informações do lead */}
        <div className="flex-shrink-0 bg-muted border-b px-6 py-5">
          <div className="flex items-start gap-5">
            <AvatarUpload
              value={avatarFile || lead.avatarUrl || null}
              onChange={handleAvatarChange}
              onRemove={handleAvatarRemove}
              disabled={isUploadingAvatar}
              size="md"
              fallbackText={getInitials(lead.name || "")}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-semibold mb-1 truncate text-foreground">
                {lead.name || "Sem nome"}
              </SheetTitle>
              {(lead.position || lead.company) && (
                <p className="text-sm text-muted-foreground mb-2">
                  {lead.position}
                  {lead.position && lead.company && " • "}
                  {lead.company}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {lead.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-shrink-0 border-b">
            <TabsList className="w-full justify-start rounded-none border-b-0 h-auto p-0 bg-transparent">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
              >
                <List className="w-4 h-4 mr-2" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                Notas
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Mensagens
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="details" className="mt-0">
                <LeadDetailsTab
                  lead={lead}
                  users={users}
                  customFields={customFields}
                  getCustomFieldValue={getCustomFieldValue}
                  onUpdate={onUpdate}
                  onCustomFieldChange={handleCustomFieldChange}
                  onResponsibleChange={handleResponsibleChange}
                  responsibleIds={responsibleIds}
                />
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <LeadNotesTab
                  lead={lead}
                  users={users}
                  currentUserId={currentUser?.id}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="messages" className="mt-0">
                <LeadMessagesTab lead={lead} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
