"use client";

import { useState, useEffect, useCallback } from "react";
import type { CustomField } from "@/shared/types/crm";
import {
  createCustomFieldAction,
  updateCustomFieldAction,
  deleteCustomFieldAction,
  getCustomFieldsAction,
  type CreateCustomFieldInput,
  type UpdateCustomFieldInput,
} from "../actions/custom-fields";
import { useToast } from "@/shared/hooks/use-toast";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";

interface UseCustomFieldsReturn {
  fields: CustomField[];
  isLoading: boolean;
  createField: (input: CreateCustomFieldInput) => Promise<boolean>;
  updateField: (input: UpdateCustomFieldInput) => Promise<boolean>;
  deleteField: (fieldId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useCustomFields(): UseCustomFieldsReturn {
  const { currentWorkspace } = useWorkspace();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadFields = useCallback(async () => {
    if (!currentWorkspace) {
      setFields([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getCustomFieldsAction(currentWorkspace.id);
      setFields(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Erro ao carregar campos personalizados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os campos personalizados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, toast]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const createField = useCallback(
    async (input: CreateCustomFieldInput): Promise<boolean> => {
      try {
        const result = await createCustomFieldAction(input);

        if (result.success && result.field) {
          setFields((prev) => [...prev, result.field!].sort((a, b) => a.order - b.order));
          toast({
            title: "Campo criado!",
            description: `Campo "${result.field.name}" foi criado com sucesso.`,
          });
          return true;
        } else {
          toast({
            title: "Erro ao criar campo",
            description: result.error || "Não foi possível criar o campo",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Erro ao criar campo",
          description: "Ocorreu um erro ao criar o campo",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast],
  );

  const updateField = useCallback(
    async (input: UpdateCustomFieldInput): Promise<boolean> => {
      try {
        const result = await updateCustomFieldAction(input);

        if (result.success && result.field) {
          setFields((prev) =>
            prev
              .map((f) => (f.id === input.id ? result.field! : f))
              .sort((a, b) => a.order - b.order),
          );
          toast({
            title: "Campo atualizado!",
            description: `Campo foi atualizado com sucesso.`,
          });
          return true;
        } else {
          toast({
            title: "Erro ao atualizar campo",
            description: result.error || "Não foi possível atualizar o campo",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Erro ao atualizar campo",
          description: "Ocorreu um erro ao atualizar o campo",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast],
  );

  const deleteField = useCallback(
    async (fieldId: string): Promise<boolean> => {
      try {
        const result = await deleteCustomFieldAction(fieldId);

        if (result.success) {
          setFields((prev) => prev.filter((f) => f.id !== fieldId));
          toast({
            title: "Campo deletado!",
            description: "Campo foi deletado com sucesso.",
          });
          return true;
        } else {
          toast({
            title: "Erro ao deletar campo",
            description: result.error || "Não foi possível deletar o campo",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Erro ao deletar campo",
          description: "Ocorreu um erro ao deletar o campo",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast],
  );

  const refresh = useCallback(async () => {
    await loadFields();
  }, [loadFields]);

  return {
    fields,
    isLoading,
    createField,
    updateField,
    deleteField,
    refresh,
  };
}
