"use client";

import { WorkspaceSelector } from "@/features/workspaces/components/WorkspaceSelector";
import type { Workspace } from "@/shared/types/crm";

interface SidebarHeaderProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  currentWorkspace,
  workspaces,
}) => {
  return (
    <div className="h-16 flex items-center border-b border-sidebar-border px-4 w-full">
      <WorkspaceSelector
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
      />
    </div>
  );
};
