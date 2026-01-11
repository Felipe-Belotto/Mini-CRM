"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import type { Campaign, Lead } from "@/shared/types/crm";
import type {
  ConversionRate,
  LeadsByPeriod,
  PerformanceByUser,
  TimeByStage,
} from "../actions/metrics";
import { CampaignsOverview } from "./CampaignsOverview";
import { ConversionFunnel } from "./ConversionFunnel";
import { LeadsByStageChart } from "./LeadsByStageChart";
import { LeadsOverTime } from "./LeadsOverTime";
import { MetricsGrid } from "./MetricsGrid";
import { PerformanceByUserChart } from "./PerformanceByUserChart";
import { TimeByStageChart } from "./TimeByStageChart";

interface DashboardUIProps {
  leads: Lead[];
  campaigns: Campaign[];
  advancedMetrics?: {
    conversionRates: ConversionRate[];
    leadsByPeriod: LeadsByPeriod[];
    timeByStage: TimeByStage[];
    performanceByUser: PerformanceByUser[];
  };
}

export const DashboardUI: React.FC<DashboardUIProps> = ({
  leads,
  campaigns,
  advancedMetrics,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

      {/* Métricas Avançadas */}
      {advancedMetrics && (
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Métricas Avançadas</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Expandir
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConversionFunnel data={advancedMetrics.conversionRates} />
              <LeadsOverTime data={advancedMetrics.leadsByPeriod} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeByStageChart data={advancedMetrics.timeByStage} />
              <PerformanceByUserChart data={advancedMetrics.performanceByUser} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
