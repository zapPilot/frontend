import { Clock, Info } from "lucide-react";

import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import { YIELD_DATA_THRESHOLDS } from "@/config/performance-thresholds";
import { useMetricState } from "@/hooks/useMetricState";
import { formatCurrency } from "@/lib/formatters";

import type {
  ProtocolYieldBreakdown,
  YieldReturnsSummaryResponse,
} from "../../../services/analyticsService";
import {
  selectBestYieldWindow,
  useMetricsTooltip,
  YieldBreakdownTooltip,
} from "../tooltips";

interface YieldMetricProps {
  /** Yield summary data with windows and breakdowns */
  yieldSummaryData?: YieldReturnsSummaryResponse | null | undefined;
  /** Is yield data loading? (independent from landing page) */
  isYieldLoading?: boolean | undefined;
  /** User has error state */
  errorMessage?: string | null | undefined;
}

/**
 * Yield display state based on data availability
 */
interface YieldState {
  status: "no_data" | "insufficient" | "low_confidence" | "normal";
  daysWithData: number;
  badge?: string;
}

/**
 * Displays average daily yield with period selection and confidence indicators.
 *
 * Extracted from WalletMetrics (lines 269-385) to create a focused,
 * single-responsibility component for yield display.
 *
 * Features:
 * - Independent loading state (separate from other metrics)
 * - Confidence badges based on data availability
 * - Interactive tooltip with protocol breakdown
 * - Outlier detection indicator
 * - "Available in X days" message for new portfolios
 *
 * @example
 * ```tsx
 * <YieldMetric
 *   yieldSummaryData={data?.yield_summary}
 *   isYieldLoading={false}
 * />
 * ```
 */
export function YieldMetric({
  yieldSummaryData,
  isYieldLoading,
  errorMessage,
}: YieldMetricProps) {
  // Tooltip state
  const yieldTooltip = useMetricsTooltip<HTMLDivElement>();

  // Get all yield windows
  const yieldWindows = yieldSummaryData?.windows;

  // Select the best window from available windows
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;

  // Extract metrics from the selected window
  const avgDailyYieldUsd = selectedYieldWindow
    ? selectedYieldWindow.window.average_daily_yield_usd
    : null;

  // Get the protocol breakdown from the selected window
  const protocolYieldBreakdown: ProtocolYieldBreakdown[] =
    selectedYieldWindow?.window.protocol_breakdown ?? [];
  const hasProtocolBreakdown = protocolYieldBreakdown.length > 0;

  // Get outliers from the selected window's statistics
  const outliersRemoved = selectedYieldWindow
    ? selectedYieldWindow.window.statistics.outliers_removed
    : 0;

  const metricState = useMetricState({
    isLoading: isYieldLoading,
    value: avgDailyYieldUsd,
  });

  /**
   * Determine yield display state based on data availability
   */
  const determineYieldState = (): YieldState => {
    if (!yieldSummaryData || avgDailyYieldUsd === null) {
      return { status: "no_data", daysWithData: 0 };
    }

    // Use selected window's data points if available
    const daysWithData = selectedYieldWindow
      ? selectedYieldWindow.window.statistics.filtered_days
      : 0;

    if (daysWithData < YIELD_DATA_THRESHOLDS.MIN_DAYS_FOR_PRELIMINARY) {
      return {
        status: "insufficient",
        daysWithData,
        badge: "Preliminary",
      };
    }

    if (daysWithData < YIELD_DATA_THRESHOLDS.MIN_DAYS_FOR_CONFIDENCE) {
      return {
        status: "low_confidence",
        daysWithData,
        badge: "Improving",
      };
    }

    return { status: "normal", daysWithData };
  };

  // Loading state (independent from other metrics)
  if (metricState.shouldRenderSkeleton) {
    return (
      <div>
        <div className="flex items-center space-x-1 mb-1">
          <p className="text-sm text-gray-400">Avg Daily Yield</p>
        </div>
        <WalletMetricsSkeleton
          showValue={true}
          showPercentage={false}
          className="w-24"
        />
      </div>
    );
  }

  // Error state - show welcome for new users (handled in parent)
  if (errorMessage === "USER_NOT_FOUND") {
    return null;
  }

  const yieldState = determineYieldState();

  // No data state - educational message
  if (yieldState.status === "no_data") {
    return (
      <div>
        <div className="flex items-center space-x-1 mb-1">
          <p className="text-sm text-gray-400">Avg Daily Yield</p>
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2 text-purple-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Available in 1 day</span>
          </div>
          <p className="text-xs text-gray-500">
            After 24 hours of portfolio activity
          </p>
        </div>
      </div>
    );
  }

  // Safety guard: formatting helpers require a numeric value
  if (avgDailyYieldUsd === null) {
    return null;
  }

  // Insufficient or low confidence state
  if (
    yieldState.status === "insufficient" ||
    yieldState.status === "low_confidence"
  ) {
    return (
      <div
        className="relative"
        ref={hasProtocolBreakdown ? yieldTooltip.triggerRef : undefined}
        onClick={hasProtocolBreakdown ? yieldTooltip.toggle : undefined}
        onKeyDown={
          hasProtocolBreakdown
            ? event => {
                if (
                  event.key === "Enter" ||
                  event.key === " " ||
                  event.key === "Spacebar"
                ) {
                  event.preventDefault();
                  yieldTooltip.toggle();
                }
              }
            : undefined
        }
        role={hasProtocolBreakdown ? "button" : undefined}
        tabIndex={hasProtocolBreakdown ? 0 : undefined}
        aria-label={
          hasProtocolBreakdown ? "Toggle yield breakdown" : undefined
        }
      >
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
        {hasProtocolBreakdown && yieldTooltip.visible && (
          <YieldBreakdownTooltip
            tooltipRef={yieldTooltip.tooltipRef}
            position={yieldTooltip.position}
            selectedWindow={selectedYieldWindow}
            allWindows={yieldWindows}
            breakdown={protocolYieldBreakdown}
            outliersRemoved={outliersRemoved}
          />
        )}
      </div>
    );
  }

  // Normal state with full confidence
  return (
    <div
      className="relative"
      ref={hasProtocolBreakdown ? yieldTooltip.triggerRef : undefined}
      onClick={hasProtocolBreakdown ? yieldTooltip.toggle : undefined}
      onKeyDown={
        hasProtocolBreakdown
          ? event => {
              if (
                event.key === "Enter" ||
                event.key === " " ||
                event.key === "Spacebar"
              ) {
                event.preventDefault();
                yieldTooltip.toggle();
              }
            }
          : undefined
      }
      role={hasProtocolBreakdown ? "button" : undefined}
      tabIndex={hasProtocolBreakdown ? 0 : undefined}
      aria-label={hasProtocolBreakdown ? "Toggle yield breakdown" : undefined}
    >
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
      {hasProtocolBreakdown && yieldTooltip.visible && (
        <YieldBreakdownTooltip
          tooltipRef={yieldTooltip.tooltipRef}
          position={yieldTooltip.position}
          selectedWindow={selectedYieldWindow}
          allWindows={yieldWindows}
          breakdown={protocolYieldBreakdown}
          outliersRemoved={outliersRemoved}
        />
      )}
    </div>
  );
}
