import {
  ROISectionSkeleton as BaseROISectionSkeleton,
  YearlyPnLSkeleton as BaseYearlyPnLSkeleton,
  YieldSectionSkeleton as BaseYieldSectionSkeleton,
} from "@/components/shared/MetricSkeleton";

/**
 * Partial skeleton for Daily Yield section
 * Used during progressive loading when yield data is still fetching
 *
 * Now uses base MetricSkeleton components to reduce duplication
 */
export function YieldSectionSkeleton() {
  return <BaseYieldSectionSkeleton />;
}

/**
 * Partial skeleton for ROI section (primary metric + label)
 * Used during progressive loading when ROI data is still fetching
 *
 * Now uses base MetricSkeleton components to reduce duplication
 */
export function ROISectionSkeleton() {
  return <BaseROISectionSkeleton />;
}

/**
 * Partial skeleton for Yearly PnL section
 * Used during progressive loading when landing page data is still fetching
 *
 * Now uses base MetricSkeleton components to reduce duplication
 */
export function YearlyPnLSkeleton() {
  return <BaseYearlyPnLSkeleton />;
}
