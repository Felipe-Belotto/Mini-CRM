"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
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
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
}

export function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  return (
    <Card className="metric-card hover:border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold flex-1">
            {campaign.name}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={getCampaignStatusColorClass(campaign.status)}
            >
              {campaign.status === "active" ? "Ativa" : campaign.status === "paused" ? "Pausada" : "Finalizada"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(campaign)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(campaign)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
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
