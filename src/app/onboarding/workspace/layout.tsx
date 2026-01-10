import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import { isOnboardingComplete } from "@/shared/lib/supabase/onboarding";
import { getWorkspacesAction, getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { checkPendingInvitesAction } from "@/features/workspaces/actions/invites";

export default async function WorkspaceOnboardingLayout({
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

  const onboardingComplete = await isOnboardingComplete();
  if (!onboardingComplete) {
    redirect("/onboarding/user");
  }

  const workspaces = await getWorkspacesAction();
  
  if (workspaces.length > 0) {
    const currentWorkspace = await getCurrentWorkspaceAction();
    if (currentWorkspace) {
      redirect("/");
    }
    redirect("/");
  }

  const pendingInvites = await checkPendingInvitesAction();
  
  if (pendingInvites.length > 0) {
    if (pendingInvites.length === 1) {
      redirect(`/invites/accept/${pendingInvites[0].token}`);
    }
    redirect("/invites/pending");
  }

  return <>{children}</>;
}
