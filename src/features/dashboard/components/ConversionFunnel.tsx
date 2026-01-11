"use client";

import { ArrowRight, TrendingUp } from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { ConversionRate } from "../actions/metrics";

interface ConversionFunnelProps {
  data: ConversionRate[];
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Taxa de Conversão
          </CardTitle>
          <CardDescription>
            Conversão entre etapas do funil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Sem dados suficientes para calcular taxas de conversão.
            <br />
            <span className="text-sm">
              Mova leads entre etapas para gerar métricas.
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  const getColorByRate = (rate: number) => {
    if (rate >= 70) return "text-green-600 dark:text-green-400";
    if (rate >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColorByRate = (rate: number) => {
    if (rate >= 70) return "bg-green-500";
    if (rate >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Taxa de Conversão
        </CardTitle>
        <CardDescription>
          Percentual de leads que avançam entre etapas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              {/* Labels das etapas */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.fromStageName}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                <span className="font-medium">{item.toStageName}</span>
              </div>

              {/* Barra de progresso */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-6 bg-muted rounded-full overflow-hidden cursor-pointer">
                      <div
                        className={`absolute left-0 top-0 h-full ${getBgColorByRate(item.rate)} transition-all duration-500`}
                        style={{ width: `${Math.max(item.rate, 2)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold ${getColorByRate(item.rate)}`}>
                          {item.rate}%
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {item.count} de {item.total} leads converteram
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
