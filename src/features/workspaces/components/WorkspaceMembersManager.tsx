"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Plus, Mail, Copy, Check } from "lucide-react";
import { useWorkspaceMembers } from "../hooks/use-workspace-members";
import { InviteDialog } from "./InviteDialog";
import { MemberCard } from "./MemberCard";

interface WorkspaceMembersManagerProps {
  workspaceId: string;
}

export function WorkspaceMembersManager({
  workspaceId,
}: WorkspaceMembersManagerProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const {
    members,
    invites,
    isLoading,
    canManage,
    currentUserId,
    currentUserRole,
    isOwner,
    copiedInviteId,
    loadData,
    handleCancelInvite,
    handleCopyInviteLink,
    setCopiedInviteId,
  } = useWorkspaceMembers({ workspaceId });

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
