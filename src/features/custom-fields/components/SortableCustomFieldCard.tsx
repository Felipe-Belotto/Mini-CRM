"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { CustomField } from "@/shared/types/crm";
import { getCustomFieldTypeLabel } from "../lib/custom-field-utils";

interface SortableCustomFieldCardProps {
  field: CustomField;
  onEdit: (field: CustomField) => void;
  onDelete: (field: CustomField) => void;
}

export function SortableCustomFieldCard({
  field,
  onEdit,
  onDelete,
}: SortableCustomFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-50 shadow-lg ring-2 ring-accent" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded mt-0.5 touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{field.name}</CardTitle>
              <CardDescription>
                {getCustomFieldTypeLabel(field.type)}
                {field.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(field)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(field)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {field.options && field.options.length > 0 && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-2">Opções:</p>
          <div className="flex flex-wrap gap-1">
            {field.options.map((option) => (
              <span
                key={option}
                className="px-2 py-1 bg-muted rounded text-xs"
              >
                {option}
              </span>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
