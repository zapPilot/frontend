import { useMemo } from "react";

import { ComparisonMetricCard } from "../../ComparisonMetricCard";
import type { BacktestMetricsProps } from "../BacktestMetrics";
import { buildMetrics, hasBorrowingMetrics } from "./metricsUtils";

interface SecondaryMetricsGridProps extends Pick<BacktestMetricsProps, "summary" | "sortedStrategyIds"> {
  className?: string;
}

interface GridMetricConfig {
  label: string;
  unit?: string;
  highlightMode: "highest" | "lowest";
  dataKey: Parameters<typeof buildMetrics>[0];
  format: (v: number) => string;
}

const BASE_METRICS: GridMetricConfig[] = [
  { label: "Final Value", unit: "$", highlightMode: "highest", dataKey: "final_value", format: (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
  { label: "Sharpe Ratio", highlightMode: "highest", dataKey: "sharpe_ratio", format: (v) => v.toFixed(2) },
  { label: "Sortino Ratio", highlightMode: "highest", dataKey: "sortino_ratio", format: (v) => v.toFixed(2) },
  { label: "Volatility", unit: "%", highlightMode: "lowest", dataKey: "volatility", format: (v) => `${(v * 100).toFixed(1)}%` },
  { label: "Beta", highlightMode: "lowest", dataKey: "beta", format: (v) => v.toFixed(2) },
];

const LEVERAGE_METRICS: GridMetricConfig[] = [
  { label: "Borrow Events", highlightMode: "highest", dataKey: "total_borrow_events", format: (v) => String(v) },
  { label: "Interest Paid", unit: "$", highlightMode: "lowest", dataKey: "total_interest_paid", format: (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
  { label: "Liquidations", highlightMode: "lowest", dataKey: "liquidation_events", format: (v) => String(v) },
  { label: "Time Leveraged", unit: "%", highlightMode: "highest", dataKey: "time_in_leverage_pct", format: (v) => `${v.toFixed(1)}%` },
];

export function SecondaryMetricsGrid({
  summary,
  sortedStrategyIds,
  className = "grid grid-cols-2 lg:grid-cols-4 gap-4",
}: SecondaryMetricsGridProps) {
  const allMetrics = useMemo(
    () => hasBorrowingMetrics(summary?.strategies) ? [...BASE_METRICS, ...LEVERAGE_METRICS] : BASE_METRICS,
    [summary?.strategies]
  );

  return (
    <div className={className}>
      {allMetrics.map((m) => (
        <ComparisonMetricCard
          key={m.label}
          label={m.label}
          unit={m.unit ?? ""}
          highlightMode={m.highlightMode}
          metrics={buildMetrics(m.dataKey, sortedStrategyIds, summary?.strategies, m.format)}
        />
      ))}
    </div>
  );
}
