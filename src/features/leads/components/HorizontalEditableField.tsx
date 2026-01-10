"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

interface HorizontalEditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "email" | "tel" | "textarea";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function HorizontalEditableField({
  label,
  value,
  onSave,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
}: HorizontalEditableFieldProps) {
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
      <div className="flex items-start gap-3 py-2">
        <Label className="text-sm font-medium text-muted-foreground min-w-[140px] pt-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {type === "textarea" ? (
              <Textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isSaving}
                className={cn("flex-1", error && "border-destructive")}
                rows={2}
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
                className={cn("flex-1", error && "border-destructive")}
              />
            )}
            <Button
              type="button"
              size="icon"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 w-9 flex-shrink-0"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 group">
      <Label className="text-sm font-medium text-muted-foreground min-w-[140px]">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex-1 flex items-center gap-2">
        <span
          className={cn(
            "text-sm flex-1 cursor-pointer hover:text-foreground transition-colors",
            !value && "text-muted-foreground",
          )}
          onClick={handleEdit}
        >
          {value || placeholder || "—"}
        </span>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}