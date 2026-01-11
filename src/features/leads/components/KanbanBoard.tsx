"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { Button } from "@/shared/components/ui/button";
import type {
  KanbanStage,
  Lead,
  PipelineStage,
  User,
  ValidationError,
} from "@/shared/types/crm";
import { useKanbanBoard } from "../hooks/use-kanban-board";
import { getLeadsByStage } from "../lib/lead-utils";
import { KanbanColumnComponent } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  leads: Lead[];
  users?: User[];
  stages?: PipelineStage[];
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
    newSortOrder?: number,
  ) => Promise<ValidationError[] | null>;
  onReorderLeads?: (
    leadUpdates: { id: string; sortOrder: number }[],
  ) => Promise<void>;
  onLeadSelect: (lead: Lead) => void;
  onCreateLead?: (stage: KanbanStage) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  users = [],
  stages,
  onMoveLead,
  onReorderLeads,
  onLeadSelect,
  onCreateLead,
}) => {
  const {
    dndContextId,
    scrollRef,
    columns,
    optimisticLeads,
    activeLead,
    canScrollLeft,
    canScrollRight,
    sensors,
    collisionDetection,
    scrollLeft,
    scrollRight,
    handleDragStart,
    handleDragEnd,
  } = useKanbanBoard({ leads, stages, onMoveLead, onReorderLeads });

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin"
        >
          <div className="flex gap-4 p-6 h-full">
            {columns.map((column) => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                leads={getLeadsByStage(optimisticLeads, column.id)}
                users={users}
                onLeadSelect={onLeadSelect}
                onCreateLead={onCreateLead}
              />
            ))}
          </div>
        </div>

        {(canScrollLeft || canScrollRight) && (
          <div className="flex items-center justify-center gap-4 py-3 border-t bg-background/80 backdrop-blur-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              disabled={!canScrollRight}
              className="gap-1"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeLead && (
          <LeadCard lead={activeLead} users={users} onSelect={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  );
};
