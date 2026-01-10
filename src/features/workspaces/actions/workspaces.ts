"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import {
  hasWorkspaceAccess,
  isWorkspaceOwner,
  requireAuth,
  canUpdateWorkspace,
} from "@/shared/lib/supabase/utils";
import type { Workspace } from "@/shared/types/crm";

export interface CreateWorkspaceInput {
  name: string;
  logoUrl?: string;
}

export interface UpdateWorkspaceInput {
  name: string;
  logo?: File;
}

export interface WorkspaceResult {
  success: boolean;
  workspace?: Workspace;
  error?: string;
}

/**
 * Gera um slug único baseado no nome do workspace
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Server Action para criar workspace
 */
export async function createWorkspaceAction(
  input: CreateWorkspaceInput,
): Promise<WorkspaceResult> {
  try {
    // Validação básica
    if (!input.name || input.name.trim() === "") {
      return {
        success: false,
        error: "Nome do workspace é obrigatório",
      };
    }

    // Verificar autenticação
    const user = await requireAuth();
    const supabase = await createClient();

    // Verificar se já existe workspace com o mesmo nome para este usuário (case-insensitive)
    const { data: existingWorkspaces } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("owner_id", user.id)
      .ilike("name", input.name.trim());

    if (existingWorkspaces && existingWorkspaces.length > 0) {
      return {
        success: false,
        error: `Você já possui um workspace com o nome "${input.name.trim()}". Escolha outro nome.`,
      };
    }

    // Gerar slug único
    const baseSlug = generateSlug(input.name);
    let slug = baseSlug;
    let counter = 1;

    // Verificar se slug já existe e gerar um único
    while (true) {
      const { data: existing } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Criar workspace
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({
        name: input.name.trim(),
        slug,
        owner_id: user.id,
        logo_url: input.logoUrl || null,
      })
      .select()
      .single();

    if (error || !workspace) {
      console.error("Error creating workspace:", error);
      
      // Verificar se é erro de constraint/índice único (workspace com mesmo nome)
      // Código 23505 = unique_violation no PostgreSQL
      if (
        error?.code === '23505' || 
        error?.message?.includes('unique constraint') || 
        error?.message?.includes('duplicate key') ||
        error?.message?.includes('workspaces_owner_id_name_unique_idx')
      ) {
        return {
          success: false,
          error: `Você já possui um workspace com o nome "${input.name.trim()}". Escolha outro nome.`,
        };
      }
      
      return {
        success: false,
        error: error?.message || "Não foi possível criar o workspace",
      };
    }

    // O trigger handle_new_workspace já adiciona o owner como membro
    // e cria o pipeline_config padrão

    const result: Workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoUrl: workspace.logo_url || undefined,
      createdAt: new Date(workspace.created_at),
      ownerId: workspace.owner_id,
    };

    // Salvar como workspace atual no perfil (trigger já faz isso, mas garantimos)
    await setCurrentWorkspaceInProfile(result.id);

    // Revalidar paths para garantir que o layout e dashboard carreguem o novo workspace
    revalidatePath("/", "layout");
    revalidatePath("/onboarding/workspace");

    return {
      success: true,
      workspace: result,
    };
  } catch (error) {
    console.error("Error in createWorkspaceAction:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        error: "Você precisa estar autenticado para criar um workspace",
      };
    }
    return {
      success: false,
      error: "Ocorreu um erro ao criar o workspace",
    };
  }
}

/**
 * Server Action para verificar se o usuário tem algum workspace
 */
export async function hasAnyWorkspaceAction(): Promise<boolean> {
  try {
    const workspaces = await getWorkspacesAction();
    return workspaces.length > 0;
  } catch (error) {
    console.error("Error checking if user has workspace:", error);
    return false;
  }
}

/**
 * Server Action para listar workspaces do usuário
 */
