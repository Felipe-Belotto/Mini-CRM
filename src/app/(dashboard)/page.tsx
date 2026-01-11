import { redirect } from "next/navigation";
import { getDashboardMetricsAction } from "@/features/dashboard/actions/dashboard";
import {
  getConversionRatesAction,
  getLeadsByPeriodAction,
  getAverageTimeByStageAction,
  getPerformanceByUserAction,
} from "@/features/dashboard/actions/metrics";
import { DashboardUI } from "@/features/dashboard/components/DashboardUI";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metrics = await getDashboardMetricsAction();

  if (!metrics) {
    redirect("/onboarding/workspace");
  }

  // Obter workspaceId uma vez para evitar múltiplas verificações
  const { getCurrentWorkspaceAction } = await import("@/features/workspaces/actions/workspaces");
  const currentWorkspace = await getCurrentWorkspaceAction();
  
  if (!currentWorkspace) {
    redirect("/onboarding/workspace");
  }

  // Buscar métricas avançadas em paralelo, passando workspaceId para evitar verificações redundantes
  const [conversionRates, leadsByPeriod, timeByStage, performanceByUser] =
    await Promise.all([
      getConversionRatesAction(currentWorkspace.id),
      getLeadsByPeriodAction("day", 30, currentWorkspace.id),
      getAverageTimeByStageAction(currentWorkspace.id),
      getPerformanceByUserAction(currentWorkspace.id),
    ]);

  return (
    <DashboardUI
      leads={metrics.leads}
      campaigns={metrics.campaigns}
      advancedMetrics={{
        conversionRates,
        leadsByPeriod,
        timeByStage,
        performanceByUser,
      }}
    />
  );
}
