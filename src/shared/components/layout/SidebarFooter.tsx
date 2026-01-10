"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { User } from "@/shared/types/crm";
import { UserAvatar } from "./UserAvatar";

interface SidebarFooterProps {
  user: User;
  onLogout: () => void;
  version?: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  user,
  onLogout,
  version = "v1.0.0",
}) => {
  return (
    <div className="border-t border-sidebar-border">
      <div className="p-4 space-y-4">
        <UserAvatar user={user} />
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
        <div className="text-xs text-muted-foreground">
          Mini CRM para SDRs
          <br />
          <span className="text-primary">{version}</span>
        </div>
      </div>
    </div>
  );
};
