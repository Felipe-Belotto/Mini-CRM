"use client";

import {
  ArrowUpRight,
  Calendar,
  Megaphone,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getLeadsCountByStage } from "@/shared/data/mockData";
import { cn } from "@/shared/lib/utils";
import type { Campaign, Lead } from "@/shared/types/crm";
import {
  calculateQualifiedLeads,
  getActiveCampaignsCount,
} from "../lib/metrics-utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
}) => (
  <Card className={cn("metric-card", className)}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 text-sm mt-1",
            trendUp ? "text-success" : "text-destructive",
          )}
        >
          <ArrowUpRight className={cn("h-4 w-4", !trendUp && "rotate-90")} />
          {trend}
        </div>
      )}
    </CardContent>
  </Card>
);

interface MetricsGridProps {
  leads: Lead[];
  campaigns: Campaign[];
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  leads,
  campaigns,
}) => {
  const stageCounts = getLeadsCountByStage(leads);
  const activeCampaigns = getActiveCampaignsCount(campaigns);
  const qualifiedLeads = calculateQualifiedLeads(leads);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total de Leads"
        value={leads.length}
        icon={Users}
        trend="+12% este mês"
        trendUp={true}
      />
      <MetricCard
        title="Leads Qualificados"
        value={qualifiedLeads}
        icon={Target}
        trend="+8% vs semana passada"
        trendUp={true}
      />
      <MetricCard
        title="Campanhas Ativas"
        value={activeCampaigns}
        icon={Megaphone}
      />
      <MetricCard
        title="Reuniões Agendadas"
        value={stageCounts.reuniao_agendada}
        icon={Calendar}
        trend="+3 esta semana"
        trendUp={true}
      />
    </div>
  );
};
