"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { acceptInviteAction, rejectInviteAction } from "@/features/workspaces/actions/invites";
import { Crown, Shield, User, Check, Building2, X } from "lucide-react";
import type { WorkspaceInvite } from "@/shared/types/crm";

interface InviteAcceptPageClientProps {
  invite: WorkspaceInvite & { workspace?: { id: string; name: string; logoUrl?: string; memberCount: number } };
  token: string;
}

export function InviteAcceptPageClient({ invite, token }: InviteAcceptPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const workspace = invite.workspace;
  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Workspace não encontrado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const roleConfig = {
    owner: { label: "Owner", icon: Crown, variant: "default" as const },
    admin: { label: "Administrador", icon: Shield, variant: "secondary" as const },
    member: { label: "Membro", icon: User, variant: "outline" as const },
  };

  const roleInfo = roleConfig[invite.role];
  const RoleIcon = roleInfo.icon;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptInviteAction(token);

      if (!result.success) {
        toast({
          title: "Erro ao aceitar convite",
          description: result.error || "Não foi possível aceitar o convite",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Convite aceito!",
        description: `Você foi adicionado ao workspace ${workspace.name}`,
      });

      sessionStorage.removeItem("pending_invite_token");

      await new Promise((resolve) => setTimeout(resolve, 200));

      router.push("/");
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao aceitar convite",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao aceitar o convite",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const result = await rejectInviteAction(token);

      if (!result.success) {
        toast({
          title: "Erro ao recusar convite",
          description: result.error || "Não foi possível recusar o convite",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Convite recusado",
        description: "O convite foi recusado com sucesso",
      });

      sessionStorage.removeItem("pending_invite_token");

      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/onboarding/workspace");
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro ao recusar convite",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao recusar o convite",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          {workspace.logoUrl ? (
            <div className="flex justify-center">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-border">
                <Image
                  src={workspace.logoUrl}
                  alt={workspace.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-border">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            </div>
          )}

          <div>
            <CardTitle className="text-2xl">{workspace.name}</CardTitle>
            <CardDescription>
              Convite para se juntar ao workspace
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border flex-shrink-0">
                <Image
                  src={invite.invitedBy.avatarUrl || "/fallback-avatar.webp"}
                  alt={invite.invitedBy.fullName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {invite.invitedBy.fullName || invite.invitedBy.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  convidou você para este workspace
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <RoleIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Função</span>
                </div>
                <Badge variant={roleInfo.variant} className="flex items-center gap-1">
                  <RoleIcon className="w-3 h-3" />
                  {roleInfo.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">Membros</span>
                <span className="text-sm text-muted-foreground">
                  {workspace.memberCount} {workspace.memberCount === 1 ? "membro" : "membros"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="w-full"
              size="lg"
            >
              {isAccepting ? (
                <>
                  <span className="mr-2">Aceitando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Aceitar Convite
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isAccepting || isRejecting}
              variant="outline"
              className="w-full"
            >
              {isRejecting ? (
                "Recusando..."
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Recusar Convite
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
