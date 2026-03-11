"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Thermometer,
  Snowflake,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tierColor, formatScore, formatDate, formatNumber, scoreColor } from "@/lib/utils";
import { ScoreChart } from "./score-chart";
import { PipelineBar } from "./pipeline-bar";

interface DashboardMetrics {
  total: number;
  tier1_completed: number;
  tier2_completed: number;
  hot: number;
  warm: number;
  cold: number;
  disqualified: number;
  recent: {
    id: string;
    company_name: string;
    domain: string;
    priority_score: number | null;
    outreach_tier: string | null;
    scored_at: string | null;
    provincia: string | null;
    sector: string | null;
  }[];
}

interface PipelineData {
  tier1: { pending: number; in_progress: number; completed: number; failed: number };
  tier2: { pending: number; in_progress: number; completed: number; failed: number; not_eligible: number };
}

interface Props {
  metrics: DashboardMetrics;
  distribution: { range: string; count: number }[];
  pipeline: PipelineData;
}

export function DashboardClient({ metrics: initialMetrics, distribution: initialDist, pipeline: initialPipeline }: Props) {
  const router = useRouter();
  const [metrics, setMetrics] = useState(initialMetrics);
  const [distribution, setDistribution] = useState(initialDist);
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => {
    router.refresh();
    setLastRefresh(new Date());
  }, [router]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Update state when props change (from server refresh)
  useEffect(() => { setMetrics(initialMetrics); }, [initialMetrics]);
  useEffect(() => { setDistribution(initialDist); }, [initialDist]);
  useEffect(() => { setPipeline(initialPipeline); }, [initialPipeline]);

  const scored = metrics.hot + metrics.warm + metrics.cold + metrics.disqualified;
  const tier1Total = pipeline.tier1.pending + pipeline.tier1.in_progress + pipeline.tier1.completed + pipeline.tier1.failed;
  const tier2Total = pipeline.tier2.pending + pipeline.tier2.in_progress + pipeline.tier2.completed + pipeline.tier2.failed + pipeline.tier2.not_eligible;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline overview — auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Last: {lastRefresh.toLocaleTimeString("es-ES")}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Companies"
          value={formatNumber(metrics.total)}
          subtitle={`${formatNumber(scored)} scored`}
          icon={<Building2 className="h-4 w-4" />}
        />
        <MetricCard
          title="Hot Leads"
          value={formatNumber(metrics.hot)}
          subtitle="Score >= 90"
          icon={<Flame className="h-4 w-4 text-red-500" />}
          valueColor="text-red-600 dark:text-red-400"
        />
        <MetricCard
          title="Warm Leads"
          value={formatNumber(metrics.warm)}
          subtitle="Score >= 75"
          icon={<Thermometer className="h-4 w-4 text-orange-500" />}
          valueColor="text-orange-600 dark:text-orange-400"
        />
        <MetricCard
          title="Cold / Disqualified"
          value={`${formatNumber(metrics.cold)} / ${formatNumber(metrics.disqualified)}`}
          subtitle="Score < 75"
          icon={<Snowflake className="h-4 w-4 text-blue-500" />}
        />
      </div>

      {/* Pipeline Progress */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Tier 1 — HTTP Heuristics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineBar
              completed={pipeline.tier1.completed}
              inProgress={pipeline.tier1.in_progress}
              failed={pipeline.tier1.failed}
              pending={pipeline.tier1.pending}
              total={tier1Total}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Tier 2 — AI Extraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineBar
              completed={pipeline.tier2.completed}
              inProgress={pipeline.tier2.in_progress}
              failed={pipeline.tier2.failed}
              pending={pipeline.tier2.pending}
              total={tier2Total}
              notEligible={pipeline.tier2.not_eligible}
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreChart data={distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recently Scored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recent.map((company) => (
                <a
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{company.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {company.provincia} {company.sector ? `· ${company.sector}` : ""}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <span className={`text-sm font-semibold ${scoreColor(company.priority_score)}`}>
                      {formatScore(company.priority_score)}
                    </span>
                    <Badge className={tierColor(company.outreach_tier)} variant="outline">
                      {company.outreach_tier}
                    </Badge>
                  </div>
                </a>
              ))}
              {metrics.recent.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No scored companies yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FunnelStep label="Total" value={metrics.total} />
            <FunnelArrow />
            <FunnelStep label="Tier 1 Done" value={pipeline.tier1.completed} />
            <FunnelArrow />
            <FunnelStep label="Scored" value={scored} />
            <FunnelArrow />
            <FunnelStep label="Hot" value={metrics.hot} color="text-red-600 dark:text-red-400" />
            <FunnelArrow />
            <FunnelStep label="Warm" value={metrics.warm} color="text-orange-600 dark:text-orange-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  valueColor = "",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          {icon}
        </div>
        <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function FunnelStep({ label, value, color = "" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex-1 rounded-lg border bg-card p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{formatNumber(value)}</p>
    </div>
  );
}

function FunnelArrow() {
  return <span className="text-muted-foreground">→</span>;
}
