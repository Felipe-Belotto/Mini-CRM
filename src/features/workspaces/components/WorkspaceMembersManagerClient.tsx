"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import {
  getWorkspaceMembersAction,
} from "@/features/workspaces/actions/members";
import { getWorkspaceInvitesAction } from "@/features/workspaces/actions/invites";
import { InviteDialog } from "@/features/workspaces/components/InviteDialog";
import { MemberCard } from "@/features/workspaces/components/MemberCard";
import { InviteCard } from "@/features/workspaces/components/InviteCard";
import type { WorkspaceMember, WorkspaceInvite, WorkspaceRole } from "@/shared/types/crm";

interface WorkspaceMembersManagerClientProps {
  workspaceId: string;
  initialMembers: WorkspaceMember[];
  initialInvites: WorkspaceInvite[];
  canManage: boolean;
  currentUserRole: WorkspaceRole | null;
  isOwner: boolean;
  currentUserId: string;
}

export function WorkspaceMembersManagerClient({
  workspaceId,
  initialMembers,
  initialInvites,
  canManage: initialCanManage,
  currentUserRole,
  isOwner,
  currentUserId,
}: WorkspaceMembersManagerClientProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [invites, setInvites] = useState<WorkspaceInvite[]>(initialInvites);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateMemberRoleOptimistic = (userId: string, newRole: WorkspaceRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );
  };

  const removeMemberOptimistic = (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const transferOwnershipOptimistic = (userId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.userId === userId) {
          return { ...m, role: "owner" as const };
        }
        if (m.userId === currentUserId) {
          return { ...m, role: "admin" as const };
        }
        return m;
      })
    );
  };

  const revertMemberRoleOptimistic = (userId: string, originalRole: WorkspaceRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: originalRole } : m))
    );
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        getWorkspaceMembersAction(workspaceId),
        getWorkspaceInvitesAction(workspaceId),
      ]);

      setMembers(membersData);
      setInvites(invitesData);
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Erro ao carregar membros",
        description: "Não foi possível atualizar a lista de membros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {initialCanManage && (
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
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando membros...
          </div>
        ) : members.length === 0 && invites.filter((invite) => invite.status === "pending").length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum membro encontrado
          </div>
        ) : (
          <>
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                workspaceId={workspaceId}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                canManage={initialCanManage}
                isOwner={isOwner}
                onUpdate={loadData}
                onRoleChangeOptimistic={updateMemberRoleOptimistic}
                onRoleChangeRevert={revertMemberRoleOptimistic}
                onRemoveOptimistic={removeMemberOptimistic}
                onTransferOwnershipOptimistic={transferOwnershipOptimistic}
              />
            ))}

            {invites
              .filter((invite) => invite.status === "pending")
              .map((invite) => (
                <InviteCard
                  key={invite.id}
                  invite={invite}
                  canManage={initialCanManage}
                  onUpdate={loadData}
                />
              ))}
          </>
        )}
      </div>

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
