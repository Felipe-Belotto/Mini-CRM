"use client";

import { useEffect, useState, useMemo } from "react";
import type { ColorPalette, PipelineStage } from "@/shared/types/crm";
import { getColorPalettesAction } from "@/features/pipeline-config/actions/color-palettes";
import { useWorkspace } from "@/shared/hooks/use-workspace";

interface UseKanbanColorsProps {
  stages?: PipelineStage[];
}

interface UseKanbanColorsReturn {
  colorPalettes: ColorPalette[];
  isLoading: boolean;
  getPaletteByKey: (key: string) => ColorPalette | undefined;
}

/**
 * Hook para buscar e gerenciar paletas de cores do kanban
 */
export function useKanbanColors({
  stages,
}: UseKanbanColorsProps): UseKanbanColorsReturn {
  const { currentWorkspace } = useWorkspace();
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPalettes() {
      if (!currentWorkspace) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const palettes = await getColorPalettesAction(currentWorkspace.id);
        setColorPalettes(palettes);
      } catch (error) {
        console.error("Error loading color palettes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPalettes();
  }, [currentWorkspace]);

  const getPaletteByKey = useMemo(
    () => (key: string) => {
      return colorPalettes.find((p) => p.key === key);
    },
    [colorPalettes]
  );

  return {
    colorPalettes,
    isLoading,
    getPaletteByKey,
  };
}
