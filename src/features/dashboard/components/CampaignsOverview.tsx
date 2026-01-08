"use client";

import type React from "react";
import {
  getCampaignStatusColorClass,
  getCampaignsByStatus,
} from "@/features/campaigns/lib/campaign-utils";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { Campaign } from "@/shared/types/crm";

interface CampaignsOverviewProps {
  campaigns: Campaign[];
}

export const CampaignsOverview: React.FC<CampaignsOverviewProps> = ({
  campaigns,
}) => {
  const activeCampaigns = getCampaignsByStatus(campaigns, "ativa");

  return (
    <Card className="metric-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Campanhas Ativas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma campanha ativa
            </p>
          ) : (
            activeCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{campaign.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.leadsCount} leads
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={getCampaignStatusColorClass(campaign.status)}
                >
                  {campaign.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
