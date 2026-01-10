"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { requireAuth, hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import type { PipelineConfig, StageConfig } from "@/shared/types/crm";

export interface UpdatePipelineConfigInput {
  workspaceId: string;
  stages: StageConfig[];
}

export interface PipelineConfigResult {
  success: boolean;
  config?: PipelineConfig;
  error?: string;
}

/**
 * Server Action para atualizar configuração do pipeline
 */
export async function updatePipelineConfigAction(
  input: UpdatePipelineConfigInput,
): Promise<PipelineConfigResult> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(input.workspaceId);

    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem acesso a este workspace",
      };
    }

    const supabase = await createClient();

    // Verificar se já existe configuração
    const { data: existing } = await supabase
      .from("pipeline_configs")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .single();

    let dbConfig;

    if (existing) {
      // Atualizar configuração existente
      const { data, error } = await supabase
        .from("pipeline_configs")
        .update({
          stages: input.stages as unknown,
        })
        .eq("workspace_id", input.workspaceId)
        .select()
        .single();

      if (error || !data) {
        console.error("Error updating pipeline config:", error);
        return {
          success: false,
          error: error?.message || "Não foi possível atualizar a configuração do pipeline",
        };
      }

      dbConfig = data;
    } else {
      // Criar nova configuração
      const { data, error } = await supabase
        .from("pipeline_configs")
        .insert({
          workspace_id: input.workspaceId,
          stages: input.stages as unknown,
        })
        .select()
        .single();

      if (error || !data) {
        console.error("Error creating pipeline config:", error);
        return {
          success: false,
          error: error?.message || "Não foi possível criar a configuração do pipeline",
        };
      }

      dbConfig = data;
    }

    const config: PipelineConfig = {
      workspaceId: dbConfig.workspace_id,
      stages: dbConfig.stages as StageConfig[],
    };

    return {
      success: true,
      config,
    };
  } catch (error) {
    console.error("Error in updatePipelineConfigAction:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        error: "Você precisa estar autenticado para atualizar a configuração do pipeline",
      };
    }
    return {
      success: false,
      error: "Ocorreu um erro ao atualizar a configuração do pipeline",
    };
  }
}

/**
 * Server Action para obter configuração do pipeline
 */
export async function getPipelineConfigAction(
  workspaceId: string,
): Promise<PipelineConfig | null> {
  try {
    // Verificar autenticação e acesso ao workspace
    await requireAuth();
    const hasAccess = await hasWorkspaceAccess(workspaceId);

    if (!hasAccess) {
      return null;
    }

    const supabase = await createClient();

    // Buscar configuração do pipeline
    const { data: dbConfig, error } = await supabase
      .from("pipeline_configs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (error) {
      // Se não existe configuração, retornar configuração padrão vazia
      // O trigger cria uma configuração vazia quando workspace é criado
      // Mas pode não existir em workspaces criados antes do trigger
      if (error.code === "PGRST116") {
        // Não encontrado - criar configuração padrão
        const defaultConfig: PipelineConfig = {
          workspaceId,
          stages: [],
        };

        // Opcionalmente, criar a configuração padrão no banco
        await supabase
          .from("pipeline_configs")
          .insert({
            workspace_id: workspaceId,
            stages: [],
          })
          .select()
          .single();

        return defaultConfig;
      }

      console.error("Error fetching pipeline config:", error);
      return null;
    }

    if (!dbConfig) {
      return null;
    }

    const config: PipelineConfig = {
      workspaceId: dbConfig.workspace_id,
      stages: (dbConfig.stages as StageConfig[]) || [],
    };

    return config;
  } catch (error) {
    console.error("Error in getPipelineConfigAction:", error);
    return null;
  }
}
