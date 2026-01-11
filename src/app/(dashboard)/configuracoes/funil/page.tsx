import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceAction } from "@/features/workspaces/actions/workspaces";
import { getPipelineConfigAction } from "@/features/pipeline-config/actions/pipeline-config";
import { getPipelineStagesAction } from "@/features/pipeline-config/actions/stages";
import { getCustomFieldsAction } from "@/features/custom-fields/actions/custom-fields";
import { PipelineConfigManager } from "@/features/pipeline-config/components/PipelineConfigManager";

export default async function PipelineConfigPage() {
  // Força renderização dinâmica pois usa cookies
  await connection();
  
  const workspace = await getCurrentWorkspaceAction();

  if (!workspace) {
    redirect("/configuracoes");
  }

  const [config, customFields, stages] = await Promise.all([
    getPipelineConfigAction(workspace.id),
    getCustomFieldsAction(workspace.id),
    getPipelineStagesAction(workspace.id),
  ]);

  return (
    <PipelineConfigManager
      initialConfig={config}
      initialCustomFields={customFields}
      initialStages={stages}
      workspaceId={workspace.id}
    />
  );
}
