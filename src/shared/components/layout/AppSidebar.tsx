"use client";

import { LayoutDashboard, Megaphone, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { User, Workspace } from "@/shared/types/crm";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { SidebarNavFooter } from "./SidebarNavFooter";
import { SettingsSidebar } from "./SettingsSidebar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Pipeline", path: "/pipeline" },
  { icon: Megaphone, label: "Campanhas", path: "/campanhas" },
];

interface AppSidebarProps {
  user: User;
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  userRole?: "owner" | "admin" | "member" | null;
  onLogout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  user,
  currentWorkspace,
  workspaces,
  userRole,
  onLogout,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isSettingsPage = pathname?.startsWith("/configuracoes");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBackFromSettings = () => {
    router.push("/");
  };

  return (
    <aside className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col relative overflow-visible">
      {!isSettingsPage && (
        <SidebarHeader
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
        />
      )}

      {isSettingsPage ? (
        <div className="flex-1 flex flex-col">
          <div className="h-16 flex items-center border-b border-sidebar-border px-4 w-full">
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Configurações
            </h2>
          </div>
          <SettingsSidebar onBack={handleBackFromSettings} userRole={userRole} />
        </div>
      ) : (
        <>
          <SidebarNav mounted={mounted} pathname={pathname} items={navItems} />
          <SidebarNavFooter mounted={mounted} pathname={pathname} />
        </>
      )}

      <SidebarFooter user={user} onLogout={onLogout} />
    </aside>
  );
};
