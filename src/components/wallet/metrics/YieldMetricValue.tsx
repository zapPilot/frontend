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
  const formattedValue = formatCurrency(avgDailyYieldUsd, {
    smartPrecision: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const { badgeClassName, subtitle } = resolveBadgePresentation(
    yieldState.status,
    yieldState.daysWithData
  );

  const containerClass = hasProtocolBreakdown ? "cursor-pointer" : undefined;

  return (
    <div className={containerClass}>
      <div className="flex flex-col">
        <div className="flex items-center space-x-2 text-emerald-300">
          <p className="text-xl font-semibold">{formattedValue}</p>
          {yieldState.badge && badgeClassName && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badgeClassName}`}
            >
              {yieldState.badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-xs text-gray-500 mt-1">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

function resolveBadgePresentation(
  status: YieldState["status"],
  daysWithData: number
) {
  if (status === "insufficient") {
    return {
      badgeClassName: "bg-yellow-900/20 text-yellow-400",
      subtitle: `Early estimate (${daysWithData}/7 days)`,
    };
  }

  if (status === "low_confidence") {
    return {
      badgeClassName: "bg-blue-900/20 text-blue-400",
      subtitle: `Based on ${daysWithData} days`,
    };
  }

  return {
    badgeClassName: undefined,
    subtitle: undefined,
  };
}
