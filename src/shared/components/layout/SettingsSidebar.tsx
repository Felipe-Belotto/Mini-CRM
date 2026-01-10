"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import {
  User,
  Building2,
  FolderTree,
  FileText,
  ArrowLeft,
} from "lucide-react";

const settingsNavItems = [
  { icon: User, label: "Perfil", path: "/configuracoes/perfil" },
  { icon: Building2, label: "Workspace", path: "/configuracoes/workspace" },
  { icon: FolderTree, label: "Funil", path: "/configuracoes/funil" },
  { icon: FileText, label: "Campos", path: "/configuracoes/campos" },
];

interface SettingsSidebarProps {
  onBack?: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  onBack,
}) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="flex-1 p-3 space-y-1">
      {onBack && (
        <button
          onClick={onBack}
          className="sidebar-link mb-4 w-full justify-start"
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0" />
          <span>Voltar</span>
        </button>
      )}
      {settingsNavItems.map((item) => {
        const isActive =
          mounted &&
          (pathname === item.path ||
            (item.path === "/configuracoes/perfil" &&
              pathname?.startsWith("/configuracoes/perfil")) ||
            (item.path === "/configuracoes/workspace" &&
              pathname?.startsWith("/configuracoes/workspace")) ||
            (item.path === "/configuracoes/funil" &&
              pathname?.startsWith("/configuracoes/funil")) ||
            (item.path === "/configuracoes/campos" &&
              pathname?.startsWith("/configuracoes/campos")));

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
