"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { User } from "@/shared/types/crm";
import type { Tables } from "@/shared/types/supabase";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    let authUser = null;
    
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      
      // Ignorar erro de refresh token inválido (comportamento esperado quando sessão expira)
      if (!authError) {
        authUser = user;
      }
    } catch (error: unknown) {
      // Ignorar erros de refresh token silenciosamente
      // O Supabase limpa os cookies automaticamente nesses casos
      return null;
    }

    if (!authUser) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    const fullName =
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name || profile.last_name || "";

    const avatarUrl = profile.avatar_url || "/fallback-avatar.webp";

    return {
      id: profile.id,
      email: authUser.email ?? "",
      fullName,
      avatarUrl,
      phone: profile.phone || undefined,
      bio: profile.bio || undefined,
      createdAt: new Date(profile.created_at),
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function hasWorkspaceAccess(
  workspaceId: string,
  userId?: string,
): Promise<boolean> {
  try {
    const user = userId ? { id: userId } : await requireAuth();
    const supabase = await createClient();

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .eq("owner_id", user.id)
      .single();

    if (workspace && !workspaceError) {
      return true;
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking workspace access:", error);
    return false;
  }
}

export async function getAuthenticatedClient() {
  const user = await requireAuth();
  return {
    client: await createClient(),
    user,
  };
}

/**
 * Verifica se o usuário é owner de um workspace
 */
export async function isWorkspaceOwner(
  workspaceId: string,
  userId?: string,
): Promise<boolean> {
  try {
    const user = userId ? { id: userId } : await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .eq("owner_id", user.id)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking workspace ownership:", error);
    return false;
  }
}

/**
 * Obtém o role do usuário em um workspace
 */
export async function getWorkspaceRole(
  workspaceId: string,
  userId?: string,
): Promise<"owner" | "admin" | "member" | null> {
  try {
    const user = userId ? { id: userId } : await requireAuth();
    const supabase = await createClient();

    const isOwner = await isWorkspaceOwner(workspaceId, user.id);
    if (isOwner) {
      return "owner";
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as "owner" | "admin" | "member";
  } catch (error) {
    console.error("Error getting workspace role:", error);
    return null;
  }
}

/**
 * Verifica se o usuário pode atualizar o workspace (owner ou admin)
 */
export async function canUpdateWorkspace(
  workspaceId: string,
  userId?: string,
): Promise<boolean> {
  try {
    const user = userId ? { id: userId } : await requireAuth();
    const role = await getWorkspaceRole(workspaceId, user.id);
    return role === "owner" || role === "admin";
  } catch (error) {
    console.error("Error checking can update workspace:", error);
    return false;
  }
}

/**
 * Verifica se o usuário pode gerenciar membros do workspace (owner ou admin)
 */
export async function canManageMembers(
  workspaceId: string,
  userId?: string,
): Promise<boolean> {
  try {
    const user = userId ? { id: userId } : await requireAuth();
    const role = await getWorkspaceRole(workspaceId, user.id);
    return role === "owner" || role === "admin";
  } catch (error) {
    console.error("Error checking can manage members:", error);
    return false;
  }
}

/**
 * Verifica se o usuário é admin do workspace (não owner)
 */
export async function isWorkspaceAdmin(
  workspaceId: string,
  userId?: string,
): Promise<boolean> {
  try {
    const user = userId ? { id: userId } : await requireAuth();
    const role = await getWorkspaceRole(workspaceId, user.id);
    return role === "admin";
  } catch (error) {
    console.error("Error checking is workspace admin:", error);
    return false;
  }
}