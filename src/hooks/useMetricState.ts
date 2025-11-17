import { useMemo } from "react";

/**
 * Configuration for metric rendering state logic
 */
interface MetricStateConfig {
  /** Is the data currently loading? */
  isLoading?: boolean | undefined;
  /** Should we show loading UI? (from portfolio state helpers) */
  shouldShowLoading?: boolean | undefined;
  /** The metric's value */
  value?: number | null | undefined;
  /** Does the metric have data? (optional explicit flag) */
  hasData?: boolean | undefined;
}

/**
 * Computed metric rendering state
 */
interface MetricState {
  /** Should render skeleton loader */
  shouldRenderSkeleton: boolean;
  /** Should render the actual value */
  shouldRenderValue: boolean;
  /** Should render empty/no-data state */
  shouldRenderEmptyState: boolean;
}

/**
 * Encapsulates common metric rendering state logic.
 * Determines whether to show skeleton, value, or empty state based on loading
 * state and data availability.
 *
 * This hook extracts the conditional rendering logic that was duplicated across
 * Balance, ROI, PnL, and Yield displays in the monolithic WalletMetrics component.
 *
 * @example
 * ```tsx
 * const metricState = useMetricState({
 *   isLoading: isLandingLoading,
 *   shouldShowLoading,
 *   value: totalNetUsd,
 * });
 *
 * if (metricState.shouldRenderSkeleton) {
 *   return <MetricCardSkeleton label="Balance" />;
 * }
 *
 * if (metricState.shouldRenderEmptyState) {
 *   return <div>No data available</div>;
 * }
 *
 * // Render actual value
 * return <div>{formatCurrency(value)}</div>;
 * ```
 */
export function useMetricState({
  isLoading = false,
  shouldShowLoading = false,
  value,
  hasData,
}: MetricStateConfig): MetricState {
  return useMemo(() => {
    // Loading state takes precedence
    const shouldRenderSkeleton = isLoading || shouldShowLoading;

    // Determine if we have data - either explicit flag or value is present
    const hasValidData =
      hasData !== undefined ? hasData : value !== null && value !== undefined;

    // Empty state: not loading and no data
    const shouldRenderEmptyState = !shouldRenderSkeleton && !hasValidData;

    // Value state: not loading and has data
    const shouldRenderValue = !shouldRenderSkeleton && hasValidData;

    return {
      shouldRenderSkeleton,
      shouldRenderValue,
      shouldRenderEmptyState,
    };
  }, [isLoading, shouldShowLoading, value, hasData]);
}
