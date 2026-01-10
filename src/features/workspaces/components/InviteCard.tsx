"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { MoreVertical, Mail, Copy, Check, Shield, User } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { cancelWorkspaceInviteAction } from "../actions/invites";
import type { WorkspaceInvite, WorkspaceRole } from "@/shared/types/crm";

interface InviteCardProps {
  invite: WorkspaceInvite;
  canManage: boolean;
  onUpdate?: () => void;
}

export function InviteCard({
  invite,
  canManage,
  onUpdate,
}: InviteCardProps) {
  const { toast } = useToast();
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const roleConfig: Record<WorkspaceRole, { label: string; icon: typeof Shield; variant: "secondary" | "outline" | "default" }> = {
    admin: { label: "Admin", icon: Shield, variant: "secondary" as const },
    member: { label: "Membro", icon: User, variant: "outline" as const },
    owner: { label: "Owner", icon: Shield, variant: "default" as const },
  };

  const roleInfo = roleConfig[invite.role];
  const RoleIcon = roleInfo.icon;

  const handleCancelInvite = async () => {
    setIsCanceling(true);
    try {
      const result = await cancelWorkspaceInviteAction(invite.id);

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

      onUpdate?.();
    } catch (error) {
      toast({
        title: "Erro ao cancelar convite",
        description: "Ocorreu um erro ao cancelar o convite",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
      setShowCancelDialog(false);
    }
  };

  const handleCopyInviteLink = async () => {
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
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do convite foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border bg-muted flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{invite.email}</p>
              <Badge variant="outline" className="text-xs">
                Pendente
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              Convite enviado por {invite.invitedBy.fullName}
            </p>
          </div>

          <Badge variant={roleInfo.variant} className="flex items-center gap-1">
            <RoleIcon className="w-3 h-3" />
            {roleInfo.label}
          </Badge>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                disabled={isCanceling}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyInviteLink}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Link copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar link do convite
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                Cancelar convite
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o convite para{" "}
              <strong>{invite.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvite}
              disabled={isCanceling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCanceling ? "Cancelando..." : "Cancelar Convite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
