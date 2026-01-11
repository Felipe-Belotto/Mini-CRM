import { addCampaignFromFormAction } from "@/features/campaigns/actions/campaigns";
import { CampaignsUI } from "@/features/campaigns/components/CampaignsUI";
import { getCurrentWorkspaceCampaignsAction } from "@/features/dashboard/actions/dashboard";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampanhasPage() {
  const workspace = await getCurrentWorkspaceAction();
  
  if (!workspace) {
    redirect("/onboarding/workspace");
  }

  const campaigns = await getCurrentWorkspaceCampaignsAction(workspace.id);

  return (
    <CampaignsUI campaigns={campaigns} onAddCampaign={addCampaignFromFormAction} />
  );
}
