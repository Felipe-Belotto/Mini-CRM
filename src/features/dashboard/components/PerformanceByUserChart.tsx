"use client";

import { Users } from "lucide-react";
import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { PerformanceByUser } from "../actions/metrics";

interface PerformanceByUserChartProps {
  data: PerformanceByUser[];
}

export const PerformanceByUserChart: React.FC<PerformanceByUserChartProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance por Usuário
          </CardTitle>
          <CardDescription>
            Métricas de desempenho de cada responsável
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Sem dados de performance para exibir.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Performance por Usuário
        </CardTitle>
        <CardDescription>
          Métricas de desempenho de cada responsável
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center gap-4 p-3 rounded-lg border"
            >
              {/* Ranking */}
              <div className="flex-shrink-0 w-6 text-center">
                <span
                  className={`text-lg font-bold ${
                    index === 0
                      ? "text-yellow-500"
                      : index === 1
                        ? "text-gray-400"
                        : index === 2
                          ? "text-amber-600"
                          : "text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </span>
              </div>

              {/* Avatar e nome */}
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{getInitials(user.userName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.leadsCount} leads atribuídos
                  </p>
                </div>
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {user.qualifiedCount} qualificados
                </Badge>
                <Badge variant="outline">
                  {user.messagesCount} mensagens
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
