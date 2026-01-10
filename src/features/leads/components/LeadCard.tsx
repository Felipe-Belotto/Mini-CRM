"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, FileText, GripVertical, MessageSquare, Phone } from "lucide-react";
import type React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/utils";
import type { Lead, User } from "@/shared/types/crm";
import { getAvatarColor, getInitials } from "../lib/avatar-utils";
import { hasRequiredFields } from "../lib/lead-utils";

function countJsonArray(jsonString?: string): number {
  if (!jsonString) return 0;

  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.length;
    }
  } catch {
    // Se não for JSON válido mas tiver conteúdo, conta como 1 item legado
    if (jsonString.trim()) {
      return 1;
    }
  }

  return 0;
}

interface LeadCardProps {
  lead: Lead;
  users?: User[];
  onSelect: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  users = [],
  onSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    onSelect(lead);
  };

  const responsibles = users.filter((u) => lead.responsibleIds.includes(u.id));

  const notesCount = countJsonArray(lead.notes);
  const messagesCount = countJsonArray(lead.messages);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("lead-card", isDragging && "lead-card-dragging")}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
          onClick={handleClick}
        >
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={lead.avatarUrl} alt={lead.name} />
            <AvatarFallback
              className={cn(
                "text-white font-semibold text-sm",
                getAvatarColor(lead.name || ""),
              )}
            >
              {getInitials(lead.name || "")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">
                {lead.name || "Sem nome"}
              </h4>
              {!hasRequiredFields(lead) && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
                  title="Dados incompletos"
                />
              )}
            </div>
            {lead.position && (
              <p className="text-xs text-muted-foreground truncate">
                {lead.position}
              </p>
            )}
          </div>
        </button>

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 p-1"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </div>

      <button
        type="button"
        className="w-full text-left mt-2"
        onClick={handleClick}
      >
        {lead.company && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
              <Building2 className="w-3 h-3" />
              {lead.company}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{lead.phone}</span>
              </div>
            )}

            {notesCount > 0 && (
              <div className="flex items-center gap-1" title={`${notesCount} nota${notesCount > 1 ? "s" : ""}`}>
                <FileText className="w-3 h-3" />
                <span>{notesCount}</span>
              </div>
            )}

            {messagesCount > 0 && (
              <div className="flex items-center gap-1" title={`${messagesCount} mensage${messagesCount > 1 ? "ns" : "m"}`}>
                <MessageSquare className="w-3 h-3" />
                <span>{messagesCount}</span>
              </div>
            )}
          </div>

          {responsibles.length > 0 && (
            <div className="flex items-center -space-x-1.5">
              {responsibles.slice(0, 3).map((user) => (
                <Avatar
                  key={user.id}
                  className="h-6 w-6 border-2 border-card"
                  title={user.fullName}
                >
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  <AvatarFallback
                    className={cn(
                      "text-white font-semibold text-[10px]",
                      getAvatarColor(user.fullName || ""),
                    )}
                  >
                    {getInitials(user.fullName || "")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {responsibles.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium">
                  +{responsibles.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
};
