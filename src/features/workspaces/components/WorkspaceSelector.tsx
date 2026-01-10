"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { switchWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useToast } from "@/shared/hooks/use-toast";
import type { Workspace } from "@/shared/types/crm";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { WorkspaceAvatar } from "./WorkspaceAvatar";

interface WorkspaceSelectorProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspace,
  workspaces,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      const result = await switchWorkspaceAction(workspaceId);
      if (result.success) {
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
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="gap-1.5 h-auto py-1 px-2 hover:bg-sidebar-accent justify-start w-full min-w-0"
          >
            <WorkspaceAvatar
              name={currentWorkspace.name}
              logoUrl={currentWorkspace.logoUrl}
              size="md"
              className="flex-shrink-0 w-6 h-6"
            />
            <span className="font-semibold text-sm text-sidebar-foreground truncate flex-1 min-w-0 flex items-start">
              {currentWorkspace.name}
            </span>
            <ChevronDown className="w-4 h-4 flex-shrink-0 text-sidebar-foreground/70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSwitchWorkspace(workspace.id)}
              className={
                workspace.id === currentWorkspace.id ? "bg-accent" : ""
              }
            >
              <WorkspaceAvatar
                name={workspace.name}
                logoUrl={workspace.logoUrl}
                size="sm"
                className="mr-2"
              />
              <span className="truncate">{workspace.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar novo workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
};
