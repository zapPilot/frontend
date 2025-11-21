"use client";

import React from "react";
import { TrendingUp, DollarSign, Clock } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { getChangeColorClasses } from "@/lib/color-utils";
import { selectBestYieldWindow } from "@/components/wallet/tooltips";
import { CompactMetricDisplay } from "./CompactMetricDisplay";
import type { PerformanceMetricsProps } from "./types";

/**
 * Horizontal Performance Bar - Variation 1
 *
 * Compact single-row display of ROI, PnL, and Yield metrics.
 * Displays all metrics horizontally with dividers for visual separation.
 * Minimal vertical space (~80-100px) with maximum information density.
 *
 * @example
 * ```tsx
 * <HorizontalPerformanceBar
 *   portfolioROI={data?.portfolio_roi}
 *   yieldSummaryData={yieldData}
 *   portfolioChangePercentage={5.2}
 * />
 * ```
 */
export function HorizontalPerformanceBar({
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

  // Determine yield badge
  const getYieldBadge = () => {
    if (!yieldSummaryData || daysWithData === 0) return null;
    if (daysWithData < 7) return "preliminary";
    if (daysWithData < 14) return "improving";
    return null;
  };

  const yieldBadge = getYieldBadge();

  // Color classes
  const roiColorClass = getChangeColorClasses(portfolioChangePercentage);
  const pnlColorClass = getChangeColorClasses(portfolioChangePercentage);

  return (
    <div
      className={`bg-gray-900/40 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors h-full ${className}`}
    >
      <div className="flex flex-col h-full">
        <h3 className="text-sm text-gray-400 mb-3">Performance Metrics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* ROI Metric */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-800 pb-3 md:pb-0 md:pr-4 last:border-0">
            <CompactMetricDisplay
              label="Estimated Yearly ROI"
              value={
                estimatedYearlyROI !== null
                  ? formatPercentage(estimatedYearlyROI * 100, false, 2)
                  : "—"
              }
              icon={TrendingUp}
              subtext={estimatedYearlyROI !== null ? `Based on ${recommendedPeriod}` : undefined}
              colorClass={roiColorClass}
              isLoading={isLandingLoading || shouldShowLoading}
              badge={estimatedYearlyROI !== null ? "est." : undefined}
              badgeVariant="info"
            />
          </div>

          {/* PnL Metric */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-800 pb-3 md:pb-0 md:pr-4 last:border-0">
            <CompactMetricDisplay
              label="Estimated Yearly PnL"
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
              subtext={estimatedYearlyPnL !== null ? "Estimated" : undefined}
              colorClass={pnlColorClass}
              isLoading={isLandingLoading || shouldShowLoading}
              badge={estimatedYearlyPnL !== null ? "est." : undefined}
              badgeVariant="info"
            />
          </div>

          {/* Yield Metric */}
          <div className="flex flex-col">
            <CompactMetricDisplay
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
              subtext={
                avgDailyYield !== null
                  ? `${daysWithData} days${outliersRemoved > 0 ? ` (${outliersRemoved} outliers)` : ""}`
                  : undefined
              }
              colorClass="text-emerald-300"
              isLoading={isYieldLoading}
              badge={yieldBadge !== null ? yieldBadge : undefined}
              badgeVariant={yieldBadge === "preliminary" ? "warning" : "success"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
