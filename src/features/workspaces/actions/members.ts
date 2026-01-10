"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import {
  requireAuth,
  getWorkspaceRole,
  isWorkspaceOwner,
  canManageMembers,
} from "@/shared/lib/supabase/utils";
import type { WorkspaceMember, WorkspaceRole } from "@/shared/types/crm";

/**
 * Busca todos os membros do workspace com informações do usuário
 */
export async function getWorkspaceMembersAction(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Verificar se tem acesso ao workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return [];
    }

    // Buscar owner primeiro
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", workspace.owner_id)
      .single();

    const ownerMember: WorkspaceMember | null = ownerProfile
      ? {
          id: `owner-${workspace.owner_id}`,
          workspaceId,
          userId: workspace.owner_id,
          role: "owner",
          user: {
            id: ownerProfile.id,
            email: "", // Será preenchido abaixo
            fullName:
              ownerProfile.first_name && ownerProfile.last_name
                ? `${ownerProfile.first_name} ${ownerProfile.last_name}`
                : ownerProfile.first_name || ownerProfile.last_name || "",
            avatarUrl: ownerProfile.avatar_url || undefined,
          },
          createdAt: new Date(),
        }
      : null;

    // Buscar email do owner (será feito junto com os outros membros abaixo)

    // Buscar membros da tabela workspace_members
    const { data: members, error } = await supabase
      .from("workspace_members")
      .select(`
        id,
        user_id,
        role,
        created_at
      `)
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("Error fetching workspace members:", error);
      return ownerMember ? [ownerMember] : [];
    }


    // Buscar todos os profiles de uma vez usando IN (evita N+1)
    const memberIds = (members || [])
      .filter((m) => m.user_id !== workspace.owner_id)
      .map((m) => m.user_id);

    let profilesMap = new Map<string, { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null }>();

    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", memberIds);

      if (profiles) {
        profilesMap = new Map(
          profiles.map((p) => [p.id, p])
        );
      }
    }

    // Buscar emails apenas dos membros necessários (mais eficiente que listUsers)
    // Incluir owner também na lista de IDs para buscar email
    const allUserIds = ownerMember 
      ? [workspace.owner_id, ...memberIds]
      : memberIds;
    
    const memberEmailsMap = new Map<string, string>();
    
    if (allUserIds.length > 0) {
      // Buscar emails em lotes (Supabase admin API tem limite de rate)
      const batchSize = 10;
      for (let i = 0; i < allUserIds.length; i += batchSize) {
        const batch = allUserIds.slice(i, i + batchSize);
        const emailPromises = batch.map(async (id) => {
          try {
            const { data } = await supabase.auth.admin.getUserById(id);
            return { id, email: data?.user?.email || "" };
          } catch {
            return { id, email: "" };
          }
        });
        const emailResults = await Promise.all(emailPromises);
        emailResults.forEach(({ id, email }) => {
          if (email) {
            memberEmailsMap.set(id, email);
          }
        });
      }
    }

    // Preencher email do owner
    if (ownerMember) {
      const ownerEmail = memberEmailsMap.get(workspace.owner_id);
      if (ownerEmail) {
        ownerMember.user.email = ownerEmail;
      }
    }

    // Construir lista de membros usando os dados já buscados
    const memberList: WorkspaceMember[] = [];

    for (const member of members || []) {
      // Pular se for o owner (já foi adicionado separadamente)
      if (member.user_id === workspace.owner_id) {
        continue;
      }

      const profile = profilesMap.get(member.user_id);
      if (!profile) continue;

      // Buscar email do mapa
      const email = memberEmailsMap.get(member.user_id) || "";

      memberList.push({
        id: member.id,
        workspaceId,
        userId: member.user_id,
        role: member.role as WorkspaceRole,
        user: {
          id: profile.id,
          email: email,
          fullName:
            profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.first_name || profile.last_name || "",
          avatarUrl: profile.avatar_url || undefined,
        },
        createdAt: new Date(member.created_at),
      });
    }

    // Combinar owner e membros, ordenando por role (owner primeiro), depois por nome
    const allMembers = ownerMember ? [ownerMember, ...memberList] : memberList;

    // Ordenar: owner primeiro, depois admin, depois member, depois por nome
    allMembers.sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, member: 2 };
      const roleDiff = roleOrder[a.role] - roleOrder[b.role];
      if (roleDiff !== 0) return roleDiff;
      return a.user.fullName.localeCompare(b.user.fullName);
    });

    return allMembers;
  } catch (error) {
    console.error("Error in getWorkspaceMembersAction:", error);
    return [];
  }
}

