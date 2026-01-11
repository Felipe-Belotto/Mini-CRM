"use client";

import {
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type React from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type {
  KanbanColumn,
  KanbanStage,
  Lead,
  PipelineStage,
  ValidationError,
} from "@/shared/types/crm";
import { KANBAN_COLUMNS } from "@/shared/types/crm";
import { getLeadsByStage } from "../lib/lead-utils";
import { useKanbanColors } from "./use-kanban-colors";

interface UseKanbanBoardProps {
  leads: Lead[];
  stages?: PipelineStage[];
  onMoveLead: (
    leadId: string,
    newStage: KanbanStage,
    newSortOrder?: number,
  ) => Promise<ValidationError[] | null>;
  onReorderLeads?: (
    leadUpdates: { id: string; sortOrder: number }[],
  ) => Promise<void>;
}

interface UseKanbanBoardReturn {
  dndContextId: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  columns: KanbanColumn[];
  optimisticLeads: Lead[];
  activeLead: Lead | null | undefined;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: (args: Parameters<typeof pointerWithin>[0]) => ReturnType<typeof pointerWithin>;
  scrollLeft: () => void;
  scrollRight: () => void;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

function stagesToColumns(
  stages: PipelineStage[],
  getPaletteByKey: (key: string) => { borderClass: string } | undefined
): KanbanColumn[] {
  return stages
    .filter((s) => !s.isHidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => {
      const palette = getPaletteByKey(s.color);
      // Se encontrou a paleta, usa borderClass diretamente, senão mantém a key para fallback
      return {
        id: s.slug as KanbanStage,
        title: s.name,
        color: palette?.borderClass || s.color,
      };
    });
}

export function useKanbanBoard({
  leads,
  stages,
  onMoveLead,
  onReorderLeads,
}: UseKanbanBoardProps): UseKanbanBoardReturn {
  const { toast } = useToast();
  const dndContextId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticLeads, setOptimisticLeads] = useState<Lead[]>(leads);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { getPaletteByKey, isLoading: isLoadingColors } = useKanbanColors({ stages });

  const columns: KanbanColumn[] = useMemo(() => {
    if (!stages || stages.length === 0) {
      return KANBAN_COLUMNS;
    }
    
    // Se ainda está carregando as cores, usa fallback
    if (isLoadingColors) {
      return stagesToColumns(stages, () => undefined);
    }
    
    return stagesToColumns(stages, getPaletteByKey);
  }, [stages, getPaletteByKey, isLoadingColors]);

  useEffect(() => {
    setOptimisticLeads(leads);
  }, [leads]);

  const checkScrollability = useCallback(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;

    setCanScrollLeft(viewport.scrollLeft > 0);
    setCanScrollRight(
      viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 1,
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

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const collisionDetection = useCallback(
    (args: Parameters<typeof pointerWithin>[0]) => {
      const pointerCollisions = pointerWithin(args);
      return pointerCollisions.length > 0
        ? pointerCollisions
        : rectIntersection(args);
    },
    [],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const leadId = active.id as string;
      const overId = over.id as string;
      const currentLead = optimisticLeads.find((l) => l.id === leadId);
      if (!currentLead) return;

      const targetColumn = columns.find((c) => c.id === overId);
      const targetLead = optimisticLeads.find((l) => l.id === overId);
      const targetStage: KanbanStage = targetColumn
        ? targetColumn.id
        : targetLead
          ? targetLead.stage
          : currentLead.stage;

      if (currentLead.stage === targetStage && targetLead && onReorderLeads) {
        const columnLeads = getLeadsByStage(optimisticLeads, targetStage);
        const oldIndex = columnLeads.findIndex((l) => l.id === leadId);
        const newIndex = columnLeads.findIndex((l) => l.id === overId);

        if (oldIndex === newIndex) return;

        const reorderedLeads = arrayMove(columnLeads, oldIndex, newIndex);
        const leadUpdates = reorderedLeads.map((lead, index) => ({
          id: lead.id,
          sortOrder: index + 1,
        }));

        const previousLeads = [...optimisticLeads];
        setOptimisticLeads((prev) => {
          const otherLeads = prev.filter((l) => l.stage !== targetStage);
          const updatedColumnLeads = reorderedLeads.map((lead, index) => ({
            ...lead,
            sortOrder: index + 1,
          }));
          return [...otherLeads, ...updatedColumnLeads];
        });

        try {
          await onReorderLeads(leadUpdates);
        } catch {
          setOptimisticLeads(previousLeads);
          toast({
            title: "Erro ao reordenar",
            description: "Não foi possível salvar a nova ordem.",
            variant: "destructive",
          });
        }
        return;
      }

      if (currentLead.stage !== targetStage) {
        const columnLeads = getLeadsByStage(optimisticLeads, targetStage);
        const newSortOrder = targetLead
          ? targetLead.sortOrder
          : columnLeads.length > 0
            ? Math.max(...columnLeads.map((l) => l.sortOrder)) + 1
            : 1;

        const previousLeads = [...optimisticLeads];
        setOptimisticLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? { ...lead, stage: targetStage, sortOrder: newSortOrder }
              : lead,
          ),
        );

        const errors = await onMoveLead(leadId, targetStage, newSortOrder);

        if (errors?.length) {
          setOptimisticLeads(previousLeads);
          toast({
            title: "Não foi possível mover o lead",
            description: (
              <div className="mt-2 space-y-1">
                <p className="text-sm">Preencha os campos obrigatórios:</p>
                <ul className="list-disc list-inside text-sm">
                  {errors.map((error, idx) => (
                    <li key={error.field || idx}>{error.message}</li>
                  ))}
                </ul>
              </div>
            ),
            variant: "destructive",
          });
        }
      }
    },
    [columns, onMoveLead, onReorderLeads, optimisticLeads, toast],
  );

  const activeLead = activeId
    ? optimisticLeads.find((l) => l.id === activeId)
    : null;

  return {
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
  };
}
