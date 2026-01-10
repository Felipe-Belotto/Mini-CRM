"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarNavProps {
  mounted: boolean;
  pathname: string;
  items: NavItem[];
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ mounted, pathname, items }) => {
  return (
    <nav className="flex-1 p-3 space-y-1">
      {items.map((item) => {
        const isActive = mounted && pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn("sidebar-link", isActive && "sidebar-link-active")}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