/**
 * Adiciona um membro ao workspace ou cria convite se usuário não existe
 */
export async function addWorkspaceMemberAction(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
): Promise<{ success: boolean; error?: string; inviteId?: string }> {
  try {
    const user = await requireAuth();

    // Verificar permissões
    const canManage = await canManageMembers(workspaceId);
    if (!canManage) {
      return {
        success: false,
        error: "Você não tem permissão para adicionar membros",
      };
    }

    // Verificar se role é válido (owner não pode ser convidado)
    if (role === "owner") {
      return {
        success: false,
        error: "Não é possível adicionar owner diretamente. Use transferir ownership.",
      };
    }

    const supabase = await createClient();

    // Verificar se email já é membro
    const existingMembers = await getWorkspaceMembersAction(workspaceId);
    const isAlreadyMember = existingMembers.some(
      (m) => m.user.email.toLowerCase() === email.toLowerCase(),
    );

    if (isAlreadyMember) {
      return {
        success: false,
        error: "Este usuário já é membro do workspace",
      };
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

    // Tentar encontrar usuário por email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const targetUser = authUsers?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (targetUser) {
      // Usuário existe: adicionar direto
      const { error: insertError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: targetUser.id,
          role: role,
        });

      if (insertError) {
        console.error("Error adding workspace member:", insertError);
        return {
          success: false,
          error: "Não foi possível adicionar o membro ao workspace",
        };
      }

      revalidatePath("/configuracoes/workspace");
      return { success: true };
    } else {
      // Usuário não existe: criar convite (será feito pela action de invites)
      return {
        success: false,
        error: "Usuário não encontrado. Use a ação de criar convite.",
      };
    }
  } catch (error) {
    console.error("Error in addWorkspaceMemberAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao adicionar membro",
    };
  }
}

/**
 * Atualiza o role de um membro
 */
export async function updateMemberRoleAction(
  workspaceId: string,
  userId: string,
  newRole: WorkspaceRole,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Consolidar queries: buscar workspace e verificar permissões em paralelo
    const [{ data: workspace }, { data: userMember }, { data: workspaceCheck }] =
      await Promise.all([
        supabase
          .from("workspaces")
          .select("owner_id")
          .eq("id", workspaceId)
          .single(),
        supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspaceId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("workspaces")
          .select("owner_id")
          .eq("id", workspaceId)
          .eq("owner_id", user.id)
          .maybeSingle(),
      ]);

    if (!workspace) {
      return {
        success: false,
        error: "Workspace não encontrado",
      };
    }

    // Verificar permissões em memória
    const userRole = workspaceCheck ? ("owner" as const) : (userMember?.role as WorkspaceRole | undefined);
    const canManage = userRole === "owner" || userRole === "admin";

    if (!canManage) {
      return {
        success: false,
        error: "Você não tem permissão para atualizar roles",
      };
    }

    // Verificar se não está tentando mudar role de owner
    const isTargetOwner = workspace.owner_id === userId;
    if (isTargetOwner) {
      return {
        success: false,
        error:
          "Não é possível alterar o role do owner. Use transferir ownership.",
      };
    }

    // Verificar se admin está tentando adicionar owner (não permitido)
    if (userRole === "admin" && newRole === "owner") {
      return {
        success: false,
        error: "Apenas owners podem definir role como owner",
      };
    }

    // Atualizar role
    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating member role:", error);
      return {
        success: false,
        error: "Não foi possível atualizar o role do membro",
      };
    }

    revalidatePath("/configuracoes/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error in updateMemberRoleAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao atualizar role",
    };
  }
}

