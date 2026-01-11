"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess, canUpdateWorkspace } from "@/shared/lib/supabase/utils";
import type { PipelineStage } from "@/shared/types/crm";

/**
 * Mapeia dados do banco para o tipo PipelineStage
 */
function mapDbStageToPipelineStage(dbStage: {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  color: string;
  color_palette_id?: string | null;
  sort_order: number;
  is_system: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}): PipelineStage {
  return {
    id: dbStage.id,
    workspaceId: dbStage.workspace_id,
    name: dbStage.name,
    slug: dbStage.slug,
    color: dbStage.color,
    colorPaletteId: dbStage.color_palette_id || undefined,
    sortOrder: dbStage.sort_order,
    isSystem: dbStage.is_system,
    isHidden: dbStage.is_hidden,
    createdAt: new Date(dbStage.created_at),
    updatedAt: new Date(dbStage.updated_at),
  };
}

/**
 * Busca todas as etapas de um workspace
 */
export async function getPipelineStagesAction(
  workspaceId: string
): Promise<PipelineStage[]> {
  try {
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching pipeline stages:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(mapDbStageToPipelineStage);
  } catch (error) {
    console.error("Error in getPipelineStagesAction:", error);
    return [];
  }
}

/**
 * Busca etapas visíveis (não ocultas) de um workspace
 */
export async function getVisiblePipelineStagesAction(
  workspaceId: string
): Promise<PipelineStage[]> {
  try {
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_hidden", false)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching visible pipeline stages:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(mapDbStageToPipelineStage);
  } catch (error) {
    console.error("Error in getVisiblePipelineStagesAction:", error);
    return [];
  }
}

export interface CreateStageInput {
  workspaceId: string;
  name: string;
  color: string;
}

/**
 * Cria uma nova etapa personalizada
 */
export async function createStageAction(
  input: CreateStageInput
): Promise<PipelineStage | null> {
  try {
    await requireAuth();
    const canUpdate = await canUpdateWorkspace(input.workspaceId);

    if (!canUpdate) {
      throw new Error("Você não tem permissão para criar etapas neste workspace");
    }

    const supabase = await createClient();

    // Gerar slug único
    const slug = input.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    // Obter próximo sort_order
    const { data: lastStage } = await supabase
      .from("pipeline_stages")
      .select("sort_order")
      .eq("workspace_id", input.workspaceId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastStage?.sort_order ?? 0) + 1;

    // Buscar color_palette_id baseado na key da cor
    let colorPaletteId: string | null = null;
    if (input.color) {
      // Primeiro tentar buscar no workspace, depois nas cores padrão
      const { data: workspacePalette } = await supabase
        .from("color_palettes")
        .select("id")
        .eq("key", input.color)
        .eq("workspace_id", input.workspaceId)
        .single();
      
      if (workspacePalette) {
        colorPaletteId = workspacePalette.id;
      } else {
        // Se não encontrou no workspace, buscar nas cores padrão
        const { data: defaultPalette } = await supabase
          .from("color_palettes")
          .select("id")
          .eq("key", input.color)
          .eq("is_default", true)
          .is("workspace_id", null)
          .single();
        
        if (defaultPalette) {
          colorPaletteId = defaultPalette.id;
        }
      }
    }

    // Inserir nova etapa
    const { data, error } = await supabase
      .from("pipeline_stages")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        slug: `custom_${slug}_${Date.now()}`,
        color: input.color,
        color_palette_id: colorPaletteId,
        sort_order: nextSortOrder,
        is_system: false,
        is_hidden: false,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating stage:", error);
      throw new Error(error?.message || "Não foi possível criar a etapa");
    }

    revalidatePath("/pipeline");
    revalidatePath("/configuracoes/funil");

    return mapDbStageToPipelineStage(data);
  } catch (error) {
    console.error("Error in createStageAction:", error);
    throw error;
  }
}

export interface UpdateStageInput {
  id: string;
  name?: string;
  color?: string;
  isHidden?: boolean;
}

/**
 * Atualiza uma etapa existente
 */
