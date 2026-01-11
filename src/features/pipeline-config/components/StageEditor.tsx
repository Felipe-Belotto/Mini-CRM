"use client";

import { Loader2, Trash2 } from "lucide-react";
import type React from "react";
import { useState, useEffect } from "react";
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
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { PipelineStage, ColorPalette } from "@/shared/types/crm";
import { createStageAction, updateStageAction, deleteStageAction } from "../actions/stages";
import { getColorPalettesAction } from "../actions/color-palettes";

interface StageEditorProps {
  stage?: PipelineStage;
  workspaceId: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const StageEditor: React.FC<StageEditorProps> = ({
  stage,
  workspaceId,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [name, setName] = useState(stage?.name || "");
  const [color, setColor] = useState(stage?.color || "kanban-base");
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPalettes, setIsLoadingPalettes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar paletas de cores do banco
  useEffect(() => {
    async function loadPalettes() {
      try {
        setIsLoadingPalettes(true);
        const palettes = await getColorPalettesAction(workspaceId);
        setColorPalettes(palettes);
      } catch (err) {
        console.error("Error loading color palettes:", err);
      } finally {
        setIsLoadingPalettes(false);
      }
    }
    loadPalettes();
  }, [workspaceId]);

  const isEditing = !!stage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing) {
        await updateStageAction({
          id: stage.id,
          name: name.trim(),
          color,
        });
      } else {
        await createStageAction({
          workspaceId,
          name: name.trim(),
          color,
        });
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!stage) return;

    setIsDeleting(true);
    try {
      await deleteStageAction(stage.id);
      setShowDeleteDialog(false);
      if (onDelete) {
        onDelete();
      } else {
        onSave(); // Se não houver callback específico, apenas salva (fecha dialog)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Etapa</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Em Negociação"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Cor</Label>
        <Select 
          value={color} 
          onValueChange={setColor} 
          disabled={isLoading || isLoadingPalettes}
        >
          <SelectTrigger>
            <SelectValue>
              {isLoadingPalettes ? (
                <span className="text-muted-foreground">Carregando cores...</span>
              ) : (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selectedPalette = colorPalettes.find((p) => p.key === color);
                    return (
                      <>
                        <div
                          className={`w-4 h-4 rounded-full ${selectedPalette?.previewClass || "bg-gray-500"}`}
                        />
                        {selectedPalette?.name || color}
                      </>
                    );
                  })()}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {colorPalettes.map((palette) => (
              <SelectItem key={palette.id} value={palette.key}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${palette.previewClass}`} />
                  {palette.name}
                  {palette.isDefault && (
                    <span className="text-xs text-muted-foreground ml-1">(Padrão)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-between items-center pt-4">
        {isEditing && !stage.isSystem && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading || isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Etapa
          </Button>
        )}
        {(!isEditing || stage.isSystem) && <div />}
        
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isDeleting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || isDeleting}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar" : "Criar Etapa"}
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa &quot;{stage?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};
