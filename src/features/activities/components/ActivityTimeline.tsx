"use client";

import {
  Archive,
  ArrowRight,
  Edit,
  Loader2,
  PlusCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/utils";
import { getLeadActivitiesAction } from "../actions/activities";
import {
  formatActivityMessage,
  getActivityColor,
  groupActivitiesByDate,
} from "../lib/activity-utils";
import type { ActivityActionType, LeadActivity } from "../types";

interface ActivityTimelineProps {
  leadId: string;
}

const iconMap: Record<ActivityActionType, React.ReactNode> = {
  created: <PlusCircle className="h-4 w-4" />,
  stage_changed: <ArrowRight className="h-4 w-4" />,
  field_updated: <Edit className="h-4 w-4" />,
  message_sent: <Send className="h-4 w-4" />,
  archived: <Archive className="h-4 w-4" />,
  restored: <RotateCcw className="h-4 w-4" />,
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  leadId,
}) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true);
      try {
        const data = await getLeadActivitiesAction(leadId);
        setActivities(data);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivities();
  }, [leadId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma atividade registrada ainda.</p>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="space-y-6">
      {Array.from(groupedActivities.entries()).map(([date, dateActivities]) => (
        <div key={date}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {date}
          </h4>
          <div className="space-y-4">
            {dateActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === dateActivities.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface ActivityItemProps {
  activity: LeadActivity;
  isLast: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isLast }) => {
  const colorClass = getActivityColor(activity.actionType);
  const icon = iconMap[activity.actionType];
  const message = formatActivityMessage(activity);
  const time = activity.createdAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex gap-3">
      {/* Linha vertical e ícone */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
            colorClass.replace("text-", "border-")
          )}
        >
          <span className={colorClass}>{icon}</span>
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border min-h-[20px]" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm">{message}</p>
            <div className="flex items-center gap-2 mt-1">
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
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
