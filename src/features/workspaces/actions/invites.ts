"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from "@/shared/lib/supabase/server";
import {
  requireAuth,
  getWorkspaceRole,
  canManageMembers,
} from "@/shared/lib/supabase/utils";
import type { WorkspaceInvite, WorkspaceRole } from "@/shared/types/crm";

/**
 * Gera um token único para o convite
 */
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Cria um convite para o workspace
 */
export async function createWorkspaceInviteAction(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
): Promise<{ success: boolean; error?: string; inviteId?: string; token?: string }> {
  try {
    const user = await requireAuth();

    // Verificar permissões
    const canManage = await canManageMembers(workspaceId);
    if (!canManage) {
      return {
        success: false,
        error: "Você não tem permissão para criar convites",
      };
    }

    // Verificar se role é válido (owner não pode ser convidado)
    if (role === "owner") {
      return {
        success: false,
        error: "Não é possível convidar como owner. Use transferir ownership.",
      };
    }

    const supabase = await createClient();

    // Verificar se email já é membro
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return {
        success: false,
        error: "Workspace não encontrado",
      };
    }

    // Verificar se é owner (email pode não estar disponível, mas owner já é membro)
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", workspace.owner_id)
      .single();

    if (ownerProfile) {
      const { data: ownerAuth } = await supabase.auth.admin.getUserById(
        workspace.owner_id,
      );
      if (ownerAuth?.user?.email?.toLowerCase() === email.toLowerCase()) {
        return {
          success: false,
          error: "O owner já é membro do workspace",
        };
      }
    }

    // Verificar se já é membro
    // Buscar por email nos auth.users e verificar se está em workspace_members
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const targetUser = authUsers?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (targetUser) {
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", targetUser.id)
        .single();

      if (existingMember) {
        return {
          success: false,
          error: "Este usuário já é membro do workspace",
        };
      }
    }

    // Verificar se já existe convite pendente
    const { data: existingInvite } = await supabase
      .from("workspace_invites")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return {
        success: false,
        error: "Já existe um convite pendente para este email",
      };
    }

    // Gerar token único
    const token = generateInviteToken();

    // Criar convite com expires_at = 7 dias a partir de agora
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error: insertError } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase().trim(),
        role: role,
        invited_by: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError || !invite) {
      console.error("Error creating invite:", insertError);
      return {
        success: false,
        error: "Não foi possível criar o convite",
      };
    }

    // Buscar informações do workspace e do usuário que convidou para o email
    const { data: workspaceData } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();

    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const inviterName =
      inviterProfile?.first_name && inviterProfile?.last_name
        ? `${inviterProfile.first_name} ${inviterProfile.last_name}`
        : inviterProfile?.first_name || inviterProfile?.last_name || "Alguém";

    // Tentar enviar email via Edge Function se configurado
    // Por enquanto, apenas logar (email pode ser enviado via template do Supabase ou serviço externo)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const inviteUrl = `${siteUrl}/invites/accept/${token}`;

      // Se tiver SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY configurados, tentar chamar Edge Function
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) {
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-workspace-invite`;
        
        // Chamar Edge Function de forma assíncrona (não bloquear)
        fetch(edgeFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            workspaceId,
            email: email.toLowerCase().trim(),
            role,
            token,
            inviterName,
            workspaceName: workspaceData?.name || "Workspace",
          }),
        }).catch((error) => {
          console.error("Error calling email Edge Function:", error);
          // Não falhar o convite se email não puder ser enviado
        });
      }
    } catch (error) {
      console.error("Error sending invite email:", error);
      // Não falhar o convite se email não puder ser enviado
    }

    revalidatePath("/configuracoes/workspace");
    return {
      success: true,
      inviteId: invite.id,
      token: token,
    };
  } catch (error) {
    console.error("Error in createWorkspaceInviteAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao criar convite",
    };
  }
}

/**
 * Busca todos os convites pendentes do workspace
 */
export async function getWorkspaceInvitesAction(
  workspaceId: string,
): Promise<WorkspaceInvite[]> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Verificar permissões (apenas owner/admin podem ver convites)
    const canManage = await canManageMembers(workspaceId);
    if (!canManage) {
      return [];
    }

    // Buscar convites pendentes ou recentemente aceitos (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: invites, error } = await supabase
      .from("workspace_invites")
      .select(`
        id,
        workspace_id,
        email,
        role,
        token,
        status,
        expires_at,
        created_at,
        accepted_at,
        invited_by
      `)
      .eq("workspace_id", workspaceId)
      .in("status", ["pending", "accepted"])
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error && (error.message || error.code || error.hint)) {
      console.error("Error fetching workspace invites:", error);
      return [];
    }

    if (!invites || invites.length === 0) {
      return [];
    }

    // Buscar profiles dos que convidaram
    const inviterIds = [...new Set(invites.map((invite) => invite.invited_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", inviterIds);

    const profilesMap = new Map(
      profiles?.map((p) => [p.id, p]) || [],
    );

    // Buscar emails dos que convidaram via auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailsMap = new Map(
      authUsers?.users.map((u) => [u.id, u.email || ""]) || [],
    );

    // Montar resultado
    const result: WorkspaceInvite[] = [];

    for (const invite of invites) {
      const profile = profilesMap.get(invite.invited_by);
      if (!profile) continue;

      const email = emailsMap.get(invite.invited_by) || "";

      result.push({
        id: invite.id,
        workspaceId: invite.workspace_id,
        email: invite.email,
        role: invite.role as WorkspaceRole,
        invitedBy: {
          id: profile.id,
          fullName:
            profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.first_name || profile.last_name || "",
          email: email,
          avatarUrl: profile.avatar_url || undefined,
        },
        status: invite.status as "pending" | "accepted" | "expired" | "cancelled",
        token: invite.token,
        expiresAt: new Date(invite.expires_at),
        createdAt: new Date(invite.created_at),
        acceptedAt: invite.accepted_at ? new Date(invite.accepted_at) : undefined,
      });
    }

    return result;
  } catch (error) {
    console.error("Error in getWorkspaceInvitesAction:", error);
    return [];
  }
}

/**
 * Cancela um convite pendente
 */
export async function cancelWorkspaceInviteAction(
  inviteId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select("workspace_id, status")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return {
        success: false,
        error: "Convite não encontrado",
      };
    }

    // Verificar permissões
    const canManage = await canManageMembers(invite.workspace_id);
    if (!canManage) {
      return {
        success: false,
        error: "Você não tem permissão para cancelar este convite",
      };
    }

    // Verificar se está pendente
    if (invite.status !== "pending") {
      return {
        success: false,
        error: "Apenas convites pendentes podem ser cancelados",
      };
    }

    // Atualizar status para cancelled
    const { error: updateError } = await supabase
      .from("workspace_invites")
      .update({ status: "cancelled" })
      .eq("id", inviteId);

    if (updateError) {
      console.error("Error cancelling invite:", updateError);
      return {
        success: false,
        error: "Não foi possível cancelar o convite",
      };
    }

    revalidatePath("/configuracoes/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error in cancelWorkspaceInviteAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao cancelar convite",
    };
  }
}

/**
 * Busca convite por token (para página pública de aceitação)
 */
export async function getInviteByTokenAction(
  token: string,
): Promise<{ success: boolean; invite?: WorkspaceInvite; error?: string }> {
  try {
    const supabase = await createClient();

    // Buscar convite por token
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select(`
        id,
        workspace_id,
        email,
        role,
        token,
        status,
        expires_at,
        created_at,
        accepted_at,
        invited_by
      `)
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return {
        success: false,
        error: "Convite não encontrado ou inválido",
      };
    }

    // Verificar se expirou
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date() && invite.status === "pending") {
      // Marcar como expirado
      await supabase
        .from("workspace_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return {
        success: false,
        error: "Este convite expirou",
      };
    }

    // Buscar profile do que convidou
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", invite.invited_by)
      .single();

    // Buscar workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, name, logo_url, owner_id")
      .eq("id", invite.workspace_id)
      .single();

    // Buscar email do que convidou
    let inviterEmail = "";
    if (inviterProfile) {
      const { data: inviterAuth } = await supabase.auth.admin.getUserById(
        invite.invited_by,
      );
      inviterEmail = inviterAuth?.user?.email || "";
    }

    // Buscar quantidade de membros
    const { count: memberCount } = await supabase
      .from("workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", invite.workspace_id);

    const result: WorkspaceInvite = {
      id: invite.id,
      workspaceId: invite.workspace_id,
      email: invite.email,
      role: invite.role as WorkspaceRole,
      invitedBy: {
        id: inviterProfile?.id || "",
        fullName:
          inviterProfile?.first_name && inviterProfile?.last_name
            ? `${inviterProfile.first_name} ${inviterProfile.last_name}`
            : inviterProfile?.first_name || inviterProfile?.last_name || "",
        email: inviterEmail,
        avatarUrl: inviterProfile?.avatar_url || undefined,
      },
      status: invite.status as "pending" | "accepted" | "expired" | "cancelled",
      token: invite.token,
      expiresAt: new Date(invite.expires_at),
      createdAt: new Date(invite.created_at),
      acceptedAt: invite.accepted_at ? new Date(invite.accepted_at) : undefined,
    };

    // Adicionar informações extras para a UI
    (result as any).workspace = {
      id: workspace?.id,
      name: workspace?.name,
      logoUrl: workspace?.logo_url,
      memberCount: (memberCount || 0) + 1, // +1 para contar o owner
    };

    return {
      success: true,
      invite: result,
    };
  } catch (error) {
    console.error("Error in getInviteByTokenAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao buscar convite",
    };
  }
}

/**
 * Aceita um convite (adiciona usuário ao workspace)
 */
export async function acceptInviteAction(
  token: string,
): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select("id, workspace_id, email, role, status, expires_at")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return {
        success: false,
        error: "Convite não encontrado ou inválido",
      };
    }

    // Verificar se já foi aceito
    if (invite.status === "accepted") {
      return {
        success: false,
        error: "Este convite já foi aceito",
      };
    }

    // Verificar se foi cancelado ou expirou
    if (invite.status !== "pending") {
      return {
        success: false,
        error: "Este convite não está mais disponível",
      };
    }

    // Verificar se expirou
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      await supabase
        .from("workspace_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return {
        success: false,
        error: "Este convite expirou",
      };
    }

    // Verificar se email corresponde ao usuário autenticado
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.email) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    if (authUser.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return {
        success: false,
        error: "Este convite é para outro email",
      };
    }

    // Verificar se já é membro
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invite.workspace_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      // Já é membro, apenas marcar convite como aceito
      await supabase
        .from("workspace_invites")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      // Definir workspace como atual no perfil do usuário
      const { switchWorkspaceAction } = await import("./workspaces");
      const switchResult = await switchWorkspaceAction(invite.workspace_id);
      
      if (!switchResult.success) {
        console.error("Error setting workspace as current:", switchResult.error);
      }

      // Revalidar paths críticos para garantir que layouts vejam o novo workspace
      revalidatePath("/", "layout");
      revalidatePath("/onboarding/workspace");
      revalidatePath("/configuracoes/workspace");
      revalidatePath("/invites/accept");
      
      return {
        success: true,
        workspaceId: invite.workspace_id,
      };
    }

    // Adicionar ao workspace
    const { error: insertError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
      });

    if (insertError) {
      console.error("Error adding member to workspace:", insertError);
      return {
        success: false,
        error: "Não foi possível aceitar o convite",
      };
    }

    // Atualizar convite como aceito
    await supabase
      .from("workspace_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    // Definir workspace como atual no perfil do usuário
    // Importar função auxiliar de workspaces.ts
    const { switchWorkspaceAction } = await import("./workspaces");
    const switchResult = await switchWorkspaceAction(invite.workspace_id);
    
    // Se não conseguiu definir como atual, não falhar o convite (já foi aceito)
    // apenas logar o erro
    if (!switchResult.success) {
      console.error("Error setting workspace as current:", switchResult.error);
    }

    // Revalidar paths críticos para garantir que layouts vejam o novo workspace
    revalidatePath("/", "layout");
    revalidatePath("/onboarding/workspace");
    revalidatePath("/configuracoes/workspace");
    revalidatePath("/invites/accept");
    return {
      success: true,
      workspaceId: invite.workspace_id,
    };
  } catch (error) {
    console.error("Error in acceptInviteAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao aceitar convite",
    };
  }
}

/**
 * Busca convites pendentes para o usuário atual
 */
export async function checkPendingInvitesAction(): Promise<WorkspaceInvite[]> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.email) {
      return [];
    }

    const userEmail = authUser.user.email.toLowerCase();

    const { data: invites, error } = await supabase
      .from("workspace_invites")
      .select(`
        id,
        workspace_id,
        email,
        role,
        token,
        status,
        expires_at,
        created_at,
        invited_by
      `)
      .eq("email", userEmail)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error && (error.message || error.code || error.hint)) {
      console.error("Error checking pending invites:", error);
      return [];
    }

    if (!invites || invites.length === 0) {
      return [];
    }

    const workspaceIds = invites.map((invite) => invite.workspace_id);
    const { data: existingMemberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .in("workspace_id", workspaceIds);

    const memberWorkspaceIds = new Set(
      existingMemberships?.map((m) => m.workspace_id) || [],
    );

    const validInvites = invites.filter(
      (invite) => !memberWorkspaceIds.has(invite.workspace_id),
    );

    if (validInvites.length === 0) {
      return [];
    }

    const inviterIds = [...new Set(validInvites.map((invite) => invite.invited_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", inviterIds);

    const profilesMap = new Map(
      profiles?.map((p) => [p.id, p]) || [],
    );

    // Buscar emails dos que convidaram via auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailsMap = new Map(
      authUsers?.users.map((u) => [u.id, u.email || ""]) || [],
    );

    const result: WorkspaceInvite[] = [];

    for (const invite of validInvites) {
      const profile = profilesMap.get(invite.invited_by);
      if (!profile) continue;

      const email = emailsMap.get(invite.invited_by) || "";

      result.push({
        id: invite.id,
        workspaceId: invite.workspace_id,
        email: invite.email,
        role: invite.role as WorkspaceRole,
        invitedBy: {
          id: profile.id,
          fullName:
            profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.first_name || profile.last_name || "",
          email: email,
          avatarUrl: profile.avatar_url || undefined,
        },
        status: "pending",
        token: invite.token,
        expiresAt: new Date(invite.expires_at),
        createdAt: new Date(invite.created_at),
      });
    }

    return result;
  } catch (error) {
    console.error("Error in checkPendingInvitesAction:", error);
    return [];
  }
}

export async function rejectInviteAction(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select("id, email, status")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return {
        success: false,
        error: "Convite não encontrado ou inválido",
      };
    }

    if (invite.status !== "pending") {
      return {
        success: false,
        error: "Este convite não está mais disponível",
      };
    }

    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.email) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    if (authUser.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return {
        success: false,
        error: "Este convite é para outro email",
      };
    }

    const { error: updateError } = await supabase
      .from("workspace_invites")
      .update({ status: "cancelled" })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Error rejecting invite:", updateError);
      return {
        success: false,
        error: "Não foi possível recusar o convite",
      };
    }

    revalidatePath("/invites/accept");
    revalidatePath("/invites/pending");
    return { success: true };
  } catch (error) {
    console.error("Error in rejectInviteAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao recusar convite",
    };
  }
}
