import {
  getCurrentWorkspaceArchivedLeadsAction,
  getCurrentWorkspaceCampaignsAction,
  getCurrentWorkspaceCustomFieldsAction,
  getCurrentWorkspaceLeadsAction,
  getCurrentWorkspaceUsersAction,
} from "@/features/dashboard/actions/dashboard";
import { updateLeadAction } from "@/features/leads/actions/leads";
import { PipelineUI } from "@/features/leads/components/PipelineUI";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  // Verificar workspace uma vez para evitar múltiplas verificações
  const currentWorkspace = await getCurrentWorkspaceAction();
  
  if (!currentWorkspace) {
    redirect("/onboarding/workspace");
  }

  // Passar workspaceId para todas as funções para evitar verificações redundantes
  const [leads, archivedLeads, campaigns, users, customFields] = await Promise.all([
    getCurrentWorkspaceLeadsAction(currentWorkspace.id),
    getCurrentWorkspaceArchivedLeadsAction(currentWorkspace.id),
    getCurrentWorkspaceCampaignsAction(currentWorkspace.id),
    getCurrentWorkspaceUsersAction(currentWorkspace.id),
    getCurrentWorkspaceCustomFieldsAction(currentWorkspace.id),
  ]);

  return (
    <PipelineUI
      leads={leads}
      archivedLeads={archivedLeads}
      campaigns={campaigns}
      users={users}
      customFields={customFields}
      onUpdateLead={updateLeadAction}
    />
  );
}
