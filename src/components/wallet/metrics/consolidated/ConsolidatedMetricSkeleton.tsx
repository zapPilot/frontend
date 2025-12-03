import { ConsolidatedMetricSkeleton as BaseConsolidatedMetricSkeleton } from "@/components/shared/MetricSkeleton";

/**
 * Loading skeleton for ConsolidatedMetricV1 component
 * Matches the layout of ROI + Yearly PnL + Daily Yield metrics
 *
 * Now uses base MetricSkeleton components to reduce duplication
 */
export function ConsolidatedMetricSkeleton() {
  return <BaseConsolidatedMetricSkeleton />;
}
