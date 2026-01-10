"use client";

import type React from "react";
import { getKanbanBgColorClass } from "@/features/leads/lib/kanban-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { KANBAN_COLUMNS, type Lead } from "@/shared/types/crm";
import { getLeadsCountByStage } from "../lib/metrics-utils";

interface LeadsByStageChartProps {
  leads: Lead[];
}

export const LeadsByStageChart: React.FC<LeadsByStageChartProps> = ({
  leads,
}) => {
  const stageCounts = getLeadsCountByStage(leads);
  const maxCount = Math.max(...Object.values(stageCounts), 1);

  return (
    <Card className="metric-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Leads por Etapa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {KANBAN_COLUMNS.map((column) => {
            const count = stageCounts[column.id];
            const percentage = (count / maxCount) * 100;

            return (
              <div key={column.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{column.title}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getKanbanBgColorClass(column.color),
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
