"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useToast } from "@/shared/hooks/use-toast";
import type { CustomField, CustomFieldType } from "@/shared/types/crm";
import {
  createCustomFieldAction,
  updateCustomFieldAction,
  type CreateCustomFieldInput,
  type UpdateCustomFieldInput,
} from "../actions/custom-fields";
import { SelectOptionsManager } from "./SelectOptionsManager";

interface CustomFieldFormProps {
  field?: CustomField;
  workspaceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomFieldForm({
  field,
  workspaceId,
  onSuccess,
  onCancel,
}: CustomFieldFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(field?.name || "");
  const [type, setType] = useState<CustomFieldType>(field?.type || "text");
  const [required, setRequired] = useState(field?.required || false);
  const [options, setOptions] = useState<string[]>(field?.options || []);
  const [newOption, setNewOption] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (field) {
      setName(field.name);
      setType(field.type);
      setRequired(field.required);
      setOptions(field.options || []);
    }
  }, [field]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nome do campo é obrigatório";
    }

    if (type === "select" && options.length === 0) {
      newErrors.options = "Campos do tipo 'select' devem ter pelo menos uma opção";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setOptions(options.filter((o) => o !== option));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    startTransition(async () => {
      try {
        if (field) {
          const input: UpdateCustomFieldInput = {
            id: field.id,
            name: name.trim(),
            type,
            required,
            options: type === "select" ? options : undefined,
          };

          const result = await updateCustomFieldAction(input);

          if (result.success && result.field) {
            toast({
              title: "Campo atualizado!",
              description: "Campo foi atualizado com sucesso.",
            });
            router.refresh();
            onSuccess();
          } else {
            toast({
              title: "Erro ao atualizar campo",
              description: result.error || "Não foi possível atualizar o campo",
              variant: "destructive",
            });
          }
        } else {
          const input: CreateCustomFieldInput = {
            workspaceId,
            name: name.trim(),
            type,
            required,
            options: type === "select" ? options : undefined,
            order: 0,
          };

          const result = await createCustomFieldAction(input);

          if (result.success && result.field) {
            toast({
              title: "Campo criado!",
              description: `Campo "${result.field.name}" foi criado com sucesso.`,
            });
            router.refresh();
            onSuccess();
          } else {
            toast({
              title: "Erro ao criar campo",
              description: result.error || "Não foi possível criar o campo",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        toast({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro ao salvar o campo",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">
          Nome do Campo *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          className={errors.name ? "border-destructive" : ""}
          placeholder="Ex: Segmento, Faturamento"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Tipo *</Label>
        <Select value={type} onValueChange={(value: CustomFieldType) => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Telefone</SelectItem>
            <SelectItem value="textarea">Texto Longo</SelectItem>
            <SelectItem value="select">Seleção</SelectItem>
            <SelectItem value="date">Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === "select" && (
        <SelectOptionsManager
          options={options}
          newOption={newOption}
          onNewOptionChange={setNewOption}
          onAddOption={handleAddOption}
          onRemoveOption={handleRemoveOption}
          error={errors.options}
        />
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={required}
          onCheckedChange={(checked) => setRequired(checked === true)}
        />
        <Label htmlFor="required" className="cursor-pointer">
          Campo obrigatório
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={isPending}
        >
          {isPending ? "Salvando..." : field ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
