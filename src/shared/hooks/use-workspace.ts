"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import type { Workspace } from "@/shared/types/crm";
import {
  type CreateWorkspaceInput,
  createWorkspaceAction,
  getCurrentWorkspaceAction,
  getWorkspacesAction,
  switchWorkspaceAction,
} from "@/features/workspaces/actions/workspaces";

interface UseWorkspaceReturn {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<boolean>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWorkspace(): UseWorkspaceReturn {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [workspacesData, currentWorkspaceData] = await Promise.all([
        getWorkspacesAction(),
        getCurrentWorkspaceAction(),
      ]);
      setWorkspaces(workspacesData);
      setCurrentWorkspace(currentWorkspaceData);
    } catch (error) {
      console.error("Erro ao carregar workspaces:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os workspaces",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createWorkspace = useCallback(
    async (input: CreateWorkspaceInput): Promise<boolean> => {
      try {
        const result = await createWorkspaceAction(input);

        if (result.success && result.workspace) {
          await loadData();
          toast({
            title: "Workspace criado!",
            description: `Workspace "${result.workspace.name}" foi criado com sucesso.`,
          });
          return true;
        } else {
          toast({
            title: "Erro ao criar workspace",
            description: result.error || "Não foi possível criar o workspace",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Erro ao criar workspace",
          description: "Ocorreu um erro ao criar o workspace",
          variant: "destructive",
        });
        return false;
      }
    },
    [loadData, toast],
  );

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      try {
        const result = await switchWorkspaceAction(workspaceId);
        if (result.success) {
          await loadData();
          router.refresh();
        } else {
          toast({
            title: "Erro",
            description: result.error || "Não foi possível alternar o workspace",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao alternar workspace:", error);
        toast({
          title: "Erro",
          description: "Não foi possível alternar o workspace",
          variant: "destructive",
        });
      }
    },
    [router, loadData, toast],
  );

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    currentWorkspace,
    workspaces,
    isLoading,
    createWorkspace,
    switchWorkspace,
    refresh,
  };
}