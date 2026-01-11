"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess, canUpdateWorkspace } from "@/shared/lib/supabase/utils";
import type { ColorPalette } from "@/shared/types/crm";

/**
 * Mapeia dados do banco para o tipo ColorPalette
 */
function mapDbPaletteToColorPalette(dbPalette: {
  id: string;
  name: string;
  key: string;
  border_class: string;
  bg_class: string;
  preview_class: string;
  is_default: boolean;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}): ColorPalette {
  return {
    id: dbPalette.id,
    name: dbPalette.name,
    key: dbPalette.key,
    borderClass: dbPalette.border_class,
    bgClass: dbPalette.bg_class,
    previewClass: dbPalette.preview_class,
    isDefault: dbPalette.is_default,
    workspaceId: dbPalette.workspace_id || undefined,
    createdAt: new Date(dbPalette.created_at),
    updatedAt: new Date(dbPalette.updated_at),
  };
}

/**
 * Busca todas as paletas de cores disponíveis (padrão + customizadas do workspace)
 */
export async function getColorPalettesAction(
  workspaceId?: string
): Promise<ColorPalette[]> {
  try {
    await requireAuth();
    const supabase = await createClient();

    // Buscar cores padrão (is_default = true, workspace_id = NULL)
    const { data: defaultPalettes, error: defaultError } = await supabase
      .from("color_palettes")
      .select("*")
      .eq("is_default", true)
      .is("workspace_id", null)
      .order("name", { ascending: true });

    if (defaultError) {
      console.error("Error fetching default color palettes:", defaultError);
    }

    let customPalettes: typeof defaultPalettes = [];

    // Se workspaceId fornecido, buscar cores customizadas do workspace
    if (workspaceId) {
      const hasAccess = await hasWorkspaceAccess(workspaceId);
      if (hasAccess) {
        const { data, error: customError } = await supabase
          .from("color_palettes")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("name", { ascending: true });

        if (customError) {
          console.error("Error fetching custom color palettes:", customError);
        } else {
          customPalettes = data || [];
        }
      }
    }

    const allPalettes = [
      ...(defaultPalettes || []),
      ...customPalettes,
    ];

    return allPalettes.map(mapDbPaletteToColorPalette);
  } catch (error) {
    console.error("Error in getColorPalettesAction:", error);
    return [];
  }
}

/**
 * Busca apenas cores padrão do sistema
 */
export async function getDefaultColorPalettesAction(): Promise<ColorPalette[]> {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("color_palettes")
      .select("*")
      .eq("is_default", true)
      .is("workspace_id", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching default color palettes:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(mapDbPaletteToColorPalette);
  } catch (error) {
    console.error("Error in getDefaultColorPalettesAction:", error);
    return [];
  }
}

export interface CreateColorPaletteInput {
  workspaceId: string;
  name: string;
  key: string;
  borderClass: string;
  bgClass: string;
  previewClass: string;
}

/**
 * Cria uma nova paleta de cores customizada para o workspace
 */
export async function createColorPaletteAction(
  input: CreateColorPaletteInput
): Promise<ColorPalette | null> {
  try {
    await requireAuth();
    const canUpdate = await canUpdateWorkspace(input.workspaceId);

    if (!canUpdate) {
      throw new Error("Você não tem permissão para criar cores customizadas neste workspace");
    }

    const supabase = await createClient();

    // Verificar se já existe uma cor com a mesma key no workspace
    const { data: existing } = await supabase
      .from("color_palettes")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("key", input.key)
      .single();

    if (existing) {
      throw new Error(`Já existe uma cor com a chave "${input.key}" neste workspace`);
    }

    const { data, error } = await supabase
      .from("color_palettes")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        key: input.key,
        border_class: input.borderClass,
        bg_class: input.bgClass,
        preview_class: input.previewClass,
        is_default: false,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating color palette:", error);
      throw new Error(error?.message || "Não foi possível criar a paleta de cores");
    }

    return mapDbPaletteToColorPalette(data);
  } catch (error) {
    console.error("Error in createColorPaletteAction:", error);
    throw error;
  }
}

export interface UpdateColorPaletteInput {
  id: string;
  name?: string;
  borderClass?: string;
  bgClass?: string;
  previewClass?: string;
}

/**
 * Atualiza uma paleta de cores customizada
 */
export async function updateColorPaletteAction(
  input: UpdateColorPaletteInput
): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar paleta para verificar workspace
    const { data: existingPalette, error: fetchError } = await supabase
      .from("color_palettes")
      .select("workspace_id, is_default")
      .eq("id", input.id)
      .single();

    if (fetchError || !existingPalette) {
      throw new Error("Paleta de cores não encontrada");
    }

    // Não permitir atualizar cores padrão
    if (existingPalette.is_default) {
      throw new Error("Não é possível atualizar cores padrão do sistema");
    }

    if (!existingPalette.workspace_id) {
      throw new Error("Paleta inválida");
    }

    await requireAuth();
    const canUpdate = await canUpdateWorkspace(existingPalette.workspace_id);

    if (!canUpdate) {
      throw new Error("Você não tem permissão para editar cores customizadas neste workspace");
    }

    // Preparar updates
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.borderClass !== undefined) updates.border_class = input.borderClass;
    if (input.bgClass !== undefined) updates.bg_class = input.bgClass;
    if (input.previewClass !== undefined) updates.preview_class = input.previewClass;

    if (Object.keys(updates).length === 0) {
      return;
    }

    const { error } = await supabase
      .from("color_palettes")
      .update(updates)
      .eq("id", input.id);

    if (error) {
      console.error("Error updating color palette:", error);
      throw new Error(error.message || "Não foi possível atualizar a paleta de cores");
    }
  } catch (error) {
    console.error("Error in updateColorPaletteAction:", error);
    throw error;
  }
}

/**
 * Deleta uma paleta de cores customizada
 */
export async function deleteColorPaletteAction(paletteId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar paleta para verificar workspace
    const { data: existingPalette, error: fetchError } = await supabase
      .from("color_palettes")
      .select("workspace_id, is_default")
      .eq("id", paletteId)
      .single();

    if (fetchError || !existingPalette) {
      throw new Error("Paleta de cores não encontrada");
    }

    // Não permitir deletar cores padrão
    if (existingPalette.is_default) {
      throw new Error("Não é possível deletar cores padrão do sistema");
    }

    if (!existingPalette.workspace_id) {
      throw new Error("Paleta inválida");
    }

    await requireAuth();
    const canUpdate = await canUpdateWorkspace(existingPalette.workspace_id);

    if (!canUpdate) {
      throw new Error("Você não tem permissão para deletar cores customizadas neste workspace");
    }

    // Verificar se há etapas usando esta paleta
    const { count } = await supabase
      .from("pipeline_stages")
      .select("*", { count: "exact", head: true })
      .eq("color_palette_id", paletteId);

    if (count && count > 0) {
      throw new Error(`Não é possível deletar: existem ${count} etapas usando esta cor`);
    }

    const { error } = await supabase
      .from("color_palettes")
      .delete()
      .eq("id", paletteId);

    if (error) {
      console.error("Error deleting color palette:", error);
      throw new Error(error.message || "Não foi possível deletar a paleta de cores");
    }
  } catch (error) {
    console.error("Error in deleteColorPaletteAction:", error);
    throw error;
  }
}
