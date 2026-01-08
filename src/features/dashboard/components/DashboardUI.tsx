"use client";

import type React from "react";
import type { Campaign, Lead } from "@/shared/types/crm";
import { CampaignsOverview } from "./CampaignsOverview";
import { LeadsByStageChart } from "./LeadsByStageChart";
import { MetricsGrid } from "./MetricsGrid";

interface DashboardUIProps {
  leads: Lead[];
  campaigns: Campaign[];
}

export const DashboardUI: React.FC<DashboardUIProps> = ({
  leads,
  campaigns,
}) => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu pipeline de vendas
        </p>
      </div>

      <MetricsGrid leads={leads} campaigns={campaigns} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsByStageChart leads={leads} />
        <CampaignsOverview campaigns={campaigns} />
      </div>
    </div>
  );
};
