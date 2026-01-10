"use client";

import { Edit, Save, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import type { Workspace } from "@/shared/types/crm";

interface EditWorkspaceFormProps {
  workspace: Workspace;
  canEdit?: boolean;
}

export function EditWorkspaceForm({
  workspace,
  canEdit = true,
}: EditWorkspaceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(workspace.name);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    workspace.logoUrl || null,
  );
  const [originalNome, setOriginalNome] = useState(workspace.name);
  const [originalLogoPreview, setOriginalLogoPreview] = useState<string | null>(
    workspace.logoUrl || null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // Verificar se houve mudanças
  const hasChanges =
    nome.trim() !== originalNome.trim() ||
    logoFile !== null ||
    logoPreview !== originalLogoPreview;

  // Resetar quando sair do modo de edição sem salvar
  const handleCancelEdit = () => {
    setNome(originalNome);
    setLogoFile(null);
    setLogoPreview(originalLogoPreview);
    setIsEditing(false);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Use JPG, PNG ou WEBP",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (máximo 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "Tamanho máximo: 2MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nome.trim()) {
      setError("Nome do workspace é obrigatório");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateWorkspaceAction(workspace.id, {
        name: nome.trim(),
        logo: logoFile || undefined,
      });

      if (!result.success) {
        setError(result.error || "Não foi possível atualizar o workspace");
        return;
      }

      toast({
        title: "Workspace atualizado!",
        description: "Suas alterações foram salvas",
      });

      // Atualizar valores originais
      setOriginalNome(nome.trim());
      setOriginalLogoPreview(logoPreview);
      setLogoFile(null);
      setIsEditing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao atualizar o workspace",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Informações do Workspace</h2>
        </div>
        {canEdit && !isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="logo">Logo do Workspace (opcional)</Label>
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-lg border-2 border-border overflow-hidden flex-shrink-0">
                <Image
                  src={logoPreview}
                  alt="Logo do workspace"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Remover
                </Button>
              )}
            </div>
          ) : isEditing ? (
            <div className="flex flex-col items-center justify-center w-full">
              <label
                htmlFor="logo"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">
                      Clique para fazer upload
                    </span>{" "}
                    ou arraste aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP (máx. 2MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id="logo"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isUpdating}
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border-2 border-border bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Sem logo</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Workspace *</Label>
          {isEditing ? (
            <>
              <Input
                id="nome"
                placeholder="Ex: Minha Empresa"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isUpdating}
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          ) : (
            <div className="px-3 py-2 min-h-[40px] border border-transparent rounded-md text-sm">
              {nome || (
                <span className="text-muted-foreground">Não informado</span>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 pt-4">
            <Button
              type="submit"
              disabled={isUpdating || !nome.trim() || !hasChanges}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isUpdating ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
          </div>
        )}

        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para editar as informações do workspace
          </p>
        )}
      </form>
    </div>
  );
}
