"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { createWorkspaceInviteAction } from "../actions/invites";
import { addWorkspaceMemberAction } from "../actions/members";
import type { WorkspaceRole } from "@/shared/types/crm";

interface InviteDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isOwner: boolean;
}

export function InviteDialog({
  workspaceId,
  open,
  onOpenChange,
  onSuccess,
  isOwner,
}: InviteDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email é obrigatório");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email inválido");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addWorkspaceMemberAction(
        workspaceId,
        email.trim(),
        role,
      );

      if (result.success) {
        toast({
          title: "Membro adicionado!",
          description: `${email} foi adicionado ao workspace`,
        });
        setEmail("");
        setRole("member");
        setInviteLink(null);
        onSuccess?.();
        onOpenChange(false);
        return;
      }

      const inviteResult = await createWorkspaceInviteAction(
        workspaceId,
        email.trim(),
        role,
      );

      if (!inviteResult.success) {
        setError(inviteResult.error || "Não foi possível enviar o convite");
        return;
      }

      if (inviteResult.token) {
        const siteUrl = window.location.origin;
        const link = `${siteUrl}/invites/accept/${inviteResult.token}`;
        setInviteLink(link);
      }

      onSuccess?.();
      
      toast({
        title: "Convite criado!",
        description: `Um convite foi enviado para ${email}. Você também pode copiar o link abaixo.`,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao enviar o convite",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;

    try {
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

  const handleClose = () => {
    setEmail("");
    setRole("member");
    setError("");
    setInviteLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {inviteLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Convite Criado!</DialogTitle>
              <DialogDescription>
                O convite foi enviado para {email}. Você também pode compartilhar
                o link abaixo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-link">Link do Convite</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-link"
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique no botão ao lado para copiar o link
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Adicionar Membro</DialogTitle>
              <DialogDescription>
                Convide um usuário para o workspace por email. Se o usuário já
                tiver conta, ele será adicionado automaticamente. Caso contrário,
                será enviado um convite.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  disabled={isSubmitting}
                  className={error ? "border-destructive" : ""}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função *</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as WorkspaceRole)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {isOwner && (
                      <SelectItem value="owner" disabled>
                        Proprietário (use transferir propriedade)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Membros têm acesso apenas ao dashboard. Administradores podem
                  gerenciar membros e configurações do workspace.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !email.trim()}>
                {isSubmitting ? "Enviando..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
