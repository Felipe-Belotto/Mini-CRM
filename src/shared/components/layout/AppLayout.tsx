"use client";

import { useRouter, usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { logoutAction } from "@/features/auth/actions/auth";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import type { User, Workspace } from "@/shared/types/crm";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  user: User;
  children: React.ReactNode;
  currentWorkspace: Workspace;
  workspaces: Workspace[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  children,
  currentWorkspace,
  workspaces,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSettingsPage = mounted && pathname?.startsWith("/configuracoes");

  const handleLogout = async () => {
    try {
      await logoutAction();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao desconectar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar
        user={user}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!isSettingsPage && (
          <header className="h-16 border-b border-border bg-background flex-shrink-0" />
        )}
        {isSettingsPage ? (
          <ScrollArea className="flex-1 bg-muted/30 min-h-0">
            <div className="flex items-start justify-center">
              <div className="w-full max-w-5xl mx-auto py-8 px-6">
                {children}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <main className="flex-1 min-h-0 overflow-auto">
            {children}
          </main>
        )}
      </div>
    </div>
  );
};
