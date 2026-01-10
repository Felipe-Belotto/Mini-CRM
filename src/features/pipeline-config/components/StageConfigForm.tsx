"use client";

import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import type { KanbanStage, StageConfig } from "@/shared/types/crm";
import { KANBAN_COLUMNS } from "@/shared/types/crm";

interface StageConfigFormProps {
  stage: KanbanStage;
  config: StageConfig | null;
  availableFields: Array<{ id: string; nome: string }>;
  onChange: (requiredFields: string[]) => void;
}

export function StageConfigForm({
  stage,
  config,
  availableFields,
  onChange,
}: StageConfigFormProps) {
  const stageColumn = KANBAN_COLUMNS.find((c) => c.id === stage);
  const requiredFields = config?.requiredFields || [];

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      onChange([...requiredFields, fieldId]);
    } else {
      onChange(requiredFields.filter((id) => id !== fieldId));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">{stageColumn?.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione os campos obrigatórios para que um lead possa entrar nesta
          etapa
        </p>
      </div>

      <div className="space-y-2">
        {availableFields.map((field) => (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${stage}-${field.id}`}
              checked={requiredFields.includes(field.id)}
              onCheckedChange={(checked) =>
                handleFieldToggle(field.id, checked === true)
              }
            />
            <Label
              htmlFor={`${stage}-${field.id}`}
              className="cursor-pointer font-normal"
            >
              {field.nome}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
