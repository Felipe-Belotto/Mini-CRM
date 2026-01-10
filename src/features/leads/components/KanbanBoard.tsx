"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  KANBAN_COLUMNS,
  type KanbanStage,
  type Lead,
  type User,
  type ValidationError,
} from "@/shared/types/crm";
import { getLeadsByStage } from "../lib/lead-utils";
import { KanbanColumnComponent } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  leads: Lead[];
  users?: User[];
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
  ) => Promise<ValidationError[] | null>;
  onLeadSelect: (lead: Lead) => void;
  onCreateLead?: (stage: KanbanStage) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  users = [],
  onMoveLead,
  onLeadSelect,
  onCreateLead,
}) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticLeads, setOptimisticLeads] = useState<Lead[]>(leads);

  // Sincroniza o estado local quando os leads do servidor mudam
  useEffect(() => {
    setOptimisticLeads(leads);
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Estratégia de colisão customizada: prioriza pointerWithin, fallback para rectIntersection
  const collisionDetection = useCallback(
    (args: Parameters<typeof pointerWithin>[0]) => {
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      return rectIntersection(args);
    },
    [],
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

    // Verifica se é uma coluna válida
    if (!KANBAN_COLUMNS.find((c) => c.id === targetStage)) return;

    // Encontra o lead atual
    const currentLead = optimisticLeads.find((l) => l.id === leadId);
    if (!currentLead) return;

    // Se o lead já está na mesma coluna, não faz nada
    if (currentLead.stage === targetStage) return;

    // Atualização otimista: move o lead imediatamente na UI
    const previousLeads = [...optimisticLeads];
    setOptimisticLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, stage: targetStage } : lead,
      ),
    );

    // Chama o servidor
    const errors = await onMoveLead(leadId, targetStage);

    if (errors && errors.length > 0) {
      // Reverte a atualização otimista
      setOptimisticLeads(previousLeads);

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

  const activeLead = activeId
    ? optimisticLeads.find((l) => l.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {KANBAN_COLUMNS.map((column) => (
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
      </ScrollArea>

      <DragOverlay>
        {activeLead && (
          <LeadCard lead={activeLead} users={users} onSelect={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  );
};
