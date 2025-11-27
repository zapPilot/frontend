import { DollarSign, Info, Percent } from "lucide-react";
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
import type { PerformanceMetricsProps } from "../performance/types";
import { ConsolidatedMetricSkeleton } from "./ConsolidatedMetricSkeleton";
import {
  ROISectionSkeleton,
  YearlyPnLSkeleton,
  YieldSectionSkeleton,
} from "./PartialConsolidatedSkeleton";

/**
 * Variation 2: Minimal Clean version with maximum height reduction (40-50%).
 *
 * Key changes from original:
 * - Ultra-compact padding: p-3 instead of p-6
 * - Smallest fonts: text-base/lg for ROI, text-xs for secondary
 * - Dual-row layout: ROI primary, PnL/Yield inline below
 * - Minimal spacing: mb-0.5, gap-2
 *
 * @example
 * ```tsx
 * <ConsolidatedMetricV2Minimal portfolioROI={roiData} />
 * ```
 */
export function ConsolidatedMetricV2Minimal({
  portfolioROI,
  yieldSummaryData,
  shouldShowLoading = true,
  isLandingLoading = false,
  isYieldLoading = false,
}: PerformanceMetricsProps) {
  const metricLogger = React.useMemo(
    () => createContextLogger("ConsolidatedMetricV2Minimal"),
    []
  );
  const roiTooltip = useMetricsTooltip<HTMLButtonElement>();
  const yieldTooltip = useMetricsTooltip<HTMLButtonElement>();

  const isROILoading = shouldShowLoading && (isLandingLoading || portfolioROI === undefined);
  const isYieldDataLoading = shouldShowLoading && (isYieldLoading || yieldSummaryData === undefined);
  const isFullyLoading = isROILoading && isYieldDataLoading;

  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows ? selectBestYieldWindow(yieldWindows) : null;
  const hasYieldData = selectedYieldWindow !== null;

  React.useEffect(() => {
    if (!hasYieldData && yieldSummaryData !== undefined) {
      metricLogger.debug("No valid yield window selected", {
        windowsAvailable: yieldWindows ? Object.keys(yieldWindows) : [],
        rawData: yieldSummaryData,
      });
    }
  }, [hasYieldData, metricLogger, yieldSummaryData, yieldWindows]);

  const sortedProtocolBreakdown = React.useMemo(() => {
    const protocolYieldBreakdown = selectedYieldWindow?.window.protocol_breakdown ?? [];
    return sortProtocolsByTodayYield(protocolYieldBreakdown);
  }, [selectedYieldWindow]);

  // Minimal card with p-3
  const MinimalCard = ({ children, isLoading = false }: { children: React.ReactNode; isLoading?: boolean }) => (
    <div
      className={`bg-gray-900/50 border border-gray-800 rounded-xl p-3 h-full flex flex-col items-center justify-center transition-colors hover:border-gray-700 ${
        isLoading ? "animate-pulse" : ""
      }`}
    >
      {children}
    </div>
  );

  if (isFullyLoading) {
    return (
      <MinimalCard isLoading={true}>
        <ConsolidatedMetricSkeleton />
      </MinimalCard>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  const roiValue = portfolioROI?.recommended_yearly_roi ?? 0;
  const roiAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const roiColor = roiValue >= 0 ? "text-green-400" : "text-red-400";
  const yieldValue = selectedYieldWindow?.window.median_daily_yield_usd ?? 0;
  const outliersRemoved = selectedYieldWindow?.window.statistics.outliers_removed ?? 0;

  return (
    <MinimalCard>
      {/* ROI Primary - Minimal */}
      {isROILoading ? (
        <ROISectionSkeleton />
      ) : (
        <div className="flex items-center gap-1.5 mb-0.5">
          {/* Smallest font: text-base/lg */}
          <span className={`text-base md:text-lg font-bold ${roiColor} tracking-tight`}>
            {formatPercent(roiValue)}
          </span>
          <button
            ref={roiTooltip.triggerRef}
            onClick={roiTooltip.toggle}
            className="text-gray-600 hover:text-gray-300"
            aria-label="ROI"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Label */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-medium">
        Yearly ROI
      </div>

      {/* Secondary Metrics Inline - Ultra-compact */}
      <div className="flex items-center gap-2 text-xs">
        {isROILoading ? (
          <YearlyPnLSkeleton />
        ) : (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-500" />
            <span className="text-gray-300">{formatCurrency(roiAmount)}</span>
          </div>
        )}

        <div className="w-px h-4 bg-gray-800" />

        {isYieldDataLoading ? (
          <YieldSectionSkeleton />
        ) : (
          <div className="flex items-center gap-1">
            <Percent className="w-3 h-3 text-purple-400" />
            <span className="text-gray-300">{hasYieldData ? formatCurrency(yieldValue) : "N/A"}</span>
            <button
              ref={yieldTooltip.triggerRef}
              onClick={yieldTooltip.toggle}
              className="text-gray-600 hover:text-gray-300"
              aria-label="Yield"
            >
              <Info className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tooltips */}
      {roiTooltip.visible && portfolioROI && !isROILoading && (
        <ROITooltip
          tooltipRef={roiTooltip.tooltipRef}
          position={roiTooltip.position}
          windows={
            portfolioROI.windows
              ? Object.entries(portfolioROI.windows)
                  .map(([key, value]: [string, { value: number; data_points: number }]) => ({
                    key,
                    label: formatRoiWindowLabel(key),
                    value: value.value,
                    dataPoints: value.data_points,
                  }))
                  .sort((a, b) => deriveRoiWindowSortScore(a.key) - deriveRoiWindowSortScore(b.key))
              : []
          }
          protocols={[]}
          recommendedPeriodLabel={portfolioROI.recommended_period?.replace("roi_", "") || null}
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
    </MinimalCard>
  );
}
