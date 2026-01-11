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

  // Buscar métricas avançadas em paralelo
  const [conversionRates, leadsByPeriod, timeByStage, performanceByUser] =
    await Promise.all([
      getConversionRatesAction(),
      getLeadsByPeriodAction("day", 30),
      getAverageTimeByStageAction(),
      getPerformanceByUserAction(),
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
