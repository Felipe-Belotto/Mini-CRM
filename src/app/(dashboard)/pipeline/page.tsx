import {
  moveLeadAction,
  updateLeadAction,
} from "@/features/leads/actions/leads";
import { PipelineUI } from "@/features/leads/components/PipelineUI";
import { mockLeads, mockCampaigns } from "@/shared/data/mockData";

export default async function PipelinePage() {
  const leads = mockLeads;
  const campaigns = mockCampaigns;

  return (
    <PipelineUI
      leads={leads}
      campaigns={campaigns}
      onUpdateLead={updateLeadAction}
      onMoveLead={moveLeadAction}
    />
  );
}
