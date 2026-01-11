"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
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
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { PipelineStage } from "@/shared/types/crm";
import {
  deleteStageAction,
  reorderStagesAction,
  updateStageAction,
} from "../actions/stages";
import { StageEditor } from "./StageEditor";

interface StagesListProps {
  stages: PipelineStage[];
  workspaceId: string;
  onStagesChange: () => void;
}

export const StagesList: React.FC<StagesListProps> = ({
  stages,
  workspaceId,
  onStagesChange,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [deletingStage, setDeletingStage] = useState<PipelineStage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localStages, setLocalStages] = useState(stages);

  // Atualiza estado local quando stages mudam
  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = localStages.findIndex((s) => s.id === active.id);
    const newIndex = localStages.findIndex((s) => s.id === over.id);

    const reorderedStages = arrayMove(localStages, oldIndex, newIndex);
    setLocalStages(reorderedStages);

    // Preparar updates
    const updates = reorderedStages.map((stage, index) => ({
      id: stage.id,
      sortOrder: index + 1,
    }));

    try {
      await reorderStagesAction(updates);
      onStagesChange();
    } catch (error) {
      // Reverter em caso de erro
      setLocalStages(stages);
      console.error("Error reordering stages:", error);
    }
  };

  const handleToggleVisibility = async (stage: PipelineStage) => {
    try {
      await updateStageAction({
        id: stage.id,
        isHidden: !stage.isHidden,
      });
      onStagesChange();
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingStage) return;

    setIsDeleting(true);
    try {
      await deleteStageAction(deletingStage.id);
      onStagesChange();
      setDeletingStage(null);
    } catch (error) {
      console.error("Error deleting stage:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Etapas do Pipeline</CardTitle>
            <CardDescription>
              Configure as etapas do seu funil de vendas
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Etapa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localStages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localStages.map((stage) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  onEdit={() => setEditingStage(stage)}
                  onDelete={() => setDeletingStage(stage)}
                  onToggleVisibility={() => handleToggleVisibility(stage)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {localStages.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma etapa configurada.
          </p>
        )}
      </CardContent>

      {/* Dialog para adicionar etapa */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Etapa</DialogTitle>
          </DialogHeader>
          <StageEditor
            workspaceId={workspaceId}
            onSave={() => {
              setIsAddDialogOpen(false);
              onStagesChange();
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar etapa */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
          </DialogHeader>
          {editingStage && (
            <StageEditor
              stage={editingStage}
              workspaceId={workspaceId}
              onSave={() => {
                setEditingStage(null);
                onStagesChange();
              }}
              onCancel={() => setEditingStage(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingStage} onOpenChange={() => setDeletingStage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa &quot;{deletingStage?.name}&quot;?
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
    </Card>
  );
};

interface SortableStageItemProps {
  stage: PipelineStage;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

const SortableStageItem: React.FC<SortableStageItemProps> = ({
  stage,
  onEdit,
  onDelete,
  onToggleVisibility,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colorClasses: Record<string, string> = {
    "kanban-base": "bg-gray-500",
    "kanban-mapped": "bg-blue-500",
    "kanban-contacting": "bg-yellow-500",
    "kanban-connection": "bg-purple-500",
    "kanban-disqualified": "bg-red-500",
    "kanban-qualified": "bg-green-500",
    "kanban-meeting": "bg-orange-500",
    "custom-pink": "bg-pink-500",
    "custom-indigo": "bg-indigo-500",
    "custom-teal": "bg-teal-500",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-background ${
        stage.isHidden ? "opacity-50" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div
        className={`w-4 h-4 rounded-full ${colorClasses[stage.color] || "bg-gray-400"}`}
      />

      <div className="flex-1">
        <span className={stage.isHidden ? "line-through" : ""}>
          {stage.name}
        </span>
      </div>

      {stage.isSystem && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Sistema
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Etapa padrão do sistema (não pode ser excluída)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleVisibility}
                className="h-8 w-8"
              >
                {stage.isHidden ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {stage.isHidden ? "Mostrar etapa" : "Ocultar etapa"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar etapa</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!stage.isSystem && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir etapa</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
