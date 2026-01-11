"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { CustomField } from "@/shared/types/crm";
import { reorderCustomFieldsAction } from "../actions/custom-fields";

interface UseReorderCustomFieldsProps {
  initialFields: CustomField[];
  workspaceId: string;
}

interface UseReorderCustomFieldsReturn {
  fields: CustomField[];
  setFields: React.Dispatch<React.SetStateAction<CustomField[]>>;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  isPending: boolean;
}

export function useReorderCustomFields({
  initialFields,
  workspaceId,
}: UseReorderCustomFieldsProps): UseReorderCustomFieldsReturn {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState<CustomField[]>(initialFields);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const previousFields = fields;
      const newFields = arrayMove(fields, oldIndex, newIndex);
      setFields(newFields);

      startTransition(async () => {
        const orderedIds = newFields.map((f) => f.id);
        const result = await reorderCustomFieldsAction(workspaceId, orderedIds);

        if (!result.success) {
          setFields(previousFields);
          toast({
            title: "Erro ao reordenar",
            description: result.error || "Não foi possível salvar a nova ordem",
            variant: "destructive",
          });
        }
      });
    },
    [fields, workspaceId, toast],
  );

  return {
    fields,
    setFields,
    handleDragEnd,
    isPending,
  };
}
