/**
 * Key Metrics Grid Component
 *
 * Displays the 4 primary analytics metrics
 */

import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";
import type { KeyMetrics, MetricData } from "@/types/analytics";

/**
 * Key Metrics Grid Props
 */
interface KeyMetricsGridProps {
  metrics: KeyMetrics;
  isLoading?: boolean;
}

/**
 * Key Metrics Grid
 *
 * Displays a 4-column grid of key analytics metrics with trend indicators.
 */
export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({
  metrics,
  isLoading = false,
}) => {
  const metricList: MetricData[] = [
    metrics.timeWeightedReturn,
    metrics.maxDrawdown,
    metrics.sharpe,
    metrics.winRate,
  ];

  const labels = [
    "Time-Weighted Return",
    "Max Drawdown",
    "Sharpe Ratio",
    "Win Rate",
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metricList.map((metric, idx) => (
        <BaseCard
          key={idx}
          variant="glass"
          className="p-4 relative overflow-hidden group"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              {labels[idx]}
            </span>
            {isLoading ? (
              // Skeleton: Trend indicator
              <div className="w-6 h-6 bg-gray-800/50 rounded animate-pulse" />
            ) : (
              <span
                className={`p-1 rounded flex items-center justify-center ${
                  metric.trend === "up"
                    ? "bg-green-500/10 text-green-400"
                    : metric.trend === "down"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-gray-500/10 text-gray-400"
                }`}
              >
                {metric.trend === "up" ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : metric.trend === "down" ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
          {isLoading ? (
            // Skeleton: Value and sub-value
            <>
              <div className="h-7 w-20 bg-gray-700/50 rounded mb-2 animate-pulse" />
              <div className="h-3 w-24 bg-gray-800/50 rounded animate-pulse" />
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-white tracking-tight mb-1">
                {metric.value}
              </div>
              <div className="text-xs text-gray-400">{metric.subValue}</div>
            </>
          )}
        </BaseCard>
      ))}
    </div>
  );
};
