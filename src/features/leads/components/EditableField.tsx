"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "email" | "tel" | "textarea";
  icon?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function EditableField({
  label,
  value,
  onSave,
  type = "text",
  icon,
  placeholder,
  required = false,
  disabled = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === "text" || type === "email" || type === "tel") {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, type]);

  const handleEdit = () => {
    if (disabled) return;
    setTempValue(value);
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempValue(value);
    setError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (tempValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    if (required && !tempValue.trim()) {
      setError(`${label} é obrigatório`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(tempValue.trim());
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar o campo",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && type !== "textarea" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-muted-foreground flex-shrink-0">{icon}</div>
          )}
          <Label className="flex-1 text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
        {type === "textarea" ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={error ? "border-destructive" : ""}
            rows={3}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={error ? "border-destructive" : ""}
          />
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8"
          >
            <Check className="w-4 h-4 mr-1" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="text-muted-foreground flex-shrink-0">{icon}</div>
        )}
        <Label className="flex-1 text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-h-[40px] px-3 py-2 border border-transparent rounded-md bg-muted/50">
          <span className={cn("text-sm flex-1", !value && "text-muted-foreground")}>
            {value || placeholder || "—"}
          </span>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
