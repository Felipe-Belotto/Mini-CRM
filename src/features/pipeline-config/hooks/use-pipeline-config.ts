"use client";

import { useState, useEffect, useCallback } from "react";
import type { PipelineConfig, StageConfig } from "@/shared/types/crm";
import {
  updatePipelineConfigAction,
  getPipelineConfigAction,
} from "../actions/pipeline-config";
import { useToast } from "@/shared/hooks/use-toast";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";

interface UsePipelineConfigReturn {
  config: PipelineConfig | null;
  isLoading: boolean;
  updateConfig: (stages: StageConfig[]) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function usePipelineConfig(): UsePipelineConfigReturn {
  const { currentWorkspace } = useWorkspace();
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadConfig = useCallback(async () => {
    if (!currentWorkspace) {
      setConfig(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getPipelineConfigAction(currentWorkspace.id);
      setConfig(data);
    } catch (error) {
      console.error("Erro ao carregar configuração do pipeline:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração do pipeline",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(
    async (stages: StageConfig[]): Promise<boolean> => {
      if (!currentWorkspace) return false;

      try {
        const result = await updatePipelineConfigAction({
          workspaceId: currentWorkspace.id,
          stages,
        });

        if (result.success && result.config) {
          setConfig(result.config);
          toast({
            title: "Configuração atualizada!",
            description: "A configuração do pipeline foi atualizada com sucesso.",
          });
          return true;
        } else {
          toast({
            title: "Erro ao atualizar configuração",
            description: result.error || "Não foi possível atualizar a configuração",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Erro ao atualizar configuração",
          description: "Ocorreu um erro ao atualizar a configuração",
          variant: "destructive",
        });
        return false;
      }
    },
    [currentWorkspace, toast],
  );

  const refresh = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    updateConfig,
    refresh,
  };
}
