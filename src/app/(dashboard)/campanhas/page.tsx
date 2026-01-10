import { addCampaignFromFormAction } from "@/features/campaigns/actions/campaigns";
import { CampaignsUI } from "@/features/campaigns/components/CampaignsUI";
import { getCurrentWorkspaceCampaignsAction } from "@/features/dashboard/actions/dashboard";

export default async function CampanhasPage() {
  const campaigns = await getCurrentWorkspaceCampaignsAction();

  return (
    <CampaignsUI campaigns={campaigns} onAddCampaign={addCampaignFromFormAction} />
  );
}
