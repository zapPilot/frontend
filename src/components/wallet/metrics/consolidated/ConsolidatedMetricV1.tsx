import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";

import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { createContextLogger } from "@/utils/logger";

import {
  ROITooltip,
  selectBestYieldWindow,
  useMetricsTooltip,
  YieldBreakdownTooltip,
} from "../../tooltips";
import { MetricCard } from "../MetricCard";
import type { PerformanceMetricsProps } from "../performance/types";
import { ConsolidatedMetricSkeleton } from "./ConsolidatedMetricSkeleton";
import {
  ROISectionSkeleton,
  YearlyPnLSkeleton,
  YieldSectionSkeleton,
} from "./PartialConsolidatedSkeleton";

export function ConsolidatedMetricV1({
  portfolioROI,
  yieldSummaryData,
  shouldShowLoading = true,
  isLandingLoading = false,
  isYieldLoading = false,
}: PerformanceMetricsProps) {
  const metricLogger = React.useMemo(
    () => createContextLogger("ConsolidatedMetricV1"),
    []
  );
  const roiTooltip = useMetricsTooltip<HTMLButtonElement>();
  const yieldTooltip = useMetricsTooltip<HTMLButtonElement>();

  // Progressive loading: track each data source independently
  const isROILoading =
    shouldShowLoading && (isLandingLoading || portfolioROI === undefined);
  const isYieldDataLoading =
    shouldShowLoading && (isYieldLoading || yieldSummaryData === undefined);
  const isFullyLoading = isROILoading && isYieldDataLoading;

  // Yield Data (must be before early return for hooks)
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;
  const hasYieldData = selectedYieldWindow !== null;

  // Debug logging for missing yield data (must be before early return)
  React.useEffect(() => {
    if (!hasYieldData && yieldSummaryData !== undefined) {
      metricLogger.debug("No valid yield window selected", {
        windowsAvailable: yieldWindows ? Object.keys(yieldWindows) : [],
        rawData: yieldSummaryData,
      });
    }
  }, [hasYieldData, metricLogger, yieldSummaryData, yieldWindows]);

  // Yield Breakdown for Tooltip (must be before early return)
  const sortedProtocolBreakdown = React.useMemo(() => {
    const protocolYieldBreakdown =
      selectedYieldWindow?.window.protocol_breakdown ?? [];
    return sortProtocolsByTodayYield(protocolYieldBreakdown);
  }, [selectedYieldWindow]);

  // Show full skeleton only when BOTH data sources are loading
  if (isFullyLoading) {
    return (
      <MetricCard icon={TrendingUp} isLoading={true}>
        <ConsolidatedMetricSkeleton />
      </MetricCard>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // ROI Data (safe to access after isLoading check)
  const roiValue = portfolioROI?.recommended_yearly_roi ?? 0;
  const roiAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const roiColor = roiValue >= 0 ? "text-green-400" : "text-red-400";

  const yieldValue = selectedYieldWindow?.window.median_daily_yield_usd ?? 0;
  const outliersRemoved =
    selectedYieldWindow?.window.statistics.outliers_removed ?? 0;

  return (
    <MetricCard icon={TrendingUp}>
      {/* ROI Section - Progressive Loading */}
      {isROILoading ? (
        <ROISectionSkeleton />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-2xl md:text-3xl font-bold ${roiColor} tracking-tight`}
            >
              {formatPercent(roiValue)}
            </span>
            <button
              ref={roiTooltip.triggerRef}
              onClick={roiTooltip.toggle}
              className="text-gray-600 hover:text-gray-300 transition-colors"
              aria-label="ROI Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-medium">
            Est. Yearly ROI
          </div>
        </>
      )}

      {/* Secondary Metrics Row */}
      <div className="flex items-center gap-6 text-sm">
        {/* Yearly PnL - Progressive Loading */}
        {isROILoading ? (
          <YearlyPnLSkeleton />
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-gray-300 font-medium text-base">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span>{formatCurrency(roiAmount)}</span>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">
              Yearly PnL
            </span>
          </div>
        )}

        <div className="w-px h-8 bg-gray-800" />

        {/* Daily Yield - Progressive Loading */}
        {isYieldDataLoading ? (
          <YieldSectionSkeleton />
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-gray-300 font-medium text-base">
              <Percent className="w-4 h-4 text-purple-400" />
              <span>{hasYieldData ? formatCurrency(yieldValue) : "N/A"}</span>
              <button
                ref={yieldTooltip.triggerRef}
                onClick={yieldTooltip.toggle}
                className="text-gray-600 hover:text-gray-300 transition-colors"
                aria-label="Yield Info"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">
              Daily Yield
            </span>
          </div>
        )}
      </div>

      {/* Tooltips - Only when data available */}
      {roiTooltip.visible && portfolioROI && !isROILoading && (
        <ROITooltip
          tooltipRef={roiTooltip.tooltipRef}
          position={roiTooltip.position}
          windows={
            portfolioROI.windows
              ? Object.entries(portfolioROI.windows)
                  .map(
                    ([key, value]: [
                      string,
                      { value: number; data_points: number },
                    ]) => ({
                      key,
                      label: formatRoiWindowLabel(key),
                      value: value.value,
                      dataPoints: value.data_points,
                    })
                  )
                  .sort(
                    (a, b) =>
                      deriveRoiWindowSortScore(a.key) -
                      deriveRoiWindowSortScore(b.key)
                  )
              : []
          }
          protocols={[]}
          recommendedPeriodLabel={
            portfolioROI.recommended_period?.replace("roi_", "") || null
          }
        />
      )}
      {yieldTooltip.visible && !isYieldDataLoading && (
        <YieldBreakdownTooltip
          tooltipRef={yieldTooltip.tooltipRef}
          position={yieldTooltip.position}
          selectedWindow={selectedYieldWindow}
          allWindows={yieldWindows}
          breakdown={sortedProtocolBreakdown}
          outliersRemoved={outliersRemoved}
        />
      )}
    </MetricCard>
  );
}
