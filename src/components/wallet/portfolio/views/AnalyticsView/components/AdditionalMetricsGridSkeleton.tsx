/**
 * Additional Metrics Grid Skeleton
 *
 * Content-aware loading state showing real metric labels
 * with skeleton placeholders only for values
 */

import { Activity } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Metric labels matching AdditionalMetricsGrid.tsx
 */
const METRIC_LABELS = [
  "Sortino Ratio",
  "Beta (vs BTC)",
  "Volatility",
  "Alpha",
];

/**
 * Additional Metrics Grid Skeleton
 *
 * Displays 4 cards with real labels, skeleton for values
 */
export function AdditionalMetricsGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      role="status"
      aria-label="Loading additional metrics"
    >
      {METRIC_LABELS.map((label, i) => (
        <BaseCard
          key={i}
          variant="glass"
          className="p-4"
          data-testid="additional-metric-skeleton"
          aria-hidden="true"
        >
          {/* Real Icon + Label */}
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs font-medium text-gray-500">{label}</span>
          </div>

          {/* Skeleton: Value */}
          <div className="h-6 w-16 bg-gray-700/50 rounded mb-1 animate-pulse" />

          {/* Skeleton: Sub value */}
          <div className="h-2.5 w-24 bg-gray-800/50 rounded animate-pulse" />
        </BaseCard>
      ))}
      <span className="sr-only">Loading additional metrics...</span>
    </div>
  );
}
