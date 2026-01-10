import { getWorkspaceMembersAction, canManageWorkspaceAction } from "@/features/workspaces/actions/members";
import { getWorkspaceInvitesAction } from "@/features/workspaces/actions/invites";
import { getCurrentUserIdAction } from "@/features/auth/actions/auth";
import { WorkspaceMembersManagerClient } from "./WorkspaceMembersManagerClient";

interface WorkspaceMembersSectionProps {
  workspaceId: string;
}

export async function WorkspaceMembersSection({
  workspaceId,
}: WorkspaceMembersSectionProps) {
  // Carregar dados server-side
  const [members, invites, permissions, currentUserId] = await Promise.all([
    getWorkspaceMembersAction(workspaceId),
    getWorkspaceInvitesAction(workspaceId),
    canManageWorkspaceAction(workspaceId),
    getCurrentUserIdAction(),
  ]);

  return (
    <WorkspaceMembersManagerClient
      workspaceId={workspaceId}
      initialMembers={members}
      initialInvites={invites}
      canManage={permissions.canManage}
      currentUserRole={permissions.role}
      isOwner={permissions.role === "owner"}
      currentUserId={currentUserId || ""}
    />
  );
}
