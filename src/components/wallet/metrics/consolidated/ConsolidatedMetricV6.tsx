import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import { DollarSign, Info, Percent, TrendingUp } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import { MetricCard } from "../MetricCard";
import type { PerformanceMetricsProps } from "../performance/types";

/**
 * ConsolidatedMetricV6 - Horizontal Split with Badges
 *
 * Two-column layout with ROI hero on left and metrics stack on right.
 * Features status badges, data quality indicators, and vertical divider.
 * Height: ~140-160px
 */
export function ConsolidatedMetricV6({
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
  const recommendedPeriod = portfolioROI?.recommended_period?.replace("roi_", "") || "30d";

  // Yield Data
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;
  const yieldValue = selectedYieldWindow?.window.average_daily_yield_usd ?? 0;
  const daysWithData = selectedYieldWindow?.window.period.days ?? 0;

  // Yield Breakdown for Tooltip
  const sortedProtocolBreakdown = React.useMemo(() => {
    const protocolYieldBreakdown =
      selectedYieldWindow?.window.protocol_breakdown ?? [];
    return sortProtocolsByTodayYield(protocolYieldBreakdown);
  }, [selectedYieldWindow]);
  const outliersRemoved = selectedYieldWindow?.window.statistics.outliers_removed ?? 0;

  // Badge logic
  const getYieldBadge = () => {
    if (!yieldSummaryData || daysWithData === 0) return null;
    if (daysWithData < 7) return { label: "preliminary", color: "bg-yellow-900/30 text-yellow-400" };
    if (daysWithData < 14) return { label: "improving", color: "bg-blue-900/30 text-blue-400" };
    return { label: "stable", color: "bg-green-900/30 text-green-400" };
  };

  const yieldBadge = getYieldBadge();

  return (
    <MetricCard icon={TrendingUp} className="p-0 overflow-hidden">
      <div className="grid grid-cols-[1fr,auto,1fr] gap-0 h-full">
        {/* Left Section: Hero ROI */}
        <motion.div
          className="flex flex-col justify-center p-5 bg-gradient-to-br from-gray-800/40 to-gray-900/20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-4xl md:text-5xl font-bold ${roiColor} tracking-tight leading-none`}>
              {formatPercent(roiValue)}
            </span>
            <motion.button
              ref={roiTooltip.triggerRef}
              onClick={roiTooltip.toggle}
              className="text-gray-600 hover:text-purple-400 transition-colors"
              aria-label="ROI Info"
              whileHover={{ scale: 1.15, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
            >
              <Info className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Est. Yearly ROI
            </span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400">
              {recommendedPeriod} basis
            </span>
          </div>
        </motion.div>

        {/* Vertical Divider */}
        <div className="w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

        {/* Right Section: Stacked Metrics */}
        <motion.div
          className="flex flex-col justify-center gap-4 p-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* PnL Metric */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-200 tabular-nums">
                  {formatCurrency(roiAmount)}
                </span>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Yearly PnL</p>
              </div>
            </div>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              est.
            </span>
          </div>

          {/* Yield Metric */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-gradient-to-br from-emerald-600/20 to-teal-600/20">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-200 tabular-nums">
                  {formatCurrency(yieldValue)}
                </span>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Daily Yield</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {yieldBadge && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${yieldBadge.color}`}>
                  {yieldBadge.label}
                </span>
              )}
              <motion.button
                ref={yieldTooltip.triggerRef}
                onClick={yieldTooltip.toggle}
                className="text-gray-600 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Yield Info"
                whileHover={{ scale: 1.15, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info className="w-3 h-3" />
              </motion.button>
            </div>
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
