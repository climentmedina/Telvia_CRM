import { getDashboardMetrics, getScoreDistribution, getPipelineProgress } from "@/lib/queries";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [metrics, distribution, pipeline] = await Promise.all([
    getDashboardMetrics(),
    getScoreDistribution(),
    getPipelineProgress(),
  ]);

  return (
    <DashboardClient
      metrics={metrics}
      distribution={distribution}
      pipeline={pipeline}
    />
  );
}
