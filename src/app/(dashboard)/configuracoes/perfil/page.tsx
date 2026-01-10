import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getProfileDataAction } from "@/features/auth/actions/onboarding";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditarPerfilPage() {
  // Força renderização dinâmica pois usa cookies
  await connection();
  
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
