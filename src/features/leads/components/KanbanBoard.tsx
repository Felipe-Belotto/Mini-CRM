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
import { arrayMove } from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/components/ui/button";
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
    newSortOrder?: number,
  ) => Promise<ValidationError[] | null>;
  onReorderLeads?: (leadUpdates: { id: string; sortOrder: number }[]) => Promise<void>;
  onLeadSelect: (lead: Lead) => void;
  onCreateLead?: (stage: KanbanStage) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  users = [],
  onMoveLead,
  onReorderLeads,
  onLeadSelect,
  onCreateLead,
}) => {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticLeads, setOptimisticLeads] = useState<Lead[]>(leads);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sincroniza o estado local quando os leads do servidor mudam
  useEffect(() => {
    setOptimisticLeads(leads);
  }, [leads]);

  // Verifica se pode scrollar para esquerda/direita
  const checkScrollability = useCallback(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;

    setCanScrollLeft(viewport.scrollLeft > 0);
    setCanScrollRight(
      viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 1
    );
  }, []);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;

    checkScrollability();
    viewport.addEventListener("scroll", checkScrollability);
    window.addEventListener("resize", checkScrollability);

    return () => {
      viewport.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [checkScrollability]);

  const scrollLeft = () => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: 320, behavior: "smooth" });
  };

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
    const overId = over.id as string;

    // Encontra o lead sendo arrastado
    const currentLead = optimisticLeads.find((l) => l.id === leadId);
    if (!currentLead) return;

    // Verifica se o destino é uma coluna
    const targetColumn = KANBAN_COLUMNS.find((c) => c.id === overId);
    
    // Verifica se o destino é outro lead
    const targetLead = optimisticLeads.find((l) => l.id === overId);

    // Determina a coluna de destino
    const targetStage: KanbanStage = targetColumn 
      ? targetColumn.id 
      : targetLead 
        ? targetLead.stage 
        : currentLead.stage;

    // CASO 1: Reordenação dentro da mesma coluna
    if (currentLead.stage === targetStage && targetLead && onReorderLeads) {
      const columnLeads = getLeadsByStage(optimisticLeads, targetStage);
      const oldIndex = columnLeads.findIndex((l) => l.id === leadId);
      const newIndex = columnLeads.findIndex((l) => l.id === overId);

      if (oldIndex === newIndex) return;

      // Reordena os leads
      const reorderedLeads = arrayMove(columnLeads, oldIndex, newIndex);
      
      // Calcula os novos sortOrders
      const leadUpdates = reorderedLeads.map((lead, index) => ({
        id: lead.id,
        sortOrder: index + 1,
      }));

      // Atualização otimista
      const previousLeads = [...optimisticLeads];
      setOptimisticLeads((prev) => {
        const otherLeads = prev.filter((l) => l.stage !== targetStage);
        const updatedColumnLeads = reorderedLeads.map((lead, index) => ({
          ...lead,
          sortOrder: index + 1,
        }));
        return [...otherLeads, ...updatedColumnLeads];
      });

      // Persistir no servidor
      try {
        await onReorderLeads(leadUpdates);
      } catch {
        // Reverte em caso de erro
        setOptimisticLeads(previousLeads);
        toast({
          title: "Erro ao reordenar",
          description: "Não foi possível salvar a nova ordem.",
          variant: "destructive",
        });
      }
      return;
    }

    // CASO 2: Movendo para outra coluna
    if (currentLead.stage !== targetStage) {
      // Calcula o novo sortOrder baseado na posição do drop
      let newSortOrder: number;
      if (targetLead) {
        // Dropped sobre outro lead - usa o sortOrder dele
        newSortOrder = targetLead.sortOrder;
      } else {
        // Dropped na coluna vazia - coloca no final
        const columnLeads = getLeadsByStage(optimisticLeads, targetStage);
        newSortOrder = columnLeads.length > 0 
          ? Math.max(...columnLeads.map(l => l.sortOrder)) + 1 
          : 1;
      }

      // Atualização otimista
      const previousLeads = [...optimisticLeads];
      setOptimisticLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, stage: targetStage, sortOrder: newSortOrder } : lead,
        ),
      );

      // Chama o servidor
      const errors = await onMoveLead(leadId, targetStage, newSortOrder);

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
      <div className="flex flex-col h-full">
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin"
        >
          <div className="flex gap-4 p-6 min-w-max">
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
        </div>

        {/* Navegação por setas */}
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
