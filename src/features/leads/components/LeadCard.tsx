"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Briefcase, Building2, GripVertical, Phone } from "lucide-react";
import type React from "react";
import { cn } from "@/shared/lib/utils";
import type { Lead } from "@/shared/types/crm";
import { hasRequiredFields } from "../lib/lead-utils";

interface LeadCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onSelect }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("lead-card", isDragging && "lead-card-dragging")}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0" onClick={handleClick}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm truncate">
              {lead.name || "Sem nome"}
            </h4>
            {!hasRequiredFields && (
              <span
                className="w-2 h-2 rounded-full bg-warning flex-shrink-0"
                title="Dados incompletos"
              />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {lead.company || "Empresa não informada"}
              </span>
            </div>

            {lead.position && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{lead.position}</span>
              </div>
            )}

            {lead.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
