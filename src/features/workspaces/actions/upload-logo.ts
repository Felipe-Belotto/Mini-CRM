"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth } from "@/shared/lib/supabase/utils";

export interface UploadLogoResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Server Action para fazer upload do logo do workspace
 * O workspace será criado primeiro, então o ID será usado para o upload
 */
export async function uploadWorkspaceLogoAction(
  workspaceId: string,
  file: File,
): Promise<UploadLogoResult> {
  try {
    // Verificar autenticação
    const user = await requireAuth();
    const supabase = await createClient();

    // Verificar se o usuário é owner do workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return {
        success: false,
        error: "Workspace não encontrado",
      };
    }

    if (workspace.owner_id !== user.id) {
      return {
        success: false,
        error: "Você não tem permissão para fazer upload do logo",
      };
    }

    // Validar tipo de arquivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Tipo de arquivo inválido. Use JPG, PNG ou WEBP",
      };
    }

    // Validar tamanho (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Arquivo muito grande. Tamanho máximo: 2MB",
      };
    }

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileExt = file.name.split(".").pop();
    const fileName = `${workspaceId}/logo.${fileExt}`;

    // Fazer upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("workspace-logos")
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true, // Substituir se já existir
      });

    if (uploadError) {
      console.error("Error uploading logo:", uploadError);
      return {
        success: false,
        error: uploadError.message || "Erro ao fazer upload do logo",
      };
    }

    // Obter URL pública do arquivo
    const {
      data: { publicUrl },
    } = supabase.storage.from("workspace-logos").getPublicUrl(fileName);

    // Atualizar workspace com a URL do logo
    const { error: updateError } = await supabase
      .from("workspaces")
      .update({ logo_url: publicUrl })
      .eq("id", workspaceId);

    if (updateError) {
      console.error("Error updating workspace logo_url:", updateError);
      return {
        success: false,
        error: "Erro ao salvar URL do logo",
      };
    }

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error in uploadWorkspaceLogoAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao fazer upload do logo",
    };
  }
}