export async function updateStageAction(
  input: UpdateStageInput
): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar etapa para verificar workspace
    const { data: existingStage, error: fetchError } = await supabase
      .from("pipeline_stages")
      .select("workspace_id")
      .eq("id", input.id)
      .single();

    if (fetchError || !existingStage) {
      throw new Error("Etapa não encontrada");
    }

    await requireAuth();
    const canUpdate = await canUpdateWorkspace(existingStage.workspace_id);

    if (!canUpdate) {
      throw new Error("Você não tem permissão para editar etapas neste workspace");
    }

    // Preparar updates
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.color !== undefined) {
      updates.color = input.color;
      
      // Buscar color_palette_id baseado na key da cor
      let colorPaletteId: string | null = null;
      if (input.color) {
        // Primeiro tentar buscar no workspace, depois nas cores padrão
        const { data: workspacePalette } = await supabase
          .from("color_palettes")
          .select("id")
          .eq("key", input.color)
          .eq("workspace_id", existingStage.workspace_id)
          .single();
        
        if (workspacePalette) {
          colorPaletteId = workspacePalette.id;
        } else {
          // Se não encontrou no workspace, buscar nas cores padrão
          const { data: defaultPalette } = await supabase
            .from("color_palettes")
            .select("id")
            .eq("key", input.color)
            .eq("is_default", true)
            .is("workspace_id", null)
            .single();
          
          if (defaultPalette) {
            colorPaletteId = defaultPalette.id;
          }
        }
      }
      updates.color_palette_id = colorPaletteId;
    }
    if (input.isHidden !== undefined) updates.is_hidden = input.isHidden;

    if (Object.keys(updates).length === 0) {
      return;
    }

    const { error } = await supabase
      .from("pipeline_stages")
      .update(updates)
      .eq("id", input.id);

    if (error) {
      console.error("Error updating stage:", error);
      throw new Error(error.message || "Não foi possível atualizar a etapa");
    }

    revalidatePath("/pipeline");
    revalidatePath("/configuracoes/funil");
  } catch (error) {
    console.error("Error in updateStageAction:", error);
    throw error;
  }
}

/**
 * Deleta uma etapa personalizada (não permite deletar etapas do sistema)
 */
export async function deleteStageAction(stageId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar etapa para verificar workspace e se é do sistema
    const { data: existingStage, error: fetchError } = await supabase
      .from("pipeline_stages")
      .select("workspace_id, is_system")
      .eq("id", stageId)
      .single();

    if (fetchError || !existingStage) {
      throw new Error("Etapa não encontrada");
    }

    if (existingStage.is_system) {
      throw new Error("Etapas do sistema não podem ser deletadas. Você pode ocultá-las.");
    }

    await requireAuth();
    const canUpdate = await canUpdateWorkspace(existingStage.workspace_id);

    if (!canUpdate) {
      throw new Error("Você não tem permissão para deletar etapas neste workspace");
    }

    // Verificar se há leads nesta etapa
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", existingStage.workspace_id)
      .eq("stage", stageId);

    if (count && count > 0) {
      throw new Error(`Não é possível deletar: existem ${count} leads nesta etapa`);
    }

    const { error } = await supabase
      .from("pipeline_stages")
      .delete()
      .eq("id", stageId);

    if (error) {
      console.error("Error deleting stage:", error);
      throw new Error(error.message || "Não foi possível deletar a etapa");
    }

    revalidatePath("/pipeline");
    revalidatePath("/configuracoes/funil");
  } catch (error) {
    console.error("Error in deleteStageAction:", error);
    throw error;
  }
}

/**
 * Reordena as etapas do pipeline
 */
export async function reorderStagesAction(
  stageUpdates: { id: string; sortOrder: number }[]
): Promise<void> {
  try {
    if (stageUpdates.length === 0) return;

    const supabase = await createClient();

    // Buscar primeira etapa para verificar workspace
    const { data: firstStage, error: fetchError } = await supabase
      .from("pipeline_stages")
      .select("workspace_id")
      .eq("id", stageUpdates[0].id)
      .single();

    if (fetchError || !firstStage) {
      throw new Error("Etapa não encontrada");
    }

    await requireAuth();
    const canUpdate = await canUpdateWorkspace(firstStage.workspace_id);

    if (!canUpdate) {
      throw new Error("Você não tem permissão para reordenar etapas neste workspace");
    }

    // Atualizar sort_order de cada etapa
    for (const update of stageUpdates) {
      const { error } = await supabase
        .from("pipeline_stages")
        .update({ sort_order: update.sortOrder })
        .eq("id", update.id);

      if (error) {
        console.error("Error updating stage sort_order:", error);
        throw new Error(error.message || "Não foi possível reordenar as etapas");
      }
    }

    revalidatePath("/pipeline");
    revalidatePath("/configuracoes/funil");
  } catch (error) {
    console.error("Error in reorderStagesAction:", error);
    throw error;
  }
}
