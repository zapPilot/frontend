import {
    ComparisonMetricCard,
    type ComparisonMetricCardProps,
} from "../../ComparisonMetricCard";
import type { BacktestMetricsProps } from "../BacktestMetrics";
import { buildMetrics } from "./metricsUtils";

interface KeyMetricsGroupProps extends Pick<BacktestMetricsProps, "summary" | "sortedStrategyIds"> {
  className?: string;
  cardClassName?: string;
}

export function KeyMetricsGroup({
  summary,
  sortedStrategyIds,
  className,
  cardClassName,
}: KeyMetricsGroupProps) {
  const metrics: {
    key: string;
    props: Omit<ComparisonMetricCardProps, "metrics">;
    dataKey: Parameters<typeof buildMetrics>[0];
    format: Parameters<typeof buildMetrics>[3];
  }[] = [
    {
      key: "roi",
      props: { label: "ROI", unit: "%", highlightMode: "highest" },
      dataKey: "roi_percent",
      format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
    },
    {
      key: "calmar",
      props: { label: "Calmar Ratio", highlightMode: "highest" },
      dataKey: "calmar_ratio",
      format: (v) => v.toFixed(2),
    },
    {
      key: "mdd",
      props: { label: "Max Drawdown", unit: "%", highlightMode: "lowest" },
      dataKey: "max_drawdown_percent",
      format: (v) => `${v.toFixed(1)}%`,
    },
  ];

  return (
    <div className={className}>
      {metrics.map((m) => (
        <div key={m.key} className={cardClassName}>
          <ComparisonMetricCard
            {...m.props}
            metrics={buildMetrics(
              m.dataKey,
              sortedStrategyIds,
              summary?.strategies,
              m.format
            )}
          />
        </div>
      ))}
    </div>
  );
}
