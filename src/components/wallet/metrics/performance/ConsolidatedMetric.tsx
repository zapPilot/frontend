import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import type { PerformanceMetricsProps } from "./types";

interface ConsolidatedMetricProps extends PerformanceMetricsProps {
  variant?: "default" | "large" | "compact";
  showDetails?: boolean;
}

export function ConsolidatedMetric({
  portfolioROI,
  yieldSummaryData,
  portfolioChangePercentage,
  variant = "default",
  showDetails = true,
}: ConsolidatedMetricProps) {
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

  const sizeClasses = {
    default: "text-4xl",
    large: "text-6xl",
    compact: "text-2xl",
  };

  const secondarySizeClasses = {
    default: "text-2xl",
    large: "text-3xl",
    compact: "text-xl",
  };

  return (
    <div className="relative">
      <div className="flex flex-col items-center space-y-2">
        {/* Primary Metric: ROI% */}
        <div className="flex items-center gap-3">
          <TrendingUp className={`w-8 h-8 ${roiColor}`} />
          <span className={`font-bold ${roiColor} ${sizeClasses[variant]}`}>
            {formatPercent(roiValue)}
          </span>
          <button
            ref={roiTooltip.triggerRef}
            onClick={roiTooltip.toggle}
            className="text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Metric: Yearly PnL */}
        <div className="flex items-center gap-2">
          <DollarSign className={`w-6 h-6 ${roiColor}`} />
          <span className={`font-semibold text-gray-300 ${secondarySizeClasses[variant]}`}>
            {formatCurrency(roiAmount)}
          </span>
          <span className="text-sm text-gray-500">yearly</span>
        </div>

        {/* Tertiary Detail: Daily Yield */}
        {showDetails && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Percent className="w-4 h-4 text-purple-400" />
            <span>{formatCurrency(yieldValue)}</span>
            <span className="text-gray-600">/</span>
            <span>day</span>
            <button
              ref={yieldTooltip.triggerRef}
              onClick={yieldTooltip.toggle}
              className="text-gray-600 hover:text-gray-300 transition-colors ml-1"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
        )}
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
