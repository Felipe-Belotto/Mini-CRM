"use client";

import type { CustomField, Lead } from "@/shared/types/crm";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface CustomFieldInputProps {
  field: CustomField;
  value: string | undefined;
  onChange: (value: string) => void;
  lead?: Lead;
}

export function CustomFieldInput({
  field,
  value,
  onChange,
}: CustomFieldInputProps) {
  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            rows={3}
          />
        );

      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opcao) => (
                <SelectItem key={opcao} value={opcao}>
                  {opcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );

      case "phone":
        return (
          <Input
            type="tel"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "text":
      default:
        return (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
    </div>
  );
}
