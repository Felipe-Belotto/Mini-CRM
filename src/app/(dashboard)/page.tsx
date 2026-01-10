import { redirect } from "next/navigation";
import { getDashboardMetricsAction } from "@/features/dashboard/actions/dashboard";
import { DashboardUI } from "@/features/dashboard/components/DashboardUI";

export default async function DashboardPage() {
  const metrics = await getDashboardMetricsAction();

  if (!metrics) {
    redirect("/onboarding/workspace");
  }

  return <DashboardUI leads={metrics.leads} campaigns={metrics.campaigns} />;
}
