import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import { MetricCard } from "../MetricCard";
import type { PerformanceMetricsProps } from "../performance/types";

/**
 * ConsolidatedMetricV4 - Enhanced Gradient Hero
 *
 * Refined variation of V1 with gradient accents, enhanced typography, and smooth animations.
 * Features gradient accent bar, hero ROI with gradient text, and enhanced icon styling.
 * Height: ~140-160px
 */
export function ConsolidatedMetricV4({
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
  const isPositive = roiValue >= 0;

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
    <MetricCard icon={TrendingUp} className="relative overflow-hidden group">
      {/* Gradient Accent Bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
      />

      {/* Hero ROI Section */}
      <motion.div
        className="mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-1">
          {isPositive ? (
            <motion.span
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent tracking-tight leading-none"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {formatPercent(roiValue)}
            </motion.span>
          ) : (
            <motion.span
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent tracking-tight leading-none"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {formatPercent(roiValue)}
            </motion.span>
          )}
          <motion.button
            ref={roiTooltip.triggerRef}
            onClick={roiTooltip.toggle}
            className="text-gray-600 hover:text-purple-400 transition-colors mt-1"
            aria-label="ROI Info"
            whileHover={{ scale: 1.15, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Info className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="text-xs text-gray-400 uppercase tracking-wider mb-6 font-medium flex items-center gap-2">
          <span>Est. Yearly ROI</span>
          <motion.span
            className="w-1 h-1 rounded-full bg-purple-500"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-gray-600">Estimated</span>
        </div>
      </motion.div>

      {/* Animated Gradient Divider */}
      <div className="relative h-px mb-6">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Secondary Metrics Row */}
      <motion.div
        className="flex items-center justify-center gap-8 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {/* Yearly PnL */}
        <motion.div
          className="flex flex-col items-center"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 text-gray-200 font-medium text-lg">
            <div className="p-2 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold tabular-nums">{formatCurrency(roiAmount)}</span>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-2">
            Yearly PnL
          </span>
        </motion.div>

        {/* Divider */}
        <div className="w-px h-14 bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

        {/* Daily Yield */}
        <motion.div
          className="flex flex-col items-center"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 text-gray-200 font-medium text-lg">
            <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
              <Percent className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-semibold tabular-nums">{formatCurrency(yieldValue)}</span>
            <motion.button
              ref={yieldTooltip.triggerRef}
              onClick={yieldTooltip.toggle}
              className="text-gray-600 hover:text-emerald-400 transition-colors"
              aria-label="Yield Info"
              whileHover={{ scale: 1.15, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
            >
              <Info className="w-3 h-3" />
            </motion.button>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-2">
            Daily Yield
          </span>
        </motion.div>
      </motion.div>

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
