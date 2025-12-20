/**
 * Additional Metrics Grid Component
 *
 * Displays secondary analytics metrics (Sortino, Beta, Volatility, Alpha)
 */

import { Activity } from "lucide-react";

import type { KeyMetrics } from "@/types/analytics";

import { AnalyticsMetricCard } from "./AnalyticsMetricCard";

/**
 * Additional Metrics Grid Props
 */
interface AdditionalMetricsGridProps {
  metrics: KeyMetrics;
}

/**
 * Additional Metrics Grid
 *
 * Displays a 4-column grid of additional analytics metrics.
 */
export const AdditionalMetricsGrid: React.FC<AdditionalMetricsGridProps> = ({
  metrics,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <AnalyticsMetricCard
      icon={Activity}
      label="Sortino Ratio"
      value={metrics.sortino?.value || "N/A"}
      subValue={metrics.sortino?.subValue || "Coming soon"}
    />
    <AnalyticsMetricCard
      icon={Activity}
      label="Beta (vs BTC)"
      value={metrics.beta?.value || "N/A"}
      subValue={metrics.beta?.subValue || "vs BTC"}
    />
    <AnalyticsMetricCard
      icon={Activity}
      label="Volatility"
      value={metrics.volatility.value}
      subValue={metrics.volatility.subValue}
    />
    <AnalyticsMetricCard
      icon={Activity}
      label="Alpha"
      value={metrics.alpha?.value || "N/A"}
      subValue={metrics.alpha?.subValue || "Excess Return"}
      {...(metrics.alpha?.value?.startsWith("+") && {
        valueColor: "text-green-400",
      })}
    />
  </div>
);
