import { addCampaignAction } from "@/features/campaigns/actions/campaigns";
import { CampaignsUI } from "@/features/campaigns/components/CampaignsUI";
import { mockCampaigns } from "@/shared/data/mockData";

export default async function CampanhasPage() {
  const campaigns = mockCampaigns;

  return (
    <CampaignsUI campaigns={campaigns} onAddCampaign={addCampaignAction} />
  );
}
