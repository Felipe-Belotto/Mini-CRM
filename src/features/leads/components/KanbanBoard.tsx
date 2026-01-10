"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import React from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  KANBAN_COLUMNS,
  type KanbanStage,
  type Lead,
  type ValidationError,
} from "@/shared/types/crm";
import { getLeadsByStage } from "../lib/lead-utils";
import { KanbanColumnComponent } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  leads: Lead[];
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
  onLeadSelect: (lead: Lead) => void;
  onCreateLead?: (stage: KanbanStage) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onMoveLead,
  onLeadSelect,
  onCreateLead,
}) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const targetStage = over.id as KanbanStage;

    if (!KANBAN_COLUMNS.find((c) => c.id === targetStage)) return;

    const errors = await onMoveLead(leadId, targetStage);

    if (errors && errors.length > 0) {
      toast({
        title: "Não foi possível mover o lead",
        description: (
          <div className="mt-2 space-y-1">
            <p className="text-sm">Preencha os campos obrigatórios:</p>
            <ul className="list-disc list-inside text-sm">
              {errors.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
          </div>
        ),
        variant: "destructive",
      });
    }
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              leads={getLeadsByStage(leads, column.id)}
              onLeadSelect={onLeadSelect}
              onCreateLead={onCreateLead}
            />
          ))}
        </div>
      </ScrollArea>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} onSelect={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
};
