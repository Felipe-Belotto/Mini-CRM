import {
  moveLeadAction,
  updateLeadAction,
} from "@/features/leads/actions/leads";
import { PipelineUI } from "@/features/leads/components/PipelineUI";
import { mockLeads } from "@/shared/data/mockData";

export default async function PipelinePage() {
  const leads = mockLeads;

  return (
    <PipelineUI
      leads={leads}
      onUpdateLead={updateLeadAction}
      onMoveLead={moveLeadAction}
    />
  );
}
