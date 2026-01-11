import { redirect } from "next/navigation";
import { connection } from "next/server";
import { checkPendingInvitesAction } from "@/features/workspaces/actions/invites";
import {
  getCurrentWorkspaceAction,
  getWorkspacesAction,
} from "@/features/workspaces/actions/workspaces";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { isOnboardingComplete } from "@/shared/lib/supabase/onboarding";
import { getCurrentUser, getWorkspaceRole } from "@/shared/lib/supabase/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Força renderização dinâmica pois todas as páginas do dashboard usam cookies (autenticação)
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const onboardingComplete = await isOnboardingComplete();
  if (!onboardingComplete) {
    redirect("/onboarding/user");
  }

  const currentWorkspace = await getCurrentWorkspaceAction();
  const workspaces = await getWorkspacesAction();

  if (!currentWorkspace) {
    const pendingInvites = await checkPendingInvitesAction();
    if (pendingInvites.length > 0) {
      if (pendingInvites.length === 1) {
        redirect(`/invites/accept/${pendingInvites[0].token}`);
      }
      redirect("/invites/pending");
    }
    redirect("/onboarding/workspace");
  }

  // Obter o role do usuário no workspace atual
  const userRole = await getWorkspaceRole(currentWorkspace.id, user.id);

  return (
    <AppLayout
      user={user}
      currentWorkspace={currentWorkspace}
      workspaces={workspaces}
      userRole={userRole}
    >
      {children}
    </AppLayout>
  );
}
