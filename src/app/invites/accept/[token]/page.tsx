import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/supabase/utils";
import { isOnboardingComplete } from "@/shared/lib/supabase/onboarding";
import { getInviteByTokenAction } from "@/features/workspaces/actions/invites";
import { hasWorkspaceAccess } from "@/shared/lib/supabase/utils";
import { switchWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { InviteAcceptPageClient } from "./InviteAcceptPageClient";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: InvitePageProps) {
  const { token } = await params;

  if (!token) {
    redirect("/login?error=Token inválido");
  }

  const result = await getInviteByTokenAction(token);

  if (!result.success || !result.invite) {
    redirect(`/login?error=${encodeURIComponent(result.error || "Convite não encontrado")}`);
  }

  const invite = result.invite;

  if (invite.status !== "pending") {
    const errorMessage =
      invite.status === "accepted"
        ? "Este convite já foi aceito"
        : invite.status === "expired"
          ? "Este convite expirou"
          : "Este convite foi cancelado";
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?invite=${token}`);
  }

  const onboardingComplete = await isOnboardingComplete();
  if (!onboardingComplete) {
    redirect(`/onboarding/user?invite=${token}`);
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    redirect(
      `/login?error=${encodeURIComponent(
        `Este convite é para ${invite.email}. Faça login com a conta correta.`,
      )}`,
    );
  }

  const isAlreadyMember = await hasWorkspaceAccess(invite.workspaceId, user.id);
  if (isAlreadyMember) {
    await switchWorkspaceAction(invite.workspaceId);
    redirect("/");
  }

  return <InviteAcceptPageClient invite={invite} token={token} />;
}
