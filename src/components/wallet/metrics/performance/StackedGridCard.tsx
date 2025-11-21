"use client";

import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { TrendingUp, DollarSign, Clock, Info, X } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { getChangeColorClasses } from "@/lib/color-utils";
import { selectBestYieldWindow } from "@/components/wallet/tooltips";
import type { PerformanceMetricsProps } from "./types";

/**
 * Stacked Grid Card - Variation 2
 *
 * Balanced 2+1 grid layout (~100-110px height).
 * ROI and PnL in top row, Yield in bottom row (full width).
 * Click info icons to show popover with supplementary details.
 *
 * @example
 * ```tsx
 * <StackedGridCard
 *   portfolioROI={data?.portfolio_roi}
 *   yieldSummaryData={yieldData}
 *   portfolioChangePercentage={5.2}
 * />
 * ```
 */
export function StackedGridCard({
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
    <div
      className={`bg-gray-900/40 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors p-4 h-full flex flex-col ${className}`}
    >
      {/* Header */}
      <h3 className="text-sm text-gray-400 mb-3">Performance Metrics</h3>

      {/* Top Row: ROI & PnL */}
      <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-gray-800">
        {/* ROI Metric */}
        <MetricBlock
          label="Est. Yearly ROI"
          value={
            estimatedYearlyROI !== null
              ? formatPercentage(estimatedYearlyROI * 100, false, 2)
              : "—"
          }
          icon={TrendingUp}
          colorClass={roiColorClass}
          isLoading={isLandingLoading || shouldShowLoading}
          popoverTitle="Estimated Yearly ROI"
          popoverContent={
            estimatedYearlyROI !== null
              ? `Based on ${recommendedPeriod} performance. This is an estimated annualized return on your investment.`
              : "No ROI data available"
          }
        />

        {/* PnL Metric */}
        <MetricBlock
          label="Est. Yearly PnL"
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
          popoverTitle="Estimated Yearly PnL"
          popoverContent={
            estimatedYearlyPnL !== null
              ? "Estimated yearly profit/loss based on current portfolio performance trends."
              : "No PnL data available"
          }
        />
      </div>

      {/* Bottom Row: Yield (Full Width) */}
      <div className="flex items-center">
        <MetricBlock
          label="Avg Daily Yield"
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
          popoverTitle="Average Daily Yield"
          popoverContent={
            avgDailyYield !== null
              ? `Average daily yield calculated over ${daysWithData} days of data${outliersRemoved > 0 ? `. ${outliersRemoved} statistical outliers were removed for accuracy` : ""}.`
              : "No yield data available"
          }
        />
      </div>
    </div>
  );
}

/**
 * Individual Metric Block Component
 */
interface MetricBlockProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  isLoading: boolean;
  popoverTitle: string;
  popoverContent: string;
}

function MetricBlock({
  label,
  value,
  icon: Icon,
  colorClass,
  isLoading,
  popoverTitle,
  popoverContent,
}: MetricBlockProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-1">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="w-24 h-8 bg-gray-800 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <span className={`text-lg md:text-xl font-semibold ${colorClass}`}>{value}</span>
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer"
              aria-label={`${label} details`}
            >
              <Info className="w-4 h-4" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="bg-gray-900 border-2 border-purple-700/50 rounded-lg p-4 shadow-2xl max-w-xs z-50"
              sideOffset={8}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-purple-300">{popoverTitle}</h4>
                <Popover.Close asChild>
                  <button
                    className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Popover.Close>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{popoverContent}</p>
              <Popover.Arrow className="fill-gray-900" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