export async function getWorkspacesAction(): Promise<Workspace[]> {
  try {
    // Verificar autenticação
    const user = await requireAuth();
    const supabase = await createClient();

    // Buscar workspaces onde o usuário é owner
    const { data: ownedWorkspaces, error: ownedError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_id", user.id);

    if (ownedError) {
      console.error("Error fetching owned workspaces:", ownedError);
    }

    // Buscar IDs dos workspaces onde o usuário é membro
    const { data: memberWorkspaces, error: memberError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    if (memberError) {
      console.error("Error fetching member workspaces:", memberError);
    }

    // Buscar workspaces onde o usuário é membro
    let memberWorkspaceIds: string[] = [];
    if (memberWorkspaces && memberWorkspaces.length > 0) {
      memberWorkspaceIds = memberWorkspaces.map((m) => m.workspace_id);
    }

    let memberWorkspaceData = null;
    if (memberWorkspaceIds.length > 0) {
      const { data, error: memberDataError } = await supabase
        .from("workspaces")
        .select("*")
        .in("id", memberWorkspaceIds);

      if (memberDataError) {
        console.error("Error fetching member workspace data:", memberDataError);
      } else {
        memberWorkspaceData = data;
      }
    }

    // Combinar e remover duplicatas
    const allWorkspaces = [
      ...(ownedWorkspaces || []),
      ...(memberWorkspaceData || []),
    ];

    // Remover duplicatas baseado no ID
    const uniqueWorkspaces = Array.from(
      new Map(allWorkspaces.map((w) => [w.id, w])).values(),
    );

    // Ordenar por data de criação (mais recente primeiro)
    uniqueWorkspaces.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return uniqueWorkspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      logoUrl: w.logo_url || undefined,
      createdAt: new Date(w.created_at),
      ownerId: w.owner_id,
    }));
  } catch (error) {
    console.error("Error in getWorkspacesAction:", error);
    return [];
  }
}

/**
 * Função auxiliar para salvar workspace atual no perfil do usuário
 * Valida que o usuário tem acesso ao workspace antes de atualizar
 */
async function setCurrentWorkspaceInProfile(
  workspaceId: string,
): Promise<void> {
  const user = await requireAuth();

  // Verificar se o usuário tem acesso ao workspace
  const hasAccess = await hasWorkspaceAccess(workspaceId, user.id);
  if (!hasAccess) {
    throw new Error("Você não tem acesso a este workspace");
  }

  const supabase = await createClient();

  // Atualizar o perfil do usuário com o workspace atual
  const { error } = await supabase
    .from("profiles")
    .update({ current_workspace_id: workspaceId })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating current workspace in profile:", error);
    throw new Error("Erro ao atualizar workspace atual");
  }
}

/**
 * Server Action para alternar workspace atual
 * Salva o workspace atual em um cookie
 */
export async function switchWorkspaceAction(
  workspaceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar autenticação e acesso ao workspace
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem acesso a este workspace",
      };
    }

    // Salvar workspace atual no perfil do usuário
    await setCurrentWorkspaceInProfile(workspaceId);

    // Revalidar paths críticos para garantir que layouts vejam a mudança
    revalidatePath("/", "layout");
    revalidatePath("/onboarding/workspace");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in switchWorkspaceAction:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao alternar o workspace",
    };
  }
}

/**
 * Server Action para obter o workspace atual do usuário
 * Busca do campo current_workspace_id no perfil do usuário
 */
export async function getCurrentWorkspaceAction(): Promise<Workspace | null> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Buscar o perfil do usuário para obter o current_workspace_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    const currentWorkspaceId = profile.current_workspace_id;

    // Se não há workspace atual salvo, buscar o primeiro disponível
    if (!currentWorkspaceId) {
      const workspaces = await getWorkspacesAction();
      if (workspaces.length > 0) {
        // Salvar o primeiro workspace como atual
        await setCurrentWorkspaceInProfile(workspaces[0].id);
        return workspaces[0];
      }
      return null;
    }

    // Verificar se o usuário tem acesso ao workspace
    const hasAccess = await hasWorkspaceAccess(currentWorkspaceId, user.id);
    if (!hasAccess) {
      // Se não tem acesso, buscar o primeiro disponível
      const workspaces = await getWorkspacesAction();
      if (workspaces.length > 0) {
        await setCurrentWorkspaceInProfile(workspaces[0].id);
        return workspaces[0];
      }
      // Limpar workspace atual se não tem acesso
      await supabase
        .from("profiles")
        .update({ current_workspace_id: null })
        .eq("id", user.id);
      return null;
    }

    // Buscar dados do workspace
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", currentWorkspaceId)
      .single();

    if (error || !workspace) {
      // Se workspace não existe, buscar o primeiro disponível
      const workspaces = await getWorkspacesAction();
      if (workspaces.length > 0) {
        await setCurrentWorkspaceInProfile(workspaces[0].id);
        return workspaces[0];
      }
      // Limpar workspace atual se não existe
      await supabase
        .from("profiles")
        .update({ current_workspace_id: null })
        .eq("id", user.id);
      return null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoUrl: workspace.logo_url || undefined,
      createdAt: new Date(workspace.created_at),
      ownerId: workspace.owner_id,
    };
  } catch (error) {
    console.error("Error in getCurrentWorkspaceAction:", error);
    return null;
  }
}

