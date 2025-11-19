import { Info } from "lucide-react";

interface YieldMetricHeaderProps {
  /** Number of outliers removed (0 if none) */
  outliersRemoved: number;
  /** Whether protocol breakdown is available (affects cursor style) */
  hasProtocolBreakdown: boolean;
}

/**
 * Header component for YieldMetric displaying "Avg Daily Yield" label
 * with optional outliers removed indicator.
 *
 * Extracted from YieldMetric to eliminate duplicate code for:
 * - "Avg Daily Yield" label
 * - Info icon for outliers (when outliersRemoved > 0)
 * - Conditional cursor styles based on interaction availability
 *
 * @example
 * ```tsx
 * <YieldMetricHeader
 *   outliersRemoved={3}
 *   hasProtocolBreakdown={true}
 * />
 * ```
 */
export function YieldMetricHeader({
  outliersRemoved,
  hasProtocolBreakdown,
}: YieldMetricHeaderProps) {
  return (
    <div className="flex items-center space-x-1 mb-1">
      <p className="text-sm text-gray-400">Avg Daily Yield</p>
      {outliersRemoved > 0 && (
        <span
          title={`${outliersRemoved} outlier${outliersRemoved === 1 ? "" : "s"} removed for accuracy (IQR method)`}
          className={
            hasProtocolBreakdown
              ? "inline-flex cursor-pointer"
              : "inline-flex cursor-help"
          }
        >
          <Info className="w-3 h-3 text-gray-500" />
        </span>
      )}
    </div>
  );
}
