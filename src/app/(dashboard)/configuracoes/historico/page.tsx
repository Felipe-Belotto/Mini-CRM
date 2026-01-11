import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { canUpdateWorkspace } from "@/shared/lib/supabase/utils";
import { getRecentWorkspaceActivitiesAction } from "@/features/activities/actions/activities";
import { WorkspaceActivityHistory } from "@/features/activities/components/WorkspaceActivityHistory";

export default async function HistoricoPage() {
  // Força renderização dinâmica pois usa cookies
  await connection();

  const workspace = await getCurrentWorkspaceAction();

  if (!workspace) {
    redirect("/configuracoes");
  }

  // Verificar se o usuário tem permissão (admin ou owner)
  const hasPermission = await canUpdateWorkspace(workspace.id);

  if (!hasPermission) {
    redirect("/configuracoes/perfil");
  }

  // Buscar atividades no servidor
  const initialActivities = await getRecentWorkspaceActivitiesAction(workspace.id, 50);

  return (
    <WorkspaceActivityHistory
      workspaceId={workspace.id}
      initialActivities={initialActivities}
    />
  );
}
