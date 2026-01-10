"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";
import { createWorkspaceAction } from "../actions/workspaces";
import { uploadWorkspaceLogoAction } from "../actions/upload-logo";
import {
  validateImageFile,
  createImagePreview,
} from "../lib/workspace-utils";

interface UseWorkspaceFormOptions {
  onSuccess?: () => void;
}

export function useWorkspaceForm({ onSuccess }: UseWorkspaceFormOptions = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Arquivo inválido",
        description: validation.error || "Erro ao validar arquivo",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    try {
      const preview = await createImagePreview(file);
      setLogoPreview(preview);
    } catch (err) {
      toast({
        title: "Erro ao processar imagem",
        description: "Não foi possível criar preview da imagem",
        variant: "destructive",
      });
      setLogoFile(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!nome.trim()) {
      setError("Nome do workspace é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      // Criar workspace primeiro
      const result = await createWorkspaceAction({ name: nome.trim() });

      if (!result.success || !result.workspace) {
        setError(result.error || "Não foi possível criar o workspace");
        toast({
          title: "Erro ao criar workspace",
          description: result.error || "Não foi possível criar o workspace",
          variant: "destructive",
        });
        return;
      }

      // Se houver logo, fazer upload
      if (logoFile && result.workspace) {
        const uploadResult = await uploadWorkspaceLogoAction(
          result.workspace.id,
          logoFile,
        );

        if (!uploadResult.success) {
          toast({
            title: "Workspace criado, mas erro no logo",
            description:
              uploadResult.error || "Não foi possível fazer upload do logo",
            variant: "destructive",
          });
        }
      }

      // Limpar formulário
      setNome("");
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Workspace criado!",
        description: `Workspace "${result.workspace.name}" foi criado com sucesso.`,
      });

      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao criar o workspace",
      );
      toast({
        title: "Erro ao criar workspace",
        description: "Ocorreu um erro ao criar o workspace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setNome("");
    setLogoFile(null);
    setLogoPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    nome,
    setNome,
    logoFile,
    logoPreview,
    isLoading,
    error,
    fileInputRef,
    handleFileChange,
    handleRemoveLogo,
    handleSubmit,
    reset,
  };
}
