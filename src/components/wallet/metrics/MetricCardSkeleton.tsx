import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";

interface MetricCardSkeletonProps {
  /** Label text for the metric (e.g., "Balance", "ROI") */
  label: string;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Shared skeleton loading state for metric cards.
 * Displays a label with a skeleton placeholder for the value.
 *
 * Extracted from WalletMetrics to provide consistent loading UX
 * across all metric components.
 *
 * @example
 * ```tsx
 * if (metricState.shouldRenderSkeleton) {
 *   return <MetricCardSkeleton label="Balance" />;
 * }
 * ```
 */
export function MetricCardSkeleton({
  label,
  className = "",
}: MetricCardSkeletonProps) {
  return (
    <div className={className}>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <WalletMetricsSkeleton showValue={true} showPercentage={false} />
    </div>
  );
}
