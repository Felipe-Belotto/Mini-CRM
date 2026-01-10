import {
  moveLeadAction,
  updateLeadAction,
} from "@/features/leads/actions/leads";
import { PipelineUI } from "@/features/leads/components/PipelineUI";
import {
  getCurrentWorkspaceLeadsAction,
  getCurrentWorkspaceCampaignsAction,
  getCurrentWorkspaceUsersAction,
} from "@/features/dashboard/actions/dashboard";

export default async function PipelinePage() {
  const [leads, campaigns, users] = await Promise.all([
    getCurrentWorkspaceLeadsAction(),
    getCurrentWorkspaceCampaignsAction(),
    getCurrentWorkspaceUsersAction(),
  ]);

  return (
    <PipelineUI
      leads={leads}
      campaigns={campaigns}
      users={users}
      onUpdateLead={updateLeadAction}
      onMoveLead={moveLeadAction}
    />
  );
}
