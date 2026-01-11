import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import type { Workspace } from "@/shared/types/crm";

export async function getCurrentWorkspace(): Promise<Workspace | null> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError.message || profileError.code || profileError);
      }
      return null;
    }

    const currentWorkspaceId = profile.current_workspace_id;

    if (!currentWorkspaceId) {
      const workspaces = await getWorkspaces(user.id, supabase);
      if (workspaces.length > 0) {
        await setCurrentWorkspaceInProfile(workspaces[0].id, user.id, supabase);
        return workspaces[0];
      }
      return null;
    }

    const hasAccess = await hasWorkspaceAccess(currentWorkspaceId, user.id);
    if (!hasAccess) {
      const workspaces = await getWorkspaces(user.id, supabase);
      if (workspaces.length > 0) {
        await setCurrentWorkspaceInProfile(workspaces[0].id, user.id, supabase);
        return workspaces[0];
      }
      await supabase
        .from("profiles")
        .update({ current_workspace_id: null })
        .eq("id", user.id);
      return null;
    }

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", currentWorkspaceId)
      .single();

    if (error || !workspace) {
      const workspaces = await getWorkspaces(user.id, supabase);
      if (workspaces.length > 0) {
        await setCurrentWorkspaceInProfile(workspaces[0].id, user.id, supabase);
        return workspaces[0];
      }
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
    console.error("Error in getCurrentWorkspace:", error);
    return null;
  }
}

async function getWorkspaces(userId: string, supabase: any): Promise<Workspace[]> {
  const { data: ownedWorkspaces } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId);

  const { data: memberWorkspaces } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  let memberWorkspaceIds: string[] = [];
  if (memberWorkspaces && memberWorkspaces.length > 0) {
    memberWorkspaceIds = memberWorkspaces.map((m: any) => m.workspace_id);
  }

  let memberWorkspaceData = null;
  if (memberWorkspaceIds.length > 0) {
    const { data } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", memberWorkspaceIds);
    memberWorkspaceData = data;
  }

  const allWorkspaces = [
    ...(ownedWorkspaces || []),
    ...(memberWorkspaceData || []),
  ];

  const uniqueWorkspaces = Array.from(
    new Map(allWorkspaces.map((w: any) => [w.id, w])).values(),
  );

  uniqueWorkspaces.sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return uniqueWorkspaces.map((w: any) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    logoUrl: w.logo_url || undefined,
    createdAt: new Date(w.created_at),
    ownerId: w.owner_id,
  }));
}

async function setCurrentWorkspaceInProfile(
  workspaceId: string,
  userId: string,
  supabase: any,
): Promise<void> {
  const hasAccess = await hasWorkspaceAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new Error("Você não tem acesso a este workspace");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ current_workspace_id: workspaceId })
    .eq("id", userId);

  if (error) {
    console.error("Error updating current workspace in profile:", error);
    throw new Error("Erro ao atualizar workspace atual");
  }
}