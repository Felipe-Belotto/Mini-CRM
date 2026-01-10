"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { acceptInviteAction, rejectInviteAction } from "@/features/workspaces/actions/invites";
import { Crown, Shield, User, Check, Building2, Mail, X } from "lucide-react";
import type { WorkspaceInvite } from "@/shared/types/crm";

interface PendingInvitesPageClientProps {
  invites: WorkspaceInvite[];
}

export function PendingInvitesPageClient({
  invites,
}: PendingInvitesPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);
  const [rejectingToken, setRejectingToken] = useState<string | null>(null);

  const roleConfig = {
    owner: { label: "Owner", icon: Crown, variant: "default" as const },
    admin: { label: "Administrador", icon: Shield, variant: "secondary" as const },
    member: { label: "Membro", icon: User, variant: "outline" as const },
  };

  const handleAccept = async (token: string) => {
    setAcceptingToken(token);
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
        description: "Você foi adicionado ao workspace",
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
      setAcceptingToken(null);
    }
  };

  const handleReject = async (token: string) => {
    setRejectingToken(token);
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
      setRejectingToken(null);
    }
  };

  if (invites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Nenhum convite pendente</CardTitle>
            <CardDescription>
              Você não tem convites aguardando sua resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Você tem {invites.length}{" "}
            {invites.length === 1 ? "convite pendente" : "convites pendentes"}
          </p>
        </div>

        <div className="space-y-4">
          {invites.map((invite) => {
            const roleInfo = roleConfig[invite.role];
            const RoleIcon = roleInfo.icon;

            return (
              <Card key={invite.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-border flex-shrink-0">
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">Workspace</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-2 mt-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">
                              Convite enviado por {invite.invitedBy.fullName}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                    </div>

                    <Badge variant={roleInfo.variant} className="flex items-center gap-1">
                      <RoleIcon className="w-3 h-3" />
                      {roleInfo.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Você foi convidado para se juntar a um workspace como{" "}
                        <strong>
                          {invite.role === "admin"
                            ? "Administrador"
                            : invite.role === "member"
                              ? "Membro"
                              : "Owner"}
                        </strong>
                        .
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(invite.token)}
                        disabled={acceptingToken === invite.token || rejectingToken === invite.token}
                        className="flex-1"
                      >
                        {acceptingToken === invite.token ? (
                          "Aceitando..."
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Aceitar
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReject(invite.token)}
                        disabled={acceptingToken === invite.token || rejectingToken === invite.token}
                        variant="outline"
                      >
                        {rejectingToken === invite.token ? (
                          "Recusando..."
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Recusar
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Expira em{" "}
                      {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => router.push("/")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
