import { Info, TrendingUp } from "lucide-react";

import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import { useMetricState } from "@/hooks/useMetricState";
import { getChangeColorClasses } from "@/lib/color-utils";
import { formatPercentage } from "@/lib/formatters";

import {
  deriveRoiWindowSortScore,
  formatRoiWindowLabel,
} from "../../../lib/roi";
import type { LandingPageResponse } from "../../../services/analyticsService";
import { ProtocolROIItem, ROITooltip, useMetricsTooltip } from "../tooltips";

interface ROIMetricProps {
  /** Portfolio ROI data containing windows and recommendations */
  portfolioROI?: LandingPageResponse["portfolio_roi"] | null | undefined;
  /** Is the landing page data loading? */
  isLoading?: boolean;
  /** Should show loading state? (from portfolio state helpers) */
  shouldShowLoading?: boolean;
  /** Portfolio change percentage for color coding */
  portfolioChangePercentage: number;
  /** Is user connected? (affects "Potential" label) */
  isConnected: boolean;
  /** User has error state */
  errorMessage?: string | null | undefined;
}

/**
 * Displays portfolio ROI with APR thresholds and recommendations.
 *
 * Extracted from WalletMetrics (lines 166-220) to create a focused,
 * single-responsibility component for ROI display.
 *
 * Features:
 * - Estimated yearly ROI with color-coded performance indicator
 * - Period-based calculation (7d, 30d, 365d)
 * - Interactive tooltip with detailed breakdown
 * - "Potential" label for disconnected visitors
 *
 * @example
 * ```tsx
 * <ROIMetric
 *   portfolioROI={data?.portfolio_roi}
 *   portfolioChangePercentage={5.2}
 *   isConnected={true}
 *   isLoading={false}
 * />
 * ```
 */
export function ROIMetric({
  portfolioROI,
  isLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  isConnected,
  errorMessage,
}: ROIMetricProps) {
  // Tooltip state
  const roiTooltip = useMetricsTooltip<HTMLSpanElement>();

  // Use recommended_yearly_roi directly from API (as percentage, not decimal)
  const estimatedYearlyROI = portfolioROI?.recommended_yearly_roi
    ? portfolioROI.recommended_yearly_roi / 100
    : null;

  const metricState = useMetricState({
    isLoading,
    shouldShowLoading,
    value: estimatedYearlyROI,
  });

  // Loading state
  if (metricState.shouldRenderSkeleton) {
    return (
      <div>
        <div className="flex items-center space-x-1 mb-1">
          <p className="text-sm text-gray-400">
            Estimated Yearly ROI{!isConnected ? " (Potential)" : ""}
          </p>
        </div>
        <WalletMetricsSkeleton showValue={true} showPercentage={false} />
      </div>
    );
  }

  // Error state - show welcome for new users (handled in parent)
  if (errorMessage === "USER_NOT_FOUND") {
    return null;
  }

  // No data available
  if (!estimatedYearlyROI) {
    return (
      <div>
        <div className="flex items-center space-x-1 mb-1">
          <p className="text-sm text-gray-400">
            Estimated Yearly ROI{!isConnected ? " (Potential)" : ""}
          </p>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="text-xl font-semibold">No data available</span>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for tooltip
  const roiWindows = portfolioROI?.windows
    ? Object.entries(portfolioROI.windows)
        .map(
          ([key, value]: [string, { value: number; data_points: number }]) => ({
            key,
            label: formatRoiWindowLabel(key),
            value: value.value,
            dataPoints: value.data_points,
          })
        )
        .sort(
          (a, b) =>
            deriveRoiWindowSortScore(a.key) - deriveRoiWindowSortScore(b.key)
        )
    : [];

  const protocolROIData: ProtocolROIItem[] = [];

  const recommendedPeriodLabel: string | null = (() => {
    const rawLabel =
      portfolioROI?.recommended_period?.replace("roi_", "") ||
      portfolioROI?.recommended_roi_period?.replace("roi_", "") ||
      (portfolioROI?.windows &&
      Object.prototype.hasOwnProperty.call(portfolioROI.windows, "roi_30d")
        ? "30d"
        : !isConnected
          ? "30d"
          : undefined);
    if (!rawLabel) {
      return null;
    }

    const compactFormatPattern = /^\d+(d|w|m|y)$/i;
    return compactFormatPattern.test(rawLabel)
      ? rawLabel
      : formatRoiWindowLabel(rawLabel);
  })();

  // Normal display with data
  return (
    <div>
      <div className="flex items-center space-x-1 mb-1">
        <p className="text-sm text-gray-400">
          Estimated Yearly ROI{!isConnected ? " (Potential)" : ""}
        </p>
        {portfolioROI && (
          <div className="relative">
            <span
              ref={roiTooltip.triggerRef}
              onClick={roiTooltip.toggle}
              onKeyDown={e => e.key === "Enter" && roiTooltip.toggle()}
              role="button"
              tabIndex={0}
              aria-label="Portfolio ROI tooltip"
              className="inline-flex"
            >
              {" "}
              <Info
                className="w-3 h-3 text-gray-500 cursor-help"
                aria-hidden="true"
                focusable="false"
              />
            </span>
            {roiTooltip.visible && (
              <ROITooltip
                tooltipRef={roiTooltip.tooltipRef}
                position={roiTooltip.position}
                windows={roiWindows}
                protocols={protocolROIData}
                recommendedPeriodLabel={recommendedPeriodLabel}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div
          className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioChangePercentage)}`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-xl font-semibold">
            {formatPercentage(estimatedYearlyROI * 100, false, 2)}
          </span>
          <span className="text-xs text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded-full">
            est.
          </span>
        </div>
        {recommendedPeriodLabel && (
          <span className="text-xs text-gray-500 font-normal mt-1">
            Based on {recommendedPeriodLabel} performance data
          </span>
        )}
      </div>
    </div>
  );
}
