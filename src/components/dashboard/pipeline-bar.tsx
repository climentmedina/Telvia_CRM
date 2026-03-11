"use client";

import { formatNumber } from "@/lib/utils";

interface Props {
  completed: number;
  inProgress: number;
  failed: number;
  pending: number;
  total: number;
  notEligible?: number;
}

export function PipelineBar({ completed, inProgress, failed, pending, total, notEligible }: Props) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${pct(completed)}%` }}
          title={`Completed: ${formatNumber(completed)}`}
        />
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${pct(inProgress)}%` }}
          title={`In Progress: ${formatNumber(inProgress)}`}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${pct(failed)}%` }}
          title={`Failed: ${formatNumber(failed)}`}
        />
        {notEligible !== undefined && (
          <div
            className="bg-neutral-400 transition-all duration-500"
            style={{ width: `${pct(notEligible)}%` }}
            title={`Not eligible: ${formatNumber(notEligible)}`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendItem color="bg-green-500" label="Completed" value={completed} pct={pct(completed)} />
        <LegendItem color="bg-blue-500" label="In Progress" value={inProgress} pct={pct(inProgress)} />
        <LegendItem color="bg-red-500" label="Failed" value={failed} pct={pct(failed)} />
        <LegendItem color="bg-neutral-300" label="Pending" value={pending} pct={pct(pending)} />
        {notEligible !== undefined && (
          <LegendItem color="bg-neutral-400" label="Not Eligible" value={notEligible} pct={pct(notEligible)} />
        )}
      </div>

      <p className="text-sm font-medium">
        {formatNumber(completed)} / {formatNumber(total)} ({pct(completed).toFixed(1)}%)
      </p>
    </div>
  );
}

function LegendItem({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      {label}: {formatNumber(value)} ({pct.toFixed(1)}%)
    </span>
  );
}
