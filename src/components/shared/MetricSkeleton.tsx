import { Skeleton } from "@/components/ui/LoadingSystem";

/**
 * Base Metric Skeleton Component
 *
 * Reusable skeleton components for metric displays.
 * Uses composition pattern to reduce duplication across metric components.
 */

interface MetricValueSkeletonProps {
  width?: string;
  height?: string;
  withIcon?: boolean;
  iconSize?: string;
}

/**
 * Skeleton for metric value with optional info icon
 */
export function MetricValueSkeleton({
  width = "140px",
  height = "32px",
  withIcon = false,
  iconSize = "16px",
}: MetricValueSkeletonProps) {
  return (
    <div className="flex items-center gap-2 mb-0.5">
      <Skeleton variant="text" width={width} height={height} />
      {withIcon && (
        <Skeleton variant="circular" width={iconSize} height={iconSize} />
      )}
    </div>
  );
}

interface MetricLabelSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

/**
 * Skeleton for metric label
 */
export function MetricLabelSkeleton({
  width = "120px",
  height = "14px",
  className = "mb-4",
}: MetricLabelSkeletonProps) {
  return (
    <Skeleton variant="text" width={width} height={height} className={className} />
  );
}

interface MetricColumnSkeletonProps {
  valueWidth?: string;
  valueHeight?: string;
  labelWidth?: string;
  labelHeight?: string;
  withIcon?: boolean;
  iconSize?: string;
}

/**
 * Skeleton for a metric column (value + label stacked vertically)
 */
export function MetricColumnSkeleton({
  valueWidth = "100px",
  valueHeight = "20px",
  labelWidth = "80px",
  labelHeight = "12px",
  withIcon = false,
  iconSize = "12px",
}: MetricColumnSkeletonProps) {
  return (
    <div className="flex flex-col items-center">
      {withIcon ? (
        <div className="flex items-center gap-1.5">
          <Skeleton variant="text" width={valueWidth} height={valueHeight} />
          <Skeleton variant="circular" width={iconSize} height={iconSize} />
        </div>
      ) : (
        <Skeleton variant="text" width={valueWidth} height={valueHeight} />
      )}
      <Skeleton
        variant="text"
        width={labelWidth}
        height={labelHeight}
        className="mt-0.5"
      />
    </div>
  );
}

/**
 * Skeleton for ROI section (primary metric with icon + label)
 */
export function ROISectionSkeleton() {
  return (
    <>
      <MetricValueSkeleton width="140px" height="32px" withIcon iconSize="16px" />
      <MetricLabelSkeleton width="120px" height="14px" className="mb-4" />
    </>
  );
}

/**
 * Skeleton for Yearly PnL section (value + label column)
 */
export function YearlyPnLSkeleton() {
  return (
    <MetricColumnSkeleton
      valueWidth="100px"
      valueHeight="20px"
      labelWidth="80px"
      labelHeight="12px"
    />
  );
}

/**
 * Skeleton for Daily Yield section (value with icon + label column)
 */
export function YieldSectionSkeleton() {
  return (
    <MetricColumnSkeleton
      valueWidth="80px"
      valueHeight="20px"
      labelWidth="70px"
      labelHeight="12px"
      withIcon
      iconSize="12px"
    />
  );
}

/**
 * Full consolidated metric skeleton (ROI + Yearly PnL + Daily Yield)
 */
export function ConsolidatedMetricSkeleton() {
  return (
    <>
      {/* ROI Primary Metric */}
      <ROISectionSkeleton />

      {/* Secondary Metrics Row */}
      <div className="flex items-center gap-6 text-sm">
        {/* Yearly PnL */}
        <YearlyPnLSkeleton />

        <div className="w-px h-8 bg-gray-800" />

        {/* Daily Yield */}
        <YieldSectionSkeleton />
      </div>
    </>
  );
}
