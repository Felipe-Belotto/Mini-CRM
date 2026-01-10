"use client";

import { useState, startTransition } from "react";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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
import { Badge } from "@/shared/components/ui/badge";
import { MoreVertical, Crown, Shield, User, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import {
  updateMemberRoleAction,
  removeWorkspaceMemberAction,
  transferWorkspaceOwnershipAction,
} from "../actions/members";
import type { WorkspaceMember, WorkspaceRole } from "@/shared/types/crm";

interface MemberCardProps {
  member: WorkspaceMember;
  workspaceId: string;
  currentUserId: string;
  currentUserRole: WorkspaceRole | null;
  canManage: boolean;
  isOwner: boolean;
  onUpdate?: () => void;
  onRoleChangeOptimistic?: (userId: string, newRole: WorkspaceRole) => void;
  onRoleChangeRevert?: (userId: string, originalRole: WorkspaceRole) => void;
  onRemoveOptimistic?: (userId: string) => void;
  onTransferOwnershipOptimistic?: (userId: string) => void;
}

export function MemberCard({
  member,
  workspaceId,
  currentUserId,
  currentUserRole,
  canManage,
  isOwner,
  onUpdate,
  onRoleChangeOptimistic,
  onRoleChangeRevert,
  onRemoveOptimistic,
  onTransferOwnershipOptimistic,
}: MemberCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [newRole, setNewRole] = useState<WorkspaceRole | null>(null);

  const isCurrentUser = member.userId === currentUserId;
  const isMemberOwner = member.role === "owner";

  const roleConfig = {
    owner: { label: "Owner", icon: Crown, variant: "default" as const },
    admin: { label: "Admin", icon: Shield, variant: "secondary" as const },
    member: { label: "Membro", icon: User, variant: "outline" as const },
  };

  const roleInfo = roleConfig[member.role];
  const RoleIcon = roleInfo.icon;

  const handleRoleChange = async (role: WorkspaceRole) => {
    const originalRole = member.role;

    onRoleChangeOptimistic?.(member.userId, role);
    setIsUpdating(true);
    setShowRoleChangeDialog(false);

    try {
      const result = await updateMemberRoleAction(
        workspaceId,
        member.userId,
        role,
      );

      if (!result.success) {
        onRoleChangeRevert?.(member.userId, originalRole);
        toast({
          title: "Erro ao atualizar role",
          description: result.error || "Não foi possível atualizar a função",
          variant: "destructive",
        });
        setNewRole(null);
        return;
      }

      toast({
        title: "Função atualizada!",
        description: `${member.user.fullName} agora é ${roleConfig[role].label}`,
      });

      startTransition(() => {
        onUpdate?.();
      });
    } catch (error) {
      onRoleChangeRevert?.(member.userId, originalRole);
      toast({
        title: "Erro ao atualizar role",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao atualizar a função",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setNewRole(null);
    }
  };

  const handleRemove = async () => {
    const memberToRemove = member;

    onRemoveOptimistic?.(member.userId);
    setIsUpdating(true);
    setShowRemoveDialog(false);

    try {
      const result = await removeWorkspaceMemberAction(
        workspaceId,
        member.userId,
      );

      if (!result.success) {
        toast({
          title: "Erro ao remover membro",
          description: result.error || "Não foi possível remover o membro",
          variant: "destructive",
        });
        onUpdate?.();
        return;
      }

      toast({
        title: "Membro removido!",
        description: `${memberToRemove.user.fullName} foi removido do workspace`,
      });

      startTransition(() => {
        onUpdate?.();
      });
    } catch (error) {
      toast({
        title: "Erro ao remover membro",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao remover o membro",
        variant: "destructive",
      });
      onUpdate?.();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransferOwnership = async () => {
    onTransferOwnershipOptimistic?.(member.userId);
    setIsUpdating(true);
    setShowTransferDialog(false);

    try {
      const result = await transferWorkspaceOwnershipAction(
        workspaceId,
        member.userId,
      );

      if (!result.success) {
        toast({
          title: "Erro ao transferir ownership",
          description:
            result.error || "Não foi possível transferir a ownership",
          variant: "destructive",
        });
        onUpdate?.();
        return;
      }

      toast({
        title: "Ownership transferida!",
        description: `${member.user.fullName} agora é o owner do workspace`,
      });

      startTransition(() => {
        onUpdate?.();
      });
    } catch (error) {
      toast({
        title: "Erro ao transferir ownership",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao transferir a ownership",
        variant: "destructive",
      });
      onUpdate?.();
    } finally {
      setIsUpdating(false);
    }
  };

  const canChangeRole = canManage && !isMemberOwner && !isCurrentUser;
  const canRemove = canManage && !isMemberOwner && !isCurrentUser;
  const canTransfer = isOwner && !isMemberOwner && !isCurrentUser && member.role === "admin";
  
  const hasRoleChange = canChangeRole && (member.role === "member" || member.role === "admin");
  const hasTransfer = canTransfer;
  const hasRemove = canRemove;

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border">
            <Image
              src={member.user.avatarUrl || "/fallback-avatar.webp"}
              alt={member.user.fullName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {member.user.fullName || member.user.email}
              </p>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  Você
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {member.user.email}
            </p>
          </div>

          <Badge variant={roleInfo.variant} className="flex items-center gap-1">
            <RoleIcon className="w-3 h-3" />
            {roleInfo.label}
          </Badge>
        </div>

        {canManage && !isCurrentUser && (hasRoleChange || hasTransfer || hasRemove) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                disabled={isUpdating}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChangeRole && member.role === "member" && (
                <DropdownMenuItem
                  onClick={() => {
                    setNewRole("admin");
                    setShowRoleChangeDialog(true);
                  }}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Promover para Administrador
                </DropdownMenuItem>
              )}

              {canChangeRole && member.role === "admin" && (
                <DropdownMenuItem
                  onClick={() => {
                    setNewRole("member");
                    setShowRoleChangeDialog(true);
                  }}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Rebaixar para Membro
                </DropdownMenuItem>
              )}

              {hasTransfer && (
                <>
                  {hasRoleChange && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => setShowTransferDialog(true)}
                    className="text-amber-600 focus:text-amber-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Transferir Ownership
                  </DropdownMenuItem>
                </>
              )}

              {hasRemove && (
                <>
                  {(hasRoleChange || hasTransfer) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover do Workspace
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transferir Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja transferir a ownership do workspace para{" "}
              <strong>{member.user.fullName}</strong>? Você se tornará um
              administrador após a transferência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransferOwnership}
              disabled={isUpdating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isUpdating ? "Transferindo..." : "Transferir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{member.user.fullName}</strong>{" "}
              do workspace? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isUpdating}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {newRole && (
        <AlertDialog
          open={showRoleChangeDialog}
          onOpenChange={setShowRoleChangeDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Função</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja alterar a função de{" "}
                <strong>{member.user.fullName}</strong> para{" "}
                <strong>{roleConfig[newRole].label}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isUpdating}
                onClick={() => {
                  setShowRoleChangeDialog(false);
                  setNewRole(null);
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRoleChange(newRole)}
                disabled={isUpdating}
              >
                {isUpdating ? "Alterando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
