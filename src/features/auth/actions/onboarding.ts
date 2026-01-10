"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, getCurrentUser } from "@/shared/lib/supabase/utils";

export interface CompleteOnboardingResult {
  success: boolean;
  error?: string;
}

export interface CompleteOnboardingInput {
  firstName: string;
  lastName: string;
  avatar?: File;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  avatar?: File;
}

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

/**
 * Server Action para obter dados do perfil do usuário atual
 */
export async function getProfileDataAction(): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Perfil não encontrado",
      };
    }

    return {
      success: true,
      data: {
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: authUser?.email || "",
        avatarUrl: profile.avatar_url || null,
      },
    };
  } catch (error) {
    console.error("Error in getProfileDataAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao buscar dados do perfil",
    };
  }
}

/**
 * Server Action para completar o onboarding do perfil
 */
export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    let avatarUrl: string | null = null;

    // Se houver arquivo de avatar, fazer upload
    if (input.avatar) {
      // Validar tipo de arquivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(input.avatar.type)) {
        return {
          success: false,
          error: "Tipo de arquivo inválido. Use JPG, PNG ou WEBP",
        };
      }

      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (input.avatar.size > maxSize) {
        return {
          success: false,
          error: "Arquivo muito grande. Tamanho máximo: 5MB",
        };
      }

      // Converter File para ArrayBuffer
      const arrayBuffer = await input.avatar.arrayBuffer();
      const fileExt = input.avatar.name.split(".").pop() || "webp";
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, {
          contentType: input.avatar.type,
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
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      avatarUrl = publicUrl;
    }

    // Atualizar perfil com nome, sobrenome, avatar e marcar onboarding como completo
    const updateData: {
      first_name: string;
      last_name: string;
      on_completed: boolean;
      avatar_url?: string;
    } = {
      first_name: input.firstName,
      last_name: input.lastName,
      on_completed: true,
    };

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return {
        success: false,
        error: "Erro ao atualizar perfil",
      };
    }

    // Revalidar paths que mostram o perfil do usuário (sidebar, dashboard, etc)
    revalidatePath("/", "layout");
    revalidatePath("/onboarding/user");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in completeOnboardingAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao completar o onboarding",
    };
  }
}

/**
 * Server Action para atualizar o perfil do usuário
 */
export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    let avatarUrl: string | undefined = undefined;

    // Se houver arquivo de avatar, fazer upload
    if (input.avatar) {
      // Validar tipo de arquivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(input.avatar.type)) {
        return {
          success: false,
          error: "Tipo de arquivo inválido. Use JPG, PNG ou WEBP",
        };
      }

      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (input.avatar.size > maxSize) {
        return {
          success: false,
          error: "Arquivo muito grande. Tamanho máximo: 5MB",
        };
      }

      // Converter File para ArrayBuffer
      const arrayBuffer = await input.avatar.arrayBuffer();
      const fileExt = input.avatar.name.split(".").pop() || "webp";
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, {
          contentType: input.avatar.type,
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
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      avatarUrl = publicUrl;
    }

    // Atualizar perfil com nome, sobrenome e avatar (se fornecido)
    const updateData: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    } = {
      first_name: input.firstName,
      last_name: input.lastName,
    };

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return {
        success: false,
        error: "Erro ao atualizar perfil",
      };
    }

    // Revalidar paths que mostram o perfil do usuário (sidebar, dashboard, etc)
    revalidatePath("/", "layout");
    revalidatePath("/configuracoes/perfil");
    revalidatePath("/pipeline");
    revalidatePath("/campanhas");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in updateProfileAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao atualizar o perfil",
    };
  }
}