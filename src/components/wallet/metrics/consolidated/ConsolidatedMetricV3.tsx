import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import type { PerformanceMetricsProps } from "../performance/types";

export function ConsolidatedMetricV3({
  portfolioROI,
  yieldSummaryData,
  portfolioChangePercentage,
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
    <div className="relative flex items-center justify-between px-6 py-4 bg-gray-900/20 rounded-xl border border-gray-800/50">
      {/* Left: ROI Hero */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
           <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Yearly ROI</span>
           <button
            ref={roiTooltip.triggerRef}
            onClick={roiTooltip.toggle}
            className="text-gray-600 hover:text-gray-400 transition-colors"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <TrendingUp className={`w-8 h-8 ${roiColor}`} />
          <span className={`text-4xl font-bold ${roiColor} tracking-tight`}>
            {formatPercent(roiValue)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-gray-800 mx-6" />

      {/* Right: Stacked Secondary Metrics */}
      <div className="flex flex-col gap-3 min-w-[140px]">
        {/* Yearly PnL */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Est. PnL</span>
          <div className="flex items-center gap-1.5 text-gray-300">
            <DollarSign className="w-3.5 h-3.5 text-gray-600" />
            <span className="font-semibold text-sm">{formatCurrency(roiAmount)}</span>
          </div>
        </div>

        {/* Daily Yield */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
             <span className="text-xs text-gray-500 font-medium">Daily Yield</span>
             <button
              ref={yieldTooltip.triggerRef}
              onClick={yieldTooltip.toggle}
              className="text-gray-700 hover:text-gray-500 transition-colors"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Percent className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-sm">{formatCurrency(yieldValue)}</span>
          </div>
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
    </div>
  );
}
