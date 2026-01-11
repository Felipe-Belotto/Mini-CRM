import { redirect } from "next/navigation";
import { getProfileDataAction } from "@/features/auth/actions/onboarding";
import { EditProfileForm } from "./EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditarPerfilPage() {
  
  const result = await getProfileDataAction();

  if (!result.success || !result.data) {
    redirect("/configuracoes/perfil");
  }

  return (
    <EditProfileForm
      initialData={{
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        avatarUrl: result.data.avatarUrl,
      }}
    />
  );
}
