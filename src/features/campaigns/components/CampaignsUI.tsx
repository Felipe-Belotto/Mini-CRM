"use client";

import type React from "react";
import type { Campaign } from "@/shared/types/crm";
import type { CampaignFormData } from "../lib/campaign-utils";
import { CampaignManager } from "./CampaignManager";

interface CampaignsUIProps {
  campaigns: Campaign[];
  onAddCampaign: (campaign: CampaignFormData) => Promise<void>;
}

export const CampaignsUI: React.FC<CampaignsUIProps> = ({
  campaigns,
  onAddCampaign,
}) => {
  return (
    <div className="p-6">
      <CampaignManager campaigns={campaigns} onAddCampaign={onAddCampaign} />
    </div>
  );
};
