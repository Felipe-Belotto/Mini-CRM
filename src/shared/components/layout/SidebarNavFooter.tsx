import { Settings } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";

export const SidebarNavFooter = ({ mounted, pathname }: { mounted: boolean, pathname: string }) => {
    const isSettingsActive = pathname?.startsWith("/configuracoes");
  return (
    <div className="p-3">
      <Link
        href="/configuracoes/perfil"
        className={cn(
          "sidebar-link",
          mounted && isSettingsActive && "sidebar-link-active",
          isSettingsActive && "sidebar-link-active",
        )}
      >
        <Settings className="h-5 w-5 flex-shrink-0" />
        <span>Configurações</span>
      </Link>
    </div>
  );
};