/**
 * Remove um membro do workspace
 */
export async function removeWorkspaceMemberAction(
  workspaceId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    // Verificar permissões
    const canManage = await canManageMembers(workspaceId);
    if (!canManage) {
      return {
        success: false,
        error: "Você não tem permissão para remover membros",
      };
    }

    // Verificar se não está tentando remover owner
    const isOwner = await isWorkspaceOwner(workspaceId, userId);
    if (isOwner) {
      return {
        success: false,
        error: "Não é possível remover o owner. Use transferir ownership.",
      };
    }

    const supabase = await createClient();

    // Remover membro
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing workspace member:", error);
      return {
        success: false,
        error: "Não foi possível remover o membro",
      };
    }

    revalidatePath("/configuracoes/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error in removeWorkspaceMemberAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao remover membro",
    };
  }
}

/**
 * Transfere a ownership do workspace
 */
export async function transferWorkspaceOwnershipAction(
  workspaceId: string,
  newOwnerId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    // Apenas owner atual pode transferir
    const isOwner = await isWorkspaceOwner(workspaceId);
    if (!isOwner) {
      return {
        success: false,
        error: "Apenas o owner pode transferir a ownership",
      };
    }

    const supabase = await createClient();

    // Buscar workspace atual
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

    const oldOwnerId = workspace.owner_id;

    // Se o novo owner é o mesmo, não fazer nada
    if (oldOwnerId === newOwnerId) {
      return {
        success: false,
        error: "O novo owner é o mesmo que o atual",
      };
    }

    // Verificar se novo owner tem acesso ao workspace
    const { data: memberCheck } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", newOwnerId)
      .single();

    // Se não for membro, adicionar como admin primeiro (será atualizado para owner depois)
    if (!memberCheck) {
      const { error: insertError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: newOwnerId,
          role: "admin",
        });

      if (insertError) {
        console.error("Error adding new owner as member:", insertError);
      }
    }

    // Atualizar owner_id na tabela workspaces
    const { error: updateError } = await supabase
      .from("workspaces")
      .update({ owner_id: newOwnerId })
      .eq("id", workspaceId);

    if (updateError) {
      console.error("Error transferring ownership:", updateError);
      return {
        success: false,
        error: "Não foi possível transferir a ownership",
      };
    }

    // Se antigo owner estava em workspace_members, atualizar para admin
    // Se não estava, adicionar como admin
    const { data: oldMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", oldOwnerId)
      .single();

    if (oldMember) {
      // Atualizar role para admin
      await supabase
        .from("workspace_members")
        .update({ role: "admin" })
        .eq("id", oldMember.id);
    } else {
      // Adicionar antigo owner como admin
      await supabase.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: oldOwnerId,
        role: "admin",
      });
    }

    // Atualizar novo owner para admin se já existir (para garantir que está na tabela)
    // Na verdade, o novo owner agora é owner direto, não precisa estar na tabela
    // Mas vamos garantir que está lá se já estava
    if (memberCheck) {
      await supabase
        .from("workspace_members")
        .update({ role: "admin" }) // Role na tabela não importa para owner direto
        .eq("workspace_id", workspaceId)
        .eq("user_id", newOwnerId);
    }

    revalidatePath("/configuracoes/workspace");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error in transferWorkspaceOwnershipAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao transferir ownership",
    };
  }
}

/**
 * Verifica se o usuário pode gerenciar o workspace
 */
export async function canManageWorkspaceAction(
  workspaceId: string,
): Promise<{ canManage: boolean; role: WorkspaceRole | null }> {
  try {
    const role = await getWorkspaceRole(workspaceId);
    return {
      canManage: role === "owner" || role === "admin",
      role,
    };
  } catch (error) {
    console.error("Error in canManageWorkspaceAction:", error);
    return { canManage: false, role: null };
  }
}
