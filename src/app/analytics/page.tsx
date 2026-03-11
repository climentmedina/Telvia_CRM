import { getAnalyticsData, getScoreDistribution, getDashboardMetrics } from "@/lib/queries";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [analytics, distribution, metrics] = await Promise.all([
    getAnalyticsData(),
    getScoreDistribution(),
    getDashboardMetrics(),
  ]);

  return (
    <AnalyticsClient
      analytics={analytics}
      distribution={distribution}
      metrics={metrics}
    />
  );
}
