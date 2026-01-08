"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type React from "react";
import { cn } from "@/shared/lib/utils";
import type {
  KanbanColumn as KanbanColumnType,
  Lead,
} from "@/shared/types/crm";
import { getKanbanColorClass } from "../lib/kanban-utils";
import { LeadCard } from "./LeadCard";

interface KanbanColumnProps {
  column: KanbanColumnType;
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
}

export const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
  column,
  leads,
  onLeadSelect,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-column border-t-4 transition-all duration-200",
        getKanbanColorClass(column.color),
        isOver && "bg-accent/10 ring-2 ring-accent/30",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          {leads.length}
        </span>
      </div>

      <SortableContext
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[400px]">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onSelect={onLeadSelect} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};
