import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import { MetricCard } from "../MetricCard";
import type { PerformanceMetricsProps } from "../performance/types";

/**
 * ConsolidatedMetricV5 - Card-Within-Card Layout
 *
 * Refined variation of V1 with nested card design for strong visual separation.
 * Hero ROI in elevated card, secondary metrics in mini-cards below.
 * Height: ~170px (slightly taller for card spacing)
 */
export function ConsolidatedMetricV5({
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
    <MetricCard icon={TrendingUp} className="p-3">
      {/* Hero Card (Nested) */}
      <motion.div
        className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 rounded-lg p-5 backdrop-blur-sm relative mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ borderColor: "rgba(168, 85, 247, 0.4)" }}
      >
        {/* Info icon in top-right */}
        <motion.button
          ref={roiTooltip.triggerRef}
          onClick={roiTooltip.toggle}
          className="absolute top-3 right-3 text-gray-600 hover:text-purple-400 transition-colors"
          aria-label="ROI Info"
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
        >
          <Info className="w-4 h-4" />
        </motion.button>

        {/* Hero ROI Value */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-4xl md:text-4xl font-bold ${roiColor} tracking-tight`}>
            {formatPercent(roiValue)}
          </span>
        </div>

        {/* Label */}
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Est. Yearly ROI
        </div>
      </motion.div>

      {/* Mini-Cards Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* PnL Mini-Card */}
        <motion.div
          className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 hover:bg-gray-800/60 hover:border-gray-600/50 transition-all group"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          {/* Icon Badge */}
          <div className="absolute top-2 left-2 p-1.5 rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
            <DollarSign className="w-3 h-3 text-white" />
          </div>

          {/* Content */}
          <div className="flex flex-col items-center justify-center h-full pt-4">
            <span className="text-lg font-semibold text-gray-200 tabular-nums mb-1">
              {formatCurrency(roiAmount)}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              Yearly PnL
            </span>
          </div>
        </motion.div>

        {/* Yield Mini-Card */}
        <motion.div
          className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 hover:bg-gray-800/60 hover:border-gray-600/50 transition-all group relative"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          {/* Icon Badge */}
          <div className="absolute top-2 left-2 p-1.5 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600">
            <Percent className="w-3 h-3 text-white" />
          </div>

          {/* Info Icon */}
          <motion.button
            ref={yieldTooltip.triggerRef}
            onClick={yieldTooltip.toggle}
            className="absolute top-2 right-2 text-gray-600 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Yield Info"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Info className="w-3 h-3" />
          </motion.button>

          {/* Content */}
          <div className="flex flex-col items-center justify-center h-full pt-4">
            <span className="text-lg font-semibold text-gray-200 tabular-nums mb-1">
              {formatCurrency(yieldValue)}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              Daily Yield
            </span>
          </div>
        </motion.div>
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
