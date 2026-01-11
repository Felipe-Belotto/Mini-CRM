import { redirect } from "next/navigation";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { getWorkspaceRole } from "@/shared/lib/supabase/utils";
import { WorkspaceMembersSection } from "@/features/workspaces/components/WorkspaceMembersSection";
import { EditWorkspaceForm } from "@/features/workspaces/components/EditWorkspaceForm";

export const dynamic = "force-dynamic";

export default async function EditarWorkspacePage() {
  
  const workspace = await getCurrentWorkspaceAction();

  if (!workspace) {
    redirect("/configuracoes/workspace");
  }

  const role = await getWorkspaceRole(workspace.id);
  const canManage = role === "owner" || role === "admin";

  return (
    <div className="space-y-8">
      <EditWorkspaceForm workspace={workspace} canEdit={canManage} />
      
      <div className="border-t pt-8">
        <WorkspaceMembersSection workspaceId={workspace.id} />
      </div>
    </div>
  );
}
