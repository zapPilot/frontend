import { formatCurrency } from "@/lib/formatters";

interface YieldState {
  status: "no_data" | "insufficient" | "low_confidence" | "normal";
  daysWithData: number;
  badge?: string;
}

interface YieldMetricValueProps {
  /** Average daily yield in USD */
  avgDailyYieldUsd: number;
  /** Yield display state (determines badge and subtitle) */
  yieldState: YieldState;
  /** Whether protocol breakdown is available (affects cursor style) */
  hasProtocolBreakdown: boolean;
}

/**
 * Value display component for YieldMetric with three variants:
 * - Preliminary: Yellow badge, shows "Early estimate (X/7 days)"
 * - Improving: Blue badge, shows "Based on X days"
 * - Normal: No badge, clean display
 *
 * Extracted from YieldMetric to eliminate duplicate code for:
 * - Currency formatting with consistent precision
 * - Conditional badge rendering (insufficient vs low_confidence)
 * - Status-specific subtitle text
 * - Cursor pointer styling
 *
 * @example
 * ```tsx
 * <YieldMetricValue
 *   avgDailyYieldUsd={12.34}
 *   yieldState={{ status: "insufficient", daysWithData: 3, badge: "Preliminary" }}
 *   hasProtocolBreakdown={true}
 * />
 * ```
 */
export function YieldMetricValue({
  avgDailyYieldUsd,
  yieldState,
  hasProtocolBreakdown,
}: YieldMetricValueProps) {
  // Preliminary or Improving state (with badge)
  if (
    yieldState.status === "insufficient" ||
    yieldState.status === "low_confidence"
  ) {
    return (
      <div className={hasProtocolBreakdown ? "cursor-pointer" : undefined}>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 text-emerald-300">
            <p className="text-xl font-semibold">
              {formatCurrency(avgDailyYieldUsd, {
                smartPrecision: true,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                yieldState.status === "insufficient"
                  ? "bg-yellow-900/20 text-yellow-400"
                  : "bg-blue-900/20 text-blue-400"
              }`}
            >
              {yieldState.badge}
            </span>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            {yieldState.status === "insufficient"
              ? `Early estimate (${yieldState.daysWithData}/7 days)`
              : `Based on ${yieldState.daysWithData} days`}
          </span>
        </div>
      </div>
    );
  }

  // Normal state (no badge)
  return (
    <div className={hasProtocolBreakdown ? "cursor-pointer" : undefined}>
      <div className="flex items-center space-x-2 text-emerald-300">
        <p className="text-xl font-semibold">
          {formatCurrency(avgDailyYieldUsd, {
            smartPrecision: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  );
}
