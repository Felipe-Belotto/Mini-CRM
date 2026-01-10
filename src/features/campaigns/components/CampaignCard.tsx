"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { Campaign } from "@/shared/types/crm";
import { getCampaignStatusColorClass } from "../lib/campaign-utils";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card className="metric-card hover:border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">
            {campaign.name}
          </CardTitle>
          <Badge
            variant="outline"
            className={getCampaignStatusColorClass(campaign.status)}
          >
            {campaign.status === "active" ? "Ativa" : campaign.status === "paused" ? "Pausada" : "Finalizada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {campaign.context}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Tom:{" "}
            <span className="font-medium text-foreground capitalize">
              {campaign.voiceTone}
            </span>
          </span>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {campaign.leadsCount}
            </span>{" "}
            leads
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
