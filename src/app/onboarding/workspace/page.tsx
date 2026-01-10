"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { Building2, Upload, X } from "lucide-react";
import { uploadWorkspaceLogoAction } from "@/features/workspaces/actions/upload-logo";
import { createWorkspaceAction } from "@/features/workspaces/actions/workspaces";

const INVITE_TOKEN_KEY = "pending_invite_token";

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Use JPG, PNG ou WEBP",
          variant: "destructive",
        });
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "Tamanho máximo: 2MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
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

    setIsCreating(true);
    try {
      const result = await createWorkspaceAction({ name: nome.trim() });

      if (!result.success || !result.workspace) {
        setError(result.error || "Não foi possível criar o workspace");
        return;
      }

      if (logoFile && result.workspace) {
        const uploadResult = await uploadWorkspaceLogoAction(
          result.workspace.id,
          logoFile,
        );

        if (!uploadResult.success) {
          toast({
            title: "Workspace criado, mas erro no logo",
            description: uploadResult.error || "Não foi possível fazer upload do logo",
            variant: "destructive",
          });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao criar o workspace",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Criar seu Workspace</CardTitle>
            <CardDescription className="mt-2">
              Para começar a usar o MiniCRM, você precisa criar um workspace.
              Um workspace é onde você organizará seus leads e campanhas.
              <br />
              <span className="text-xs text-muted-foreground">
                Você pode criar apenas um workspace durante o onboarding.
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Workspace *</Label>
              <Input
                id="nome"
                placeholder="Ex: Minha Empresa"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isCreating}
                className={error ? "border-destructive" : ""}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo do Workspace (opcional)</Label>
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-32 h-32 rounded-lg border-2 border-border overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Preview do logo"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isCreating}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full">
                  <label
                    htmlFor="logo"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para fazer upload</span> ou arraste aqui
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
                      disabled={isCreating}
                    />
                  </label>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isCreating || !nome.trim()}
            >
              {isCreating ? "Criando..." : "Criar Workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
