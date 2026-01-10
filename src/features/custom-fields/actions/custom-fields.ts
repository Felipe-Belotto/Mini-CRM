"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import type { CustomField, CustomFieldRow } from "@/shared/types/crm";

export interface CreateCustomFieldInput {
  workspaceId: string;
  name: string;
  type: CustomField["type"];
  required: boolean;
  options?: string[];
  order: number;
}

export interface UpdateCustomFieldInput {
  id: string;
  name?: string;
  type?: CustomField["type"];
  required?: boolean;
  options?: string[];
  order?: number;
}

export interface CustomFieldResult {
  success: boolean;
  field?: CustomField;
  error?: string;
}

/**
 * Mapeia dados do banco para o tipo CustomField
 */
function mapDbCustomFieldToCustomField(dbField: CustomFieldRow): CustomField {
  return {
    id: dbField.id,
    workspaceId: dbField.workspace_id,
    name: dbField.name,
    type: dbField.type as CustomField["type"],
    required: dbField.required,
    options:
      dbField.options && Array.isArray(dbField.options)
        ? (dbField.options as string[])
        : undefined,
    order: dbField.order,
    createdAt: new Date(dbField.created_at),
  };
}

/**
 * Server Action para criar campo personalizado
 */
export async function createCustomFieldAction(
  input: CreateCustomFieldInput,
): Promise<CustomFieldResult> {
  try {
    // Validação básica
    if (!input.name || input.name.trim() === "") {
      return {
        success: false,
        error: "Nome do campo é obrigatório",
      };
    }

    if (input.type === "select" && (!input.options || input.options.length === 0)) {
      return {
        success: false,
        error: "Campos do tipo 'select' devem ter pelo menos uma opção",
      };
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(input.workspaceId);

    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem acesso a este workspace",
      };
    }

    const supabase = await createClient();

    // Criar campo personalizado no banco
    const { data: dbField, error } = await supabase
      .from("custom_fields")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name.trim(),
        type: input.type,
        required: input.required,
        options: input.options ? (input.options as unknown) : null,
        order: input.order,
      })
      .select()
      .single();

    if (error || !dbField) {
      console.error("Error creating custom field:", error);
      return {
        success: false,
        error: error?.message || "Não foi possível criar o campo personalizado",
      };
    }

    const field = mapDbCustomFieldToCustomField(dbField);

    return {
      success: true,
      field,
    };
  } catch (error) {
    console.error("Error in createCustomFieldAction:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        error: "Você precisa estar autenticado para criar campos personalizados",
      };
    }
    return {
      success: false,
      error: "Ocorreu um erro ao criar o campo personalizado",
    };
  }
}

/**
 * Server Action para atualizar campo personalizado
 */
export async function updateCustomFieldAction(
  input: UpdateCustomFieldInput,
): Promise<CustomFieldResult> {
  try {
    if (input.type === "select" && input.options && input.options.length === 0) {
      return {
        success: false,
        error: "Campos do tipo 'select' devem ter pelo menos uma opção",
      };
    }

    // Buscar campo para verificar workspace
    const supabase = await createClient();
    const { data: existingField, error: fetchError } = await supabase
      .from("custom_fields")
      .select("workspace_id")
      .eq("id", input.id)
      .single();

    if (fetchError || !existingField) {
      return {
        success: false,
        error: "Campo personalizado não encontrado",
      };
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingField.workspace_id);

    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem acesso a este workspace",
      };
    }

    // Preparar updates para o banco
    const dbUpdates: Record<string, unknown> = {};

    if (input.name !== undefined) dbUpdates.name = input.name.trim();
    if (input.type !== undefined) dbUpdates.type = input.type;
    if (input.required !== undefined)
      dbUpdates.required = input.required;
    if (input.options !== undefined)
      dbUpdates.options = input.options
        ? (input.options as unknown)
        : null;
    if (input.order !== undefined) dbUpdates.order = input.order;

    // Atualizar campo no banco
    const { data: dbField, error } = await supabase
      .from("custom_fields")
      .update(dbUpdates)
      .eq("id", input.id)
      .select()
      .single();

    if (error || !dbField) {
      console.error("Error updating custom field:", error);
      return {
        success: false,
        error: error?.message || "Não foi possível atualizar o campo personalizado",
      };
    }

    const field = mapDbCustomFieldToCustomField(dbField);

    return {
      success: true,
      field,
    };
  } catch (error) {
    console.error("Error in updateCustomFieldAction:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao atualizar o campo personalizado",
    };
  }
}

/**
 * Server Action para deletar campo personalizado
 */
export async function deleteCustomFieldAction(
  fieldId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar campo para verificar workspace
    const supabase = await createClient();
    const { data: existingField, error: fetchError } = await supabase
      .from("custom_fields")
      .select("workspace_id")
      .eq("id", fieldId)
      .single();

    if (fetchError || !existingField) {
      return {
        success: false,
        error: "Campo personalizado não encontrado",
      };
    }

    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(existingField.workspace_id);

    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem acesso a este workspace",
      };
    }

    // Deletar campo
    const { error } = await supabase
      .from("custom_fields")
      .delete()
      .eq("id", fieldId);

    if (error) {
      console.error("Error deleting custom field:", error);
      return {
        success: false,
        error: error.message || "Não foi possível deletar o campo personalizado",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteCustomFieldAction:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao deletar o campo personalizado",
    };
  }
}

/**
 * Server Action para listar campos personalizados do workspace
 */
export async function getCustomFieldsAction(
  workspaceId: string,
): Promise<CustomField[]> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return [];
    }

    const supabase = await createClient();

    // Buscar campos personalizados do workspace
    const { data: dbFields, error } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("order", { ascending: true });

    if (error) {
      console.error("Error fetching custom fields:", error);
      return [];
    }

    if (!dbFields) {
      return [];
    }

    return dbFields.map(mapDbCustomFieldToCustomField);
  } catch (error) {
    console.error("Error in getCustomFieldsAction:", error);
    return [];
  }
}

/**
 * Server Action para reordenar campos personalizados
 * Atualiza o campo 'order' de cada campo baseado na nova ordem
 */
export async function reorderCustomFieldsAction(
  workspaceId: string,
  orderedIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem acesso a este workspace",
      };
    }

    const supabase = await createClient();

    // Atualizar a ordem de cada campo
    const updatePromises = orderedIds.map((id, index) =>
      supabase
        .from("custom_fields")
        .update({ order: index })
        .eq("id", id)
        .eq("workspace_id", workspaceId)
    );

    const results = await Promise.all(updatePromises);

    // Verificar se alguma atualização falhou
    const failedUpdate = results.find((result) => result.error);
    if (failedUpdate?.error) {
      console.error("Error reordering custom fields:", failedUpdate.error);
      return {
        success: false,
        error: failedUpdate.error.message || "Não foi possível reordenar os campos",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in reorderCustomFieldsAction:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao reordenar os campos",
    };
  }
}