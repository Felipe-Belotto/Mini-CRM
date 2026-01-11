"use client";

import { CalendarDays } from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { LeadsByPeriod } from "../actions/metrics";

interface LeadsOverTimeProps {
  data: LeadsByPeriod[];
  title?: string;
}

export const LeadsOverTime: React.FC<LeadsOverTimeProps> = ({
  data,
  title = "Leads ao Longo do Tempo",
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            Evolução de leads criados por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Sem dados para exibir.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Total de {total} leads nos últimos {data.length} períodos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-40">
          {data.map((item, index) => {
            const height = (item.count / maxCount) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all"
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    minHeight: item.count > 0 ? "8px" : "2px",
                  }}
                  title={`${item.period}: ${item.count} leads`}
                />
                {item.count > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {item.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{data[0]?.period}</span>
          <span>{data[data.length - 1]?.period}</span>
        </div>
      </CardContent>
    </Card>
  );
};
