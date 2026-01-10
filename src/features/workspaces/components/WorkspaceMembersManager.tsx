"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Plus, Mail, Copy, Check } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import {
  getWorkspaceMembersAction,
  canManageWorkspaceAction,
} from "../actions/members";
import {
  getWorkspaceInvitesAction,
  cancelWorkspaceInviteAction,
} from "../actions/invites";
import { InviteDialog } from "./InviteDialog";
import { MemberCard } from "./MemberCard";
import type { WorkspaceMember, WorkspaceInvite, WorkspaceRole } from "@/shared/types/crm";

interface WorkspaceMembersManagerProps {
  workspaceId: string;
}

export function WorkspaceMembersManager({
  workspaceId,
}: WorkspaceMembersManagerProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<WorkspaceRole | null>(
    null,
  );
  const [isOwner, setIsOwner] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersData, invitesData, permissions] = await Promise.all([
        getWorkspaceMembersAction(workspaceId),
        getWorkspaceInvitesAction(workspaceId),
        canManageWorkspaceAction(workspaceId),
      ]);

      setMembers(membersData);
      setInvites(invitesData);
      setCanManage(permissions.canManage);
      setCurrentUserRole(permissions.role);
      setIsOwner(permissions.role === "owner");

      try {
        const { getCurrentUserIdAction } = await import("@/features/auth/actions/auth");
        const userId = await getCurrentUserIdAction();
        if (userId) {
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Erro ao carregar membros",
        description: "Não foi possível carregar a lista de membros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const result = await cancelWorkspaceInviteAction(inviteId);

      if (!result.success) {
        toast({
          title: "Erro ao cancelar convite",
          description: result.error || "Não foi possível cancelar o convite",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso",
      });

      loadData();
    } catch (error) {
      toast({
        title: "Erro ao cancelar convite",
        description: "Ocorreu um erro ao cancelar o convite",
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteLink = async (invite: WorkspaceInvite) => {
    if (!invite.token) {
      toast({
        title: "Erro",
        description: "Token do convite não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      const siteUrl = window.location.origin;
      const inviteLink = `${siteUrl}/invites/accept/${invite.token}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInviteId(invite.id);
      toast({
        title: "Link copiado!",
        description: "O link do convite foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Carregando membros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Membros</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os membros do seu workspace
            </p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum membro encontrado
          </div>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              workspaceId={workspaceId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canManage={canManage}
              isOwner={isOwner}
              onUpdate={loadData}
            />
          ))
        )}
      </div>

      {invites.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Convites Pendentes</h3>
            <p className="text-sm text-muted-foreground">
              Convites aguardando aceitação
            </p>
          </div>
          <div className="space-y-2">
            {invites
              .filter((invite) => invite.status === "pending")
              .map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Convite enviado por {invite.invitedBy.fullName} •{" "}
                        {invite.role === "admin" ? "Administrador" : "Membro"}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyInviteLink(invite)}
                        className="shrink-0"
                      >
                        {copiedInviteId === invite.id ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <InviteDialog
        workspaceId={workspaceId}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={loadData}
        isOwner={isOwner}
      />
    </div>
  );
}
