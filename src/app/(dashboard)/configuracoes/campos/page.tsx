import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { getCustomFieldsAction } from "@/features/custom-fields/actions/custom-fields";
import { CustomFieldsManager } from "@/features/custom-fields/components/CustomFieldsManager";

export default async function CustomFieldsPage() {
  // Força renderização dinâmica pois usa cookies
  await connection();
  
  const workspace = await getCurrentWorkspaceAction();

  if (!workspace) {
    redirect("/configuracoes");
  }

  const fields = await getCustomFieldsAction(workspace.id);

  return (
    <CustomFieldsManager initialFields={fields} workspaceId={workspace.id} />
  );
}
