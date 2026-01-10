"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
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
import { useWorkspaceForm } from "../hooks/use-workspace-form";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const {
    nome,
    setNome,
    logoPreview,
    isLoading,
    error,
    fileInputRef,
    handleFileChange,
    handleRemoveLogo,
    handleSubmit,
    reset,
  } = useWorkspaceForm({
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      reset();
      onOpenChange(newOpen);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Workspace</DialogTitle>
            <DialogDescription>
              Crie um novo workspace para organizar seus leads e campanhas
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Workspace *</Label>
              <Input
                id="nome"
                placeholder="Ex: Empresa ABC"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isLoading}
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logo">Logo do Workspace (opcional)</Label>
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-24 h-24 rounded-lg border-2 border-border overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Preview do logo"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isLoading}
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
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-3 pb-4">
                      <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                      <p className="mb-1 text-xs text-muted-foreground">
                        <span className="font-semibold">
                          Clique para fazer upload
                        </span>
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
                      onChange={handleFileInputChange}
                      disabled={isLoading}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
