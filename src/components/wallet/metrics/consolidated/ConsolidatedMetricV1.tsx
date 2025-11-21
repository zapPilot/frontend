import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import { MetricCard } from "../MetricCard";
import type { PerformanceMetricsProps } from "../performance/types";

export function ConsolidatedMetricV1({
  portfolioROI,
  yieldSummaryData,
}: PerformanceMetricsProps) {
  const roiTooltip = useMetricsTooltip<HTMLButtonElement>();
  const yieldTooltip = useMetricsTooltip<HTMLButtonElement>();

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

  // ROI Data
  const roiValue = portfolioROI?.recommended_yearly_roi ?? 0;
  const roiAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const roiColor = roiValue >= 0 ? "text-green-400" : "text-red-400";

  // Yield Data
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;
  const yieldValue = selectedYieldWindow?.window.average_daily_yield_usd ?? 0;

  // Yield Breakdown for Tooltip
  const sortedProtocolBreakdown = React.useMemo(() => {
    const protocolYieldBreakdown =
      selectedYieldWindow?.window.protocol_breakdown ?? [];
    return sortProtocolsByTodayYield(protocolYieldBreakdown);
  }, [selectedYieldWindow]);
  const outliersRemoved = selectedYieldWindow?.window.statistics.outliers_removed ?? 0;

  return (
    <MetricCard icon={TrendingUp}>
      {/* Primary Metric: ROI% */}
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-3xl md:text-4xl font-bold ${roiColor} tracking-tight`}>
          {formatPercent(roiValue)}
        </span>
        <button
          ref={roiTooltip.triggerRef}
          onClick={roiTooltip.toggle}
          className="text-gray-600 hover:text-gray-300 transition-colors mt-1"
          aria-label="ROI Info"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-gray-500 uppercase tracking-wider mb-6 font-medium">
        Est. Yearly ROI
      </div>

      {/* Secondary Metrics Row */}
      <div className="flex items-center gap-8 text-sm">
        {/* Yearly PnL */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-gray-300 font-medium text-lg">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span>{formatCurrency(roiAmount)}</span>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">Yearly PnL</span>
        </div>

        <div className="w-px h-10 bg-gray-800" />

        {/* Daily Yield */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-gray-300 font-medium text-lg">
            <Percent className="w-4 h-4 text-purple-400" />
            <span>{formatCurrency(yieldValue)}</span>
            <button
              ref={yieldTooltip.triggerRef}
              onClick={yieldTooltip.toggle}
              className="text-gray-600 hover:text-gray-300 transition-colors"
              aria-label="Yield Info"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">Daily Yield</span>
        </div>
      </div>

      {/* Tooltips */}
      {roiTooltip.visible && portfolioROI && (
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
                  .sort(
                    (a, b) =>
                      deriveRoiWindowSortScore(a.key) - deriveRoiWindowSortScore(b.key)
                  )
              : []
          }
          protocols={[]}
          recommendedPeriodLabel={portfolioROI.recommended_period?.replace("roi_", "") || null}
        />
      )}
      {yieldTooltip.visible && selectedYieldWindow && (
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
