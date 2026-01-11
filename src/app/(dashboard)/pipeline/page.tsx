import {
  getCurrentWorkspaceArchivedLeadsAction,
  getCurrentWorkspaceCampaignsAction,
  getCurrentWorkspaceCustomFieldsAction,
  getCurrentWorkspaceLeadsAction,
  getCurrentWorkspaceUsersAction,
} from "@/features/dashboard/actions/dashboard";
import { updateLeadAction } from "@/features/leads/actions/leads";
import { PipelineUI } from "@/features/leads/components/PipelineUI";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [leads, archivedLeads, campaigns, users, customFields] = await Promise.all([
    getCurrentWorkspaceLeadsAction(),
    getCurrentWorkspaceArchivedLeadsAction(),
    getCurrentWorkspaceCampaignsAction(),
    getCurrentWorkspaceUsersAction(),
    getCurrentWorkspaceCustomFieldsAction(),
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
