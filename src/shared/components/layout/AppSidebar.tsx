"use client";

import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Pipeline", path: "/pipeline" },
  { icon: Megaphone, label: "Campanhas", path: "/campanhas" },
];

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out relative overflow-visible",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center border-b border-sidebar-border relative",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-lg text-sidebar-foreground">
              MiniCRM
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent z-20",
            sidebarCollapsed &&
              "absolute -right-3 top-6 bg-sidebar border border-sidebar-border shadow-sm hover:bg-sidebar-accent",
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "sidebar-link",
                isActive && "sidebar-link-active",
                sidebarCollapsed && "justify-center px-2",
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">
            Mini CRM para SDRs
            <br />
            <span className="text-accent">v1.0.0</span>
          </div>
        </div>
      )}
    </aside>
  );
};
