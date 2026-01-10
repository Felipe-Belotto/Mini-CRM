"use client";

import { Pencil, Trash2 } from "lucide-react";
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

interface CustomFieldCardProps {
  field: CustomField;
  onEdit: (field: CustomField) => void;
  onDelete: (field: CustomField) => void;
}

export function CustomFieldCard({
  field,
  onEdit,
  onDelete,
}: CustomFieldCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{field.name}</CardTitle>
            <CardDescription>
              {getCustomFieldTypeLabel(field.type)}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1">
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
        <CardContent>
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
