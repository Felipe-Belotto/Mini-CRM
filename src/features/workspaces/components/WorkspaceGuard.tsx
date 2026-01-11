"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/shared/hooks/use-workspace";

/**
 * Componente que garante que o usuário tenha um workspace no dashboard
 * Redireciona para /onboarding/workspace se não tiver
 */
export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentWorkspace, isLoading } = useWorkspace();

  useEffect(() => {
    // Aguardar o carregamento
    if (isLoading) return;

    // Se não tiver workspace, redirecionar para setup
    if (!currentWorkspace) {
      router.push("/onboarding/workspace");
    }
  }, [currentWorkspace, isLoading, router]);

  // Se estiver carregando ou não tiver workspace, mostrar loading
  if (isLoading || !currentWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderizar children (que já inclui o AppLayout)
  return <>{children}</>;
}
