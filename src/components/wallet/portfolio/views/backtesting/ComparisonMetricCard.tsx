import { Star } from "lucide-react";
import { useMemo } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Strategy colors for consistent visual identification.
 * Matches STRATEGY_COLORS in BacktestingView.
 */
const STRATEGY_COLORS: Record<string, string> = {
  dca_classic: "#4b5563",  // gray-600
  smart_dca: "#3b82f6",    // blue-500
  momentum: "#10b981",     // emerald-500
  mean_reversion: "#f59e0b", // amber-500
  trend_following: "#8b5cf6", // violet-500
  sentiment_dca: "#ec4899",  // pink-500
};

/**
 * Display names for strategy IDs.
 */
const STRATEGY_DISPLAY_NAMES: Record<string, string> = {
  dca_classic: "Normal DCA",
  smart_dca: "Regime Strategy",
  momentum: "Momentum",
  mean_reversion: "Mean Reversion",
  trend_following: "Trend Following",
  sentiment_dca: "Sentiment DCA",
};

export interface StrategyMetric {
  strategyId: string;
  value: number | null;
  formatted: string;
}

export interface ComparisonMetricCardProps {
  /** Metric label displayed at the top */
  label: string;
  /** Array of strategy metrics to compare */
  metrics: StrategyMetric[];
  /**
   * Determines which value is "best":
   * - "highest": Higher values are better (e.g., ROI, final value)
   * - "lowest": Lower values are better (e.g., max drawdown - less negative)
   */
  highlightMode: "highest" | "lowest";
  /** Optional unit suffix (e.g., "%", "$") */
  unit?: string;
}

/**
 * ComparisonMetricCard displays a metric comparison across multiple strategies
 * with horizontal bar visualization and sorted ranking.
 *
 * @example
 * ```tsx
 * <ComparisonMetricCard
 *   label="ROI"
 *   metrics={[
 *     { strategyId: "smart_dca", value: 45.2, formatted: "+45.2%" },
 *     { strategyId: "dca_classic", value: 38.1, formatted: "+38.1%" },
 *   ]}
 *   highlightMode="highest"
 *   unit="%"
 * />
 * ```
 */
export function ComparisonMetricCard({
  label,
  metrics,
  highlightMode,
  unit = "",
}: ComparisonMetricCardProps) {
  // Filter out null values and sort by performance
  const sortedMetrics = useMemo(() => {
    const validMetrics = metrics.filter(m => m.value !== null) as (StrategyMetric & { value: number })[];

    return validMetrics.sort((a, b) => {
      if (highlightMode === "highest") {
        return b.value - a.value; // Descending for highest
      }
      // For "lowest" mode: lower is better
      // For negative values (drawdown): less negative is better, so descending (b - a) puts best first
      // For positive values (volatility, beta): lower is better, so ascending (a - b) puts best first
      // Check if values are negative to determine sort direction
      const allNegative = validMetrics.every(m => m.value < 0);
      if (allNegative) {
        return b.value - a.value; // Descending for negatives (less negative = better)
      }
      return a.value - b.value; // Ascending for positives (lower = better)
    });
  }, [metrics, highlightMode]);

  // Calculate bar width percentages based on value range
  const barWidths = useMemo(() => {
    if (sortedMetrics.length === 0) return [];

    const values = sortedMetrics.map(m => m.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // If all values are the same, show 100% for all
    if (range === 0) {
      return sortedMetrics.map(() => 100);
    }

    // Normalize to 20-100% range for visual clarity
    return sortedMetrics.map(m => {
      const normalized = (m.value - min) / range;
      // For "lowest" mode, invert the bar (best/lowest = widest bar)
      const adjusted = highlightMode === "lowest" ? 1 - normalized : normalized;
      return 20 + adjusted * 80; // Map to 20-100% range
    });
  }, [sortedMetrics, highlightMode]);

  if (sortedMetrics.length === 0) {
    return (
      <BaseCard variant="glass" className="p-4">
        <div className="text-xs font-medium text-gray-400 mb-2">{label}</div>
        <div className="text-sm text-gray-500">No data</div>
      </BaseCard>
    );
  }

  const bestIndex = 0; // First item is always best after sorting

  return (
    <BaseCard variant="glass" className="p-4">
      {/* Label */}
      <div className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1">
        {label}
        {unit && <span className="text-gray-500">({unit})</span>}
      </div>

      {/* Visual comparison bar (shows best strategy's relative performance) */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${barWidths[0] ?? 0}%`,
            backgroundColor: sortedMetrics[0] ? STRATEGY_COLORS[sortedMetrics[0].strategyId] ?? "#3b82f6" : "#3b82f6",
          }}
        />
      </div>

      {/* Strategy ranking list */}
      <div className="space-y-2">
        {sortedMetrics.map((metric, index) => {
          const isBest = index === bestIndex;
          const color = STRATEGY_COLORS[metric.strategyId] || "#6b7280";
          const displayName = STRATEGY_DISPLAY_NAMES[metric.strategyId] || metric.strategyId.replace(/_/g, " ");

          return (
            <div
              key={metric.strategyId}
              className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                isBest ? "bg-blue-500/10" : "hover:bg-gray-800/50"
              }`}
            >
              {/* Strategy name with color dot */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span
                  className={`text-xs ${isBest ? "text-white font-medium" : "text-gray-400"}`}
                >
                  {displayName}
                </span>
              </div>

              {/* Value with optional star for best */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-mono ${
                    isBest ? "text-white font-semibold" : "text-gray-300"
                  }`}
                >
                  {metric.formatted}
                </span>
                {isBest && (
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </BaseCard>
  );
}
