import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import type { PerformanceMetricsProps } from "../performance/types";

export function ConsolidatedMetricV2({
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
  const roiColor = roiValue >= 0 ? "text-emerald-400" : "text-rose-400";
  const roiBg = roiValue >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10";
  const roiBorder = roiValue >= 0 ? "border-emerald-500/20" : "border-rose-500/20";

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
    <div className={`relative overflow-hidden rounded-2xl border ${roiBorder} ${roiBg} backdrop-blur-sm`}>
      {/* Header / Hero Section */}
      <div className="p-6 flex flex-col items-center justify-center relative">
        <div className="absolute top-4 right-4">
           <button
            ref={roiTooltip.triggerRef}
            onClick={roiTooltip.toggle}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Estimated Yearly ROI</span>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className={`text-6xl font-black tracking-tighter ${roiColor} drop-shadow-sm`}>
            {formatPercent(roiValue)}
          </span>
        </div>
        
        <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full ${roiValue >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} text-xs font-medium`}>
           <TrendingUp className="w-3 h-3" />
           <span>Annualized Projection</span>
        </div>
      </div>

      {/* Footer / Secondary Metrics */}
      <div className="grid grid-cols-2 border-t border-gray-700/30 bg-gray-900/40">
        <div className="p-4 flex flex-col items-center justify-center border-r border-gray-700/30">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Yearly PnL</span>
          <div className="flex items-center gap-1.5 text-gray-200">
             <DollarSign className="w-4 h-4 text-gray-400" />
             <span className="text-lg font-semibold">{formatCurrency(roiAmount)}</span>
          </div>
        </div>

        <div className="p-4 flex flex-col items-center justify-center relative group">
           <button
              ref={yieldTooltip.triggerRef}
              onClick={yieldTooltip.toggle}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Info className="w-3 h-3" />
            </button>
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Daily Yield</span>
          <div className="flex items-center gap-1.5 text-gray-200">
             <Percent className="w-4 h-4 text-purple-400" />
             <span className="text-lg font-semibold">{formatCurrency(yieldValue)}</span>
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
