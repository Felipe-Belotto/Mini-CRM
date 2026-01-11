"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Edit,
  Filter,
  Loader2,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
} from "lucide-react";
import type React from "react";
import { useEffect, useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";
import { getRecentWorkspaceActivitiesAction } from "../actions/activities";
import { formatActivityMessage, getActivityColor } from "../lib/activity-utils";
import type { ActivityActionType, LeadActivity } from "../types";

interface WorkspaceActivityHistoryProps {
  workspaceId: string;
  initialActivities: LeadActivity[];
}

const iconMap: Record<ActivityActionType, React.ReactNode> = {
  created: <PlusCircle className="h-4 w-4" />,
  stage_changed: <ArrowRight className="h-4 w-4" />,
  field_updated: <Edit className="h-4 w-4" />,
  message_sent: <Send className="h-4 w-4" />,
  archived: <Archive className="h-4 w-4" />,
  restored: <RotateCcw className="h-4 w-4" />,
};

const actionTypeLabels: Record<ActivityActionType, string> = {
  created: "Criação",
  stage_changed: "Mudança de Etapa",
  field_updated: "Atualização",
  message_sent: "Mensagem",
  archived: "Arquivamento",
  restored: "Restauração",
};

export const WorkspaceActivityHistory: React.FC<WorkspaceActivityHistoryProps> = ({
  workspaceId,
  initialActivities,
}) => {
  const [activities, setActivities] = useState<LeadActivity[]>(initialActivities);
  const [filteredActivities, setFilteredActivities] = useState<LeadActivity[]>(initialActivities);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [limit, setLimit] = useState(50);
  const [isPending, startTransition] = useTransition();

  // Aplicar filtros quando mudam
  useEffect(() => {
    let filtered = activities;

    // Filtrar por tipo
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.actionType === filterType);
    }

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.user?.fullName?.toLowerCase().includes(term) ||
          formatActivityMessage(a).toLowerCase().includes(term)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, filterType, searchTerm]);

  // Carregar mais atividades
  const loadMore = () => {
    const newLimit = limit + 50;
    setLimit(newLimit);
    
    startTransition(async () => {
      const moreActivities = await getRecentWorkspaceActivitiesAction(workspaceId, newLimit);
      setActivities(moreActivities);
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const groupByDate = (items: LeadActivity[]) => {
    const grouped = new Map<string, LeadActivity[]>();
    for (const item of items) {
      const date = format(item.createdAt, "yyyy-MM-dd");
      const existing = grouped.get(date) || [];
      existing.push(item);
      grouped.set(date, existing);
    }
    return grouped;
  };

  const groupedActivities = groupByDate(filteredActivities);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário ou ação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(actionTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de atividades */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma atividade encontrada.</p>
          {searchTerm || filterType !== "all" ? (
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
            >
              Limpar filtros
            </Button>
          ) : (
            <p className="text-sm mt-1">
              As atividades aparecerão aqui conforme os leads forem modificados.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedActivities.entries()).map(([date, items]) => (
            <div key={date}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </h4>
              <div className="space-y-2">
                {items.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    getInitials={getInitials}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carregar mais */}
      {activities.length >= limit && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
};

interface ActivityRowProps {
  activity: LeadActivity;
  getInitials: (name: string) => string;
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, getInitials }) => {
  const colorClass = getActivityColor(activity.actionType);
  const icon = iconMap[activity.actionType];
  const message = formatActivityMessage(activity);
  const time = format(activity.createdAt, "HH:mm", { locale: ptBR });

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      {/* Ícone */}
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background flex-shrink-0",
          colorClass.replace("text-", "border-")
        )}
      >
        <span className={colorClass}>{icon}</span>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">{message}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {activity.user && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={activity.user.avatarUrl} />
                <AvatarFallback className="text-[8px]">
                  {getInitials(activity.user.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {activity.user.fullName}
              </span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {actionTypeLabels[activity.actionType]}
          </Badge>
        </div>
      </div>

      {/* Hora */}
      <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
    </div>
  );
};
