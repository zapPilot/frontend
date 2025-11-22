"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { Clock, DollarSign, Info,TrendingUp } from "lucide-react";
import React from "react";

import { selectBestYieldWindow } from "@/components/wallet/tooltips";
import { getChangeColorClasses } from "@/lib/color-utils";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

import type { PerformanceMetricsProps } from "./types";

/**
 * Inline Metrics Card - Variation 1
 *
 * Most compact design (~90px height) with 3-column horizontal layout.
 * Shows ROI, PnL, and Yield metrics side-by-side with info icons.
 * Hover/click info icons to reveal supplementary details in tooltips.
 *
 * @example
 * ```tsx
 * <InlineMetricsCard
 *   portfolioROI={data?.portfolio_roi}
 *   yieldSummaryData={yieldData}
 *   portfolioChangePercentage={5.2}
 * />
 * ```
 */
export function InlineMetricsCard({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading = false,
  isYieldLoading = false,
  shouldShowLoading = false,
  portfolioChangePercentage,
  errorMessage,
  className = "",
}: PerformanceMetricsProps) {
  // Handle USER_NOT_FOUND error
  if (errorMessage === "USER_NOT_FOUND") {
    return null;
  }

  // Extract ROI data
  const estimatedYearlyROI = portfolioROI?.recommended_yearly_roi
    ? portfolioROI.recommended_yearly_roi / 100
    : null;
  const recommendedPeriod = portfolioROI?.recommended_period?.replace("roi_", "") || "30d";

  // Extract PnL data
  const estimatedYearlyPnL = portfolioROI?.estimated_yearly_pnl_usd ?? null;

  // Extract Yield data (select best window)
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows ? selectBestYieldWindow(yieldWindows) : null;
  const avgDailyYield = selectedYieldWindow?.window.average_daily_yield_usd ?? null;
  const daysWithData = selectedYieldWindow?.window.period.days ?? 0;
  const outliersRemoved = selectedYieldWindow?.window.statistics.outliers_removed ?? 0;

  // Color classes
  const roiColorClass = getChangeColorClasses(portfolioChangePercentage);
  const pnlColorClass = getChangeColorClasses(portfolioChangePercentage);

  return (
    <Tooltip.Provider delayDuration={300}>
      <div
        className={`bg-gray-900/40 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors h-full ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-gray-400">Performance Metrics</h3>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className="w-4 h-4 text-gray-500 hover:text-gray-300 cursor-help transition-colors"
                aria-label="About performance metrics"
              >
                <Info className="w-4 h-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl max-w-xs z-50"
                sideOffset={5}
              >
                <p className="text-gray-300">
                  Consolidated view of your portfolio&apos;s estimated ROI, PnL, and daily yield metrics.
                  Hover over individual info icons for details.
                </p>
                <Tooltip.Arrow className="fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-800">
          {/* ROI Metric */}
          <MetricCell
            label="ROI"
            value={
              estimatedYearlyROI !== null
                ? formatPercentage(estimatedYearlyROI * 100, false, 2)
                : "—"
            }
            icon={TrendingUp}
            colorClass={roiColorClass}
            isLoading={isLandingLoading || shouldShowLoading}
            tooltipContent={
              estimatedYearlyROI !== null
                ? `Estimated yearly return on investment based on ${recommendedPeriod} performance`
                : "No ROI data available"
            }
          />

          {/* PnL Metric */}
          <MetricCell
            label="PnL"
            value={
              estimatedYearlyPnL !== null
                ? formatCurrency(estimatedYearlyPnL, {
                    smartPrecision: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : "—"
            }
            icon={DollarSign}
            colorClass={pnlColorClass}
            isLoading={isLandingLoading || shouldShowLoading}
            tooltipContent={
              estimatedYearlyPnL !== null
                ? "Estimated yearly profit/loss from your portfolio"
                : "No PnL data available"
            }
          />

          {/* Yield Metric */}
          <MetricCell
            label="Yield"
            value={
              avgDailyYield !== null
                ? formatCurrency(avgDailyYield, {
                    smartPrecision: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"
            }
            icon={Clock}
            colorClass="text-emerald-300"
            isLoading={isYieldLoading}
            tooltipContent={
              avgDailyYield !== null
                ? `Average daily yield over ${daysWithData} days${outliersRemoved > 0 ? ` (${outliersRemoved} outliers removed)` : ""}`
                : "No yield data available"
            }
          />
        </div>
      </div>
    </Tooltip.Provider>
  );
}

/**
 * Individual Metric Cell Component
 */
interface MetricCellProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  isLoading: boolean;
  tooltipContent: string;
}

function MetricCell({
  label,
  value,
  icon: Icon,
  colorClass,
  isLoading,
  tooltipContent,
}: MetricCellProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-2 md:py-0 md:px-3">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        <div className="w-16 h-7 bg-gray-800 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-2 md:py-0 md:px-3">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex items-center gap-1.5">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <span className={`text-xl md:text-2xl font-bold ${colorClass}`}>{value}</span>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer ml-1"
              aria-label={`${label} details`}
            >
              <Info className="w-4 h-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl max-w-xs z-50"
              sideOffset={5}
            >
              <p className="text-gray-300">{tooltipContent}</p>
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </div>
  );
}
