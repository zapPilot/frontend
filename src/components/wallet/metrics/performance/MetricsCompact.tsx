import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import {
    DollarSign,
    Info,
    Percent,
    TrendingUp,
} from "lucide-react";
import React from "react";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import type { PerformanceMetricsProps } from "./types";

export function MetricsCompact({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading,
  isYieldLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  className = "",
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

  const roiValue = portfolioROI?.recommended_yearly_roi ?? 0;
  const roiAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const roiColor = roiValue >= 0 ? "text-green-400" : "text-red-400";

  const pnlAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const pnlValue = portfolioChangePercentage;
  const pnlColor = pnlAmount >= 0 ? "text-green-400" : "text-red-400";

  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;
  const yieldValue = selectedYieldWindow?.window.average_daily_yield_usd ?? 0;
  const yieldAmount = selectedYieldWindow?.window.total_yield_usd ?? 0;

  const sortedProtocolBreakdown = React.useMemo(() => {
    const protocolYieldBreakdown =
      selectedYieldWindow?.window.protocol_breakdown ?? [];
    return sortProtocolsByTodayYield(protocolYieldBreakdown);
  }, [selectedYieldWindow]);
  const outliersRemoved = selectedYieldWindow?.window.statistics.outliers_removed ?? 0;

  const isLoading = shouldShowLoading || isLandingLoading || isYieldLoading;

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <WalletMetricsSkeleton />
        <WalletMetricsSkeleton />
        <WalletMetricsSkeleton />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ROI Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${roiColor}`} />
            <span className="text-xs font-medium text-gray-400">ROI (Yearly)</span>
          </div>
          <button
            ref={roiTooltip.triggerRef}
            onClick={roiTooltip.toggle}
            className="text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-xl font-bold ${roiColor}`}>
            {formatPercent(roiValue)}
          </span>
          <span className="text-sm text-gray-400">{formatCurrency(roiAmount)}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div>
            <span className="text-gray-500">7d:</span>{" "}
            <span className="text-gray-300">{formatPercent(portfolioROI?.roi_7d?.value ?? 0)}</span>
          </div>
          <div>
            <span className="text-gray-500">30d:</span>{" "}
            <span className="text-gray-300">{formatPercent(portfolioROI?.roi_30d?.value ?? 0)}</span>
          </div>
          <div>
            <span className="text-gray-500">365d:</span>{" "}
            <span className="text-gray-300">{formatPercent(portfolioROI?.roi_365d?.value ?? 0)}</span>
          </div>
        </div>
      </div>
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

      {/* PnL Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className={`w-4 h-4 ${pnlColor}`} />
          <span className="text-xs font-medium text-gray-400">Est. Yearly PnL</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold ${pnlColor}`}>
            {formatCurrency(pnlAmount)}
          </span>
          <span className="text-sm text-gray-400">{formatPercent(pnlValue)}</span>
        </div>
      </div>

      {/* Yield Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-gray-400">Avg Daily Yield</span>
          </div>
          <button
            ref={yieldTooltip.triggerRef}
            onClick={yieldTooltip.toggle}
            className="text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-bold text-purple-400">
            {formatCurrency(yieldValue)}
          </span>
          <span className="text-xs text-gray-500">per day</span>
        </div>
        <div className="text-xs text-gray-400">
          <span className="text-gray-500">Total ({selectedYieldWindow?.label ?? "N/A"}):</span>{" "}
          <span className="text-gray-300">{formatCurrency(yieldAmount)}</span>
        </div>
      </div>
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
