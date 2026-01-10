import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import { isOnboardingComplete } from "@/shared/lib/supabase/onboarding";
import { checkPendingInvitesAction } from "@/features/workspaces/actions/invites";
import { PendingInvitesPageClient } from "./PendingInvitesPageClient";

export default async function PendingInvitesPage() {
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

  const invites = await checkPendingInvitesAction();

  return <PendingInvitesPageClient invites={invites} />;
}
