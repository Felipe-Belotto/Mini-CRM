"use client";

import {
  Archive,
  Clock,
  FileText,
  List,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { AvatarUpload } from "@/shared/components/ui/avatar-upload";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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
import {
  archiveLeadAction,
  deleteLeadAction,
  restoreLeadAction,
} from "../actions/leads";
import { uploadLeadAvatarAction } from "../actions/upload-avatar";
import { ActivityTimeline } from "@/features/activities/components/ActivityTimeline";
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
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  isOpen,
  users,
  onClose,
  onUpdate,
  onArchive,
  onDelete,
  onRestore,
}) => {
  const { user: currentUser } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const isArchived = lead?.archivedAt !== undefined;

  const handleArchive = async () => {
    if (!lead) return;
    setIsActioning(true);
    try {
      await archiveLeadAction(lead.id);
      toast({
        title: "Lead arquivado",
        description: "O lead foi movido para o arquivo.",
      });
      onArchive?.(lead.id);
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao arquivar",
        description:
          error instanceof Error ? error.message : "Não foi possível arquivar o lead",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleRestore = async () => {
    if (!lead) return;
    setIsActioning(true);
    try {
      await restoreLeadAction(lead.id);
      toast({
        title: "Lead restaurado",
        description: "O lead foi restaurado com sucesso.",
      });
      onRestore?.(lead.id);
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao restaurar",
        description:
          error instanceof Error ? error.message : "Não foi possível restaurar o lead",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    setIsActioning(true);
    try {
      await deleteLeadAction(lead.id);
      toast({
        title: "Lead excluído",
        description: "O lead foi excluído permanentemente.",
      });
      onDelete?.(lead.id);
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description:
          error instanceof Error ? error.message : "Não foi possível excluir o lead",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
      setShowDeleteDialog(false);
    }
  };

  const mockLead: Lead = {
    id: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    company: "",
    stage: "base",
    workspaceId: "",
    responsibleIds: [],
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const actualLead = lead || mockLead;

  const { customFields, getCustomFieldValue } = useLeadDrawer({
    lead: actualLead,
    campaigns: [],
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
    await onUpdate(lead.id, { responsibleIds });
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
              {isArchived && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full mb-2">
                  <Archive className="w-3 h-3" />
                  Arquivado
                </span>
              )}
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
          <div className="flex-shrink-0 border-b flex items-center justify-between pr-4">
            <TabsList className="justify-start rounded-none border-b-0 h-auto p-0 bg-transparent">
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
              <TabsTrigger
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
              >
                <Clock className="w-4 h-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  disabled={isActioning}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Ações do lead</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isArchived ? (
                  <DropdownMenuItem
                    onClick={handleRestore}
                    disabled={isActioning}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar lead
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={handleArchive}
                    disabled={isActioning}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar lead
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isActioning}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir permanentemente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  responsibleIds={lead.responsibleIds}
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

              <TabsContent value="history" className="mt-0">
                <ActivityTimeline leadId={lead.id} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lead{" "}
              <strong>{lead?.name}</strong> será excluído permanentemente do
              sistema, incluindo todas as notas, mensagens e histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isActioning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActioning ? "Excluindo..." : "Excluir permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
