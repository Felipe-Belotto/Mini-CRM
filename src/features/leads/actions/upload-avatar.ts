"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import { revalidatePath } from "next/cache";

export interface UploadLeadAvatarResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Server Action para fazer upload do avatar do lead
 */
export async function uploadLeadAvatarAction(
  leadId: string,
  workspaceId: string,
  file: File,
): Promise<UploadLeadAvatarResult> {
  try {
    // Verificar autenticação
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem acesso a este workspace",
      };
    }

    const supabase = await createClient();

    // Verificar se o lead existe e pertence ao workspace
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("workspace_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return {
        success: false,
        error: "Lead não encontrado",
      };
    }

    if (lead.workspace_id !== workspaceId) {
      return {
        success: false,
        error: "Lead não pertence a este workspace",
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

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Arquivo muito grande. Tamanho máximo: 5MB",
      };
    }

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${workspaceId}/${leadId}/avatar.${fileExt}`;

    // Fazer upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("lead-avatars")
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true, // Substituir se já existir
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return {
        success: false,
        error: uploadError.message || "Erro ao fazer upload do avatar",
      };
    }

    // Obter URL pública do arquivo
    const {
      data: { publicUrl },
    } = supabase.storage.from("lead-avatars").getPublicUrl(fileName);

    // Atualizar lead com a URL do avatar
    const { error: updateError } = await supabase
      .from("leads")
      .update({ avatar_url: publicUrl })
      .eq("id", leadId);

    if (updateError) {
      console.error("Error updating lead avatar_url:", updateError);
      return {
        success: false,
        error: "Erro ao salvar URL do avatar",
      };
    }

    revalidatePath("/pipeline");

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error in uploadLeadAvatarAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao fazer upload do avatar",
    };
  }
}
