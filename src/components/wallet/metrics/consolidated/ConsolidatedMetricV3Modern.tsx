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
 * Variation 3: Creative Modern version with gradient accents (35-40% reduction).
 *
 * Key changes from original:
 * - Modern padding: p-4 instead of p-6
 * - Moderate font reduction: text-xl/2xl for ROI
 * - LEFT gradient accent border
 * - Grid layout for PnL/Yield (side-by-side)
 * - Badge-style labels with gradient
 *
 * @example
 * ```tsx
 * <ConsolidatedMetricV3Modern portfolioROI={roiData} />
 * ```
 */
export function ConsolidatedMetricV3Modern({
  portfolioROI,
  yieldSummaryData,
  shouldShowLoading = true,
  isLandingLoading = false,
  isYieldLoading = false,
}: PerformanceMetricsProps) {
  const metricLogger = React.useMemo(
    () => createContextLogger("ConsolidatedMetricV3Modern"),
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

  // Modern card with left gradient accent
  const ModernCard = ({ children, isLoading = false }: { children: React.ReactNode; isLoading?: boolean }) => (
    <div
      className={`relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors h-[140px] ${
        isLoading ? "animate-pulse" : ""
      }`}
    >
      {/* Left gradient accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500" />

      <div className="p-3 h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );

  if (isFullyLoading) {
    return (
      <ModernCard isLoading={true}>
        <ConsolidatedMetricSkeleton />
      </ModernCard>
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
    <ModernCard>
      {/* ROI Section with badge */}
      {isROILoading ? (
        <ROISectionSkeleton />
      ) : (
        <>
          <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 mb-0.5">
            <span className="text-[10px] text-green-400 uppercase tracking-wider font-medium">Yearly ROI</span>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-lg md:text-xl font-bold ${roiColor} tracking-tight`}>
              {formatPercent(roiValue)}
            </span>
            <button
              ref={roiTooltip.triggerRef}
              onClick={roiTooltip.toggle}
              className="text-gray-600 hover:text-gray-300"
              aria-label="ROI"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Grid layout for PnL and Yield */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* PnL Card */}
        {isROILoading ? (
          <YearlyPnLSkeleton />
        ) : (
          <div className="bg-gray-800/30 rounded-lg p-1.5 text-center">
            <div className="flex items-center justify-center gap-1 text-gray-300 font-medium text-xs mb-0.5">
              <DollarSign className="w-2.5 h-2.5 text-gray-500" />
              <span>{formatCurrency(roiAmount)}</span>
            </div>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">PnL</span>
          </div>
        )}

        {/* Yield Card */}
        {isYieldDataLoading ? (
          <YieldSectionSkeleton />
        ) : (
          <div className="bg-purple-500/10 rounded-lg p-1.5 text-center">
            <div className="flex items-center justify-center gap-1 text-gray-300 font-medium text-xs mb-0.5">
              <Percent className="w-2.5 h-2.5 text-purple-400" />
              <span>{hasYieldData ? formatCurrency(yieldValue) : "N/A"}</span>
              <button
                ref={yieldTooltip.triggerRef}
                onClick={yieldTooltip.toggle}
                className="text-gray-600 hover:text-gray-300"
                aria-label="Yield"
              >
                <Info className="w-2.5 h-2.5" />
              </button>
            </div>
            <span className="text-[9px] text-purple-400 uppercase tracking-wider">Daily</span>
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
    </ModernCard>
  );
}
