"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type { WorkspaceMember, WorkspaceInvite, WorkspaceRole } from "@/shared/types/crm";
import {
  getWorkspaceMembersAction,
  canManageWorkspaceAction,
} from "../actions/members";
import {
  getWorkspaceInvitesAction,
  cancelWorkspaceInviteAction,
} from "../actions/invites";

interface UseWorkspaceMembersProps {
  workspaceId: string;
}

interface UseWorkspaceMembersReturn {
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  isLoading: boolean;
  canManage: boolean;
  currentUserId: string;
  currentUserRole: WorkspaceRole | null;
  isOwner: boolean;
  copiedInviteId: string | null;
  loadData: () => Promise<void>;
  handleCancelInvite: (inviteId: string) => Promise<void>;
  handleCopyInviteLink: (invite: WorkspaceInvite) => Promise<void>;
  setCopiedInviteId: (id: string | null) => void;
}

export function useWorkspaceMembers({
  workspaceId,
}: UseWorkspaceMembersProps): UseWorkspaceMembersReturn {
  const { toast } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<WorkspaceRole | null>(
    null,
  );
  const [isOwner, setIsOwner] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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
  }, [workspaceId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancelInvite = useCallback(
    async (inviteId: string) => {
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
    },
    [loadData, toast],
  );

  const handleCopyInviteLink = useCallback(
    async (invite: WorkspaceInvite) => {
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
    },
    [toast],
  );

  return {
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
  };
}
