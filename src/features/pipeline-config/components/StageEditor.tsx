"use client";

import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
import type { PipelineStage } from "@/shared/types/crm";
import { createStageAction, updateStageAction } from "../actions/stages";

interface StageEditorProps {
  stage?: PipelineStage;
  workspaceId: string;
  onSave: () => void;
  onCancel: () => void;
}

const colorOptions = [
  { value: "kanban-base", label: "Cinza", preview: "bg-gray-500" },
  { value: "kanban-mapped", label: "Azul", preview: "bg-blue-500" },
  { value: "kanban-contacting", label: "Amarelo", preview: "bg-yellow-500" },
  { value: "kanban-connection", label: "Roxo", preview: "bg-purple-500" },
  { value: "kanban-disqualified", label: "Vermelho", preview: "bg-red-500" },
  { value: "kanban-qualified", label: "Verde", preview: "bg-green-500" },
  { value: "kanban-meeting", label: "Laranja", preview: "bg-orange-500" },
  { value: "custom-pink", label: "Rosa", preview: "bg-pink-500" },
  { value: "custom-indigo", label: "Índigo", preview: "bg-indigo-500" },
  { value: "custom-teal", label: "Teal", preview: "bg-teal-500" },
];

export const StageEditor: React.FC<StageEditorProps> = ({
  stage,
  workspaceId,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(stage?.name || "");
  const [color, setColor] = useState(stage?.color || "kanban-base");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Select value={color} onValueChange={setColor} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full ${colorOptions.find((c) => c.value === color)?.preview}`}
                />
                {colorOptions.find((c) => c.value === color)?.label}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${opt.preview}`} />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar" : "Criar Etapa"}
        </Button>
      </div>
    </form>
  );
};
