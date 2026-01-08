import { DashboardUI } from "@/features/dashboard/components/DashboardUI";
import { mockCampaigns, mockLeads } from "@/shared/data/mockData";

export default async function DashboardPage() {
  const leads = mockLeads;
  const campaigns = mockCampaigns;

  return <DashboardUI leads={leads} campaigns={campaigns} />;
}
