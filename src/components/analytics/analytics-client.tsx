"use client";

import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tierColor, formatNumber } from "@/lib/utils";

interface Analytics {
  topSectors: { name: string; count: number; avgScore: number }[];
  byProvincia: { name: string; count: number; hot: number; warm: number; cold: number; avgScore: number }[];
  cmsDist: { name: string; count: number }[];
  topWeaknesses: { name: string; count: number }[];
  sizeDist: { name: string; count: number; avgScore: number }[];
  emailDist: { name: string; count: number }[];
}

interface Metrics {
  total: number;
  tier1_completed: number;
  tier2_completed: number;
  hot: number;
  warm: number;
  cold: number;
  disqualified: number;
}

interface Props {
  analytics: Analytics;
  distribution: { range: string; count: number }[];
  metrics: Metrics;
}

const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#94a3b8", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6"];

export function AnalyticsClient({ analytics, distribution, metrics }: Props) {
  const router = useRouter();
  const scored = metrics.hot + metrics.warm + metrics.cold + metrics.disqualified;

  const goToCompanies = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params);
    router.push(`/companies?${sp.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Insights from {formatNumber(scored)} scored companies — click any item to drill down
        </p>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  className="cursor-pointer"
                  onClick={(_data: unknown, _idx: number, e: React.MouseEvent) => {
                    const d = _data as { range?: string };
                    if (d.range) {
                      const [min, max] = d.range.split("-").map(Number);
                      goToCompanies({ score_min: String(min), score_max: String(max) });
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Sectors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Top Sectors by Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topSectors.slice(0, 15)} layout="vertical" margin={{ left: 120 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    formatter={(value) => [`${value} companies`, "Count"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    className="cursor-pointer"
                    onClick={(_data: unknown) => { const d = _data as { name?: string }; if (d.name) goToCompanies({ sector: d.name }); }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CMS Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>CMS Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.cmsDist.slice(0, 8)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: "var(--color-muted-foreground)" }}
                    onClick={(_, index) => {
                      const cms = analytics.cmsDist[index]?.name;
                      if (cms) goToCompanies({ cms });
                    }}
                    className="cursor-pointer"
                  >
                    {analytics.cmsDist.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Email Availability */}
        {analytics.emailDist.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Email Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.emailDist}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: "var(--color-muted-foreground)" }}
                      onClick={(_, index) => {
                        if (index === 0) goToCompanies({ has_email: "true" });
                      }}
                      className="cursor-pointer"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#94a3b8" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weakness Frequency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Most Common Weaknesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topWeaknesses} layout="vertical" margin={{ left: 150 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Company Size Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Company Size Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.sizeDist}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="Count"
                    className="cursor-pointer"
                    onClick={(_data: unknown) => { const d = _data as { name?: string }; if (d.name) goToCompanies({ size: d.name }); }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-center gap-4">
              {analytics.sizeDist.map((s) => (
                <button
                  key={s.name}
                  className="rounded-lg p-2 text-center transition-colors hover:bg-accent"
                  onClick={() => goToCompanies({ size: s.name })}
                >
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                  <p className="text-sm font-medium">Avg: {s.avgScore}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Geographic Distribution (by Provincia)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Provincia</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-right">Hot</th>
                  <th className="p-2 text-right">Warm</th>
                  <th className="p-2 text-right">Cold</th>
                  <th className="p-2 text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byProvincia.slice(0, 30).map((p) => (
                  <tr
                    key={p.name}
                    className="cursor-pointer border-b transition-colors hover:bg-accent/50"
                    onClick={() => goToCompanies({ provincia: p.name })}
                  >
                    <td className="p-2 font-medium text-primary underline-offset-2 hover:underline">{p.name}</td>
                    <td className="p-2 text-right">{formatNumber(p.count)}</td>
                    <td className="p-2 text-right">
                      <button onClick={(e) => { e.stopPropagation(); goToCompanies({ provincia: p.name, tier: "hot" }); }}>
                        <Badge className={tierColor("hot")} variant="outline">{p.hot}</Badge>
                      </button>
                    </td>
                    <td className="p-2 text-right">
                      <button onClick={(e) => { e.stopPropagation(); goToCompanies({ provincia: p.name, tier: "warm" }); }}>
                        <Badge className={tierColor("warm")} variant="outline">{p.warm}</Badge>
                      </button>
                    </td>
                    <td className="p-2 text-right">
                      <button onClick={(e) => { e.stopPropagation(); goToCompanies({ provincia: p.name, tier: "cold" }); }}>
                        <Badge className={tierColor("cold")} variant="outline">{p.cold}</Badge>
                      </button>
                    </td>
                    <td className="p-2 text-right font-medium">{p.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tier Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tier Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2">
            {[
              { label: "Total", value: metrics.total, color: "", tier: "" },
              { label: "Reachable (T1)", value: metrics.tier1_completed, color: "", tier: "" },
              { label: "Scored (T2)", value: scored, color: "", tier: "" },
              { label: "Hot", value: metrics.hot, color: "text-red-600", tier: "hot" },
              { label: "Warm", value: metrics.warm, color: "text-orange-600", tier: "warm" },
              { label: "Cold", value: metrics.cold, color: "text-blue-600", tier: "cold" },
            ].map(({ label, value, color, tier }, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  className="rounded-lg border bg-card px-4 py-3 text-center min-w-[100px] transition-colors hover:bg-accent"
                  onClick={() => tier && goToCompanies({ tier })}
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{formatNumber(value)}</p>
                </button>
                {i < 5 && <span className="text-muted-foreground">-&gt;</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
