/**
 * Key Metrics Grid Skeleton
 *
 * Content-aware loading state showing real metric labels
 * with skeleton placeholders only for values
 */

import { Info } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Metric labels matching KeyMetricsGrid.tsx
 */
const METRIC_LABELS = [
  "Time-Weighted Return",
  "Max Drawdown",
  "Sharpe Ratio",
  "Win Rate",
];

/**
 * Key Metrics Grid Skeleton
 *
 * Displays 4 cards with real labels, skeleton for values
 */
export function KeyMetricsGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      role="status"
      aria-label="Loading key metrics"
    >
      {METRIC_LABELS.map((label, i) => (
        <BaseCard
          key={i}
          variant="glass"
          className="p-4"
          data-testid="key-metric-skeleton"
          aria-hidden="true"
        >
          {/* Real Label with info icon */}
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              {label}
              <Info className="w-3 h-3 text-gray-600" />
            </span>
            {/* Skeleton: Trend indicator */}
            <div className="w-6 h-6 bg-gray-800/50 rounded animate-pulse" />
          </div>

          {/* Skeleton: Value */}
          <div className="h-7 w-20 bg-gray-700/50 rounded mb-2 animate-pulse" />

          {/* Skeleton: Sub value */}
          <div className="h-3 w-24 bg-gray-800/50 rounded animate-pulse" />
        </BaseCard>
      ))}
      <span className="sr-only">Loading performance metrics...</span>
    </div>
  );
}
