import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import { isOnboardingComplete } from "@/shared/lib/supabase/onboarding";
import { checkPendingInvitesAction } from "@/features/workspaces/actions/invites";
import { PendingInvitesPageClient } from "./PendingInvitesPageClient";

export const dynamic = "force-dynamic";

export default async function PendingInvitesPage() {
  
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const onboardingComplete = await isOnboardingComplete();
  if (!onboardingComplete) {
    redirect("/onboarding/user");
  }

  const invites = await checkPendingInvitesAction();

  return <PendingInvitesPageClient invites={invites} />;
}