/**
 * Server Action para deletar workspace (apenas para owners)
 */
export async function deleteWorkspaceAction(
  workspaceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar autenticação
    const user = await requireAuth();
    const supabase = await createClient();

    // Verificar se o usuário é owner do workspace
    const isOwner = await isWorkspaceOwner(workspaceId, user.id);

    if (!isOwner) {
      return {
        success: false,
        error: "Apenas o dono do workspace pode deletá-lo",
      };
    }

    // Deletar workspace (os membros e dados relacionados serão deletados em cascata)
    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (error) {
      console.error("Error deleting workspace:", error);
      return {
        success: false,
        error: error.message || "Não foi possível deletar o workspace",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteWorkspaceAction:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        error: "Você precisa estar autenticado para deletar um workspace",
      };
    }
    return {
      success: false,
      error: "Ocorreu um erro ao deletar o workspace",
    };
  }
}

/**
 * Server Action para atualizar workspace (apenas para owners)
 */
export async function updateWorkspaceAction(
  workspaceId: string,
  input: UpdateWorkspaceInput,
): Promise<WorkspaceResult> {
  try {
    // Verificar autenticação
    const user = await requireAuth();
    const supabase = await createClient();

    // Verificar permissões: owner ou admin podem atualizar
    const canUpdate = await canUpdateWorkspace(workspaceId, user.id);

    if (!canUpdate) {
      return {
        success: false,
        error: "Você não tem permissão para atualizar este workspace",
      };
    }

    let logoUrl: string | undefined = undefined;

    // Se houver arquivo de logo, fazer upload
    if (input.logo) {
      // Validar tipo de arquivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(input.logo.type)) {
        return {
          success: false,
          error: "Tipo de arquivo inválido. Use JPG, PNG ou WEBP",
        };
      }

      // Validar tamanho (máximo 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (input.logo.size > maxSize) {
        return {
          success: false,
          error: "Arquivo muito grande. Tamanho máximo: 2MB",
        };
      }

      // Converter File para ArrayBuffer
      const arrayBuffer = await input.logo.arrayBuffer();
      const fileExt = input.logo.name.split(".").pop() || "webp";
      const fileName = `${workspaceId}/logo.${fileExt}`;

      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("workspace-logos")
        .upload(fileName, arrayBuffer, {
          contentType: input.logo.type,
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
      logoUrl = publicUrl;
    }

    // Atualizar workspace
    const updateData: {
      name: string;
      logo_url?: string;
    } = {
      name: input.name.trim(),
    };

    if (logoUrl) {
      updateData.logo_url = logoUrl;
    }

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .update(updateData)
      .eq("id", workspaceId)
      .select()
      .single();

    if (error || !workspace) {
      console.error("Error updating workspace:", error);
      return {
        success: false,
        error: error?.message || "Não foi possível atualizar o workspace",
      };
    }

    const result: Workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoUrl: workspace.logo_url || undefined,
      createdAt: new Date(workspace.created_at),
      ownerId: workspace.owner_id,
    };

    // Revalidar paths que mostram o workspace (sidebar, dashboard, etc)
    revalidatePath("/", "layout");
    revalidatePath("/configuracoes/workspace");
    revalidatePath("/pipeline");
    revalidatePath("/campanhas");

    return {
      success: true,
      workspace: result,
    };
  } catch (error) {
    console.error("Error in updateWorkspaceAction:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        error: "Você precisa estar autenticado para atualizar um workspace",
      };
    }
    return {
      success: false,
      error: "Ocorreu um erro ao atualizar o workspace",
    };
  }
}
