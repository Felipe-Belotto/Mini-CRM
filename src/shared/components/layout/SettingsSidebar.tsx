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
  History,
  ArrowLeft,
} from "lucide-react";

const settingsNavItems = [
  { icon: User, label: "Perfil", path: "/configuracoes/perfil", adminOnly: false },
  { icon: Building2, label: "Workspace", path: "/configuracoes/workspace", adminOnly: false },
  { icon: FolderTree, label: "Funil", path: "/configuracoes/funil", adminOnly: false },
  { icon: FileText, label: "Campos", path: "/configuracoes/campos", adminOnly: false },
  { icon: History, label: "Histórico", path: "/configuracoes/historico", adminOnly: true },
];

interface SettingsSidebarProps {
  onBack?: () => void;
  userRole?: "owner" | "admin" | "member" | null;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  onBack,
  userRole,
}) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verifica se o usuário é admin ou owner
  const isAdminOrOwner = userRole === "owner" || userRole === "admin";

  // Filtrar itens com base nas permissões
  const visibleItems = settingsNavItems.filter(
    (item) => !item.adminOnly || isAdminOrOwner
  );

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
      {visibleItems.map((item) => {
        const isActive =
          mounted &&
          (pathname === item.path || pathname?.startsWith(item.path));

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
