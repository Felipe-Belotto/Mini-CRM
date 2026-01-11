"use client";

import { Clock } from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { TimeByStage } from "../actions/metrics";

interface TimeByStageChartProps {
  data: TimeByStage[];
}

export const TimeByStageChart: React.FC<TimeByStageChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo Médio por Etapa
          </CardTitle>
          <CardDescription>
            Quanto tempo leads permanecem em cada etapa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Sem dados suficientes para calcular tempo médio.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxDays = Math.max(...data.map((d) => d.averageDays), 1);

  const formatTime = (days: number, hours: number) => {
    if (days >= 1) {
      return `${days.toFixed(1)} dias`;
    }
    if (hours >= 1) {
      return `${hours.toFixed(1)} horas`;
    }
    return "< 1 hora";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tempo Médio por Etapa
        </CardTitle>
        <CardDescription>
          Quanto tempo leads permanecem em cada etapa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.filter(d => d.averageHours > 0).map((item, index) => {
            const width = (item.averageDays / maxDays) * 100;
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.stageName}</span>
                  <span className="text-muted-foreground">
                    {formatTime(item.averageDays, item.averageHours)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(width, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {data.every(d => d.averageHours === 0) && (
            <p className="text-center text-muted-foreground py-4">
              Mova leads entre etapas para gerar métricas de tempo.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
