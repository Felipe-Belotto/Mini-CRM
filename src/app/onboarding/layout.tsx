import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import { isOnboardingComplete } from "@/shared/lib/supabase/onboarding";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";

/**
 * Layout para rotas de onboarding
 * Redireciona para login se não autenticado
 * Redireciona para dashboard apenas se onboarding completo E tiver workspace
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Força renderização dinâmica pois usa cookies
  await connection();
  
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar se o onboarding foi completado
  const onboardingComplete = await isOnboardingComplete();
  
  // Se o onboarding está completo E tem workspace, redirecionar para dashboard
  // Caso contrário, permitir acesso às rotas de onboarding (user ou workspace)
  if (onboardingComplete) {
    const currentWorkspace = await getCurrentWorkspaceAction();
    if (currentWorkspace) {
      redirect("/");
    }
    // Se onboarding completo mas sem workspace, permitir acesso à página de workspace
  }

  return <>{children}</>;
}
