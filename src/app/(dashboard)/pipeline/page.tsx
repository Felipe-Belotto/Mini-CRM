import { redirect } from "next/navigation";
import {
  getCurrentWorkspaceArchivedLeadsAction,
  getCurrentWorkspaceCampaignsAction,
  getCurrentWorkspaceCustomFieldsAction,
  getCurrentWorkspaceLeadsAction,
  getCurrentWorkspaceUsersAction,
} from "@/features/dashboard/actions/dashboard";
import { updateLeadAction } from "@/features/leads/actions/leads";
import { PipelineUI } from "@/features/leads/components/PipelineUI";
import { getVisiblePipelineStagesAction } from "@/features/pipeline-config/actions/stages";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const currentWorkspace = await getCurrentWorkspaceAction();

  if (!currentWorkspace) {
    redirect("/onboarding/workspace");
  }

 
  const [leads, archivedLeads, campaigns, users, customFields, stages] =
    await Promise.all([
      getCurrentWorkspaceLeadsAction(currentWorkspace.id),
      getCurrentWorkspaceArchivedLeadsAction(currentWorkspace.id),
      getCurrentWorkspaceCampaignsAction(currentWorkspace.id),
      getCurrentWorkspaceUsersAction(currentWorkspace.id),
      getCurrentWorkspaceCustomFieldsAction(currentWorkspace.id),
      getVisiblePipelineStagesAction(currentWorkspace.id),
    ]);

  return (
    <PipelineUI
      leads={leads}
      archivedLeads={archivedLeads}
      campaigns={campaigns}
      users={users}
      customFields={customFields}
      stages={stages}
      onUpdateLead={updateLeadAction}
    />
  );
}
