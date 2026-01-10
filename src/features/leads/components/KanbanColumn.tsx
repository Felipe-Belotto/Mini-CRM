"use client";

import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type React from "react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import type {
  KanbanColumn as KanbanColumnType,
  Lead,
  KanbanStage,
} from "@/shared/types/crm";
import { getKanbanColorClass } from "../lib/kanban-utils";
import { LeadCard } from "./LeadCard";

interface KanbanColumnProps {
  column: KanbanColumnType;
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
  onCreateLead?: (stage: KanbanStage) => void;
}

export const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
  column,
  leads,
  onLeadSelect,
  onCreateLead,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-column border-t-4 transition-all duration-200 flex flex-col h-full",
        getKanbanColorClass(column.color),
        isOver && "bg-accent/10 ring-2 ring-accent/30",
      )}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          {leads.length}
        </span>
      </div>

      {onCreateLead && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mb-2 text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => onCreateLead(column.id)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo Lead
        </Button>
      )}

      <ScrollArea className="flex-1 min-h-0">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onSelect={onLeadSelect} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};
