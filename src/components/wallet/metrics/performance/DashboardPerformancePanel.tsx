"use client";

import { Activity,Clock, DollarSign, TrendingUp } from "lucide-react";
import React from "react";

import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import { selectBestYieldWindow } from "@/components/wallet/tooltips";
import { getChangeColorClasses } from "@/lib/color-utils";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

import type { DashboardPerformancePanelProps } from "./types";

/**
 * Dashboard Performance Panel - Variation 3
 *
 * Dedicated panel with card-based layout for each performance metric.
 * Includes enhanced visual design with trend indicators.
 * Positioned as separate section in portfolio page for maximum visibility.
 *
 * Note: Sparklines disabled in this implementation for simplicity.
 * Can be added later using recharts if needed.
 *
 * @example
 * ```tsx
 * <DashboardPerformancePanel
 *   portfolioROI={data?.portfolio_roi}
 *   yieldSummaryData={yieldData}
 *   showSparklines={false}
 * />
 * ```
 */
export function DashboardPerformancePanel({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading = false,
  isYieldLoading = false,
  shouldShowLoading = false,
  portfolioChangePercentage,
  errorMessage,
  className = "",
}: DashboardPerformancePanelProps) {
  // Handle USER_NOT_FOUND error
  if (errorMessage === "USER_NOT_FOUND") {
    return null;
  }

  // Extract metric data
  const estimatedYearlyROI = portfolioROI?.recommended_yearly_roi
    ? portfolioROI.recommended_yearly_roi / 100
    : null;
  const recommendedPeriod = portfolioROI?.recommended_period?.replace("roi_", "") || "30d";
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
      className={`bg-gray-900/40 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-200">Portfolio Performance</h2>
        </div>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* ROI Card */}
        <MetricCard
          title="Estimated Yearly ROI"
          value={
            estimatedYearlyROI !== null
              ? formatPercentage(estimatedYearlyROI * 100, false, 2)
              : "—"
          }
          subtext={estimatedYearlyROI !== null ? `Based on ${recommendedPeriod}` : "No data"}
          change={portfolioChangePercentage}
          icon={TrendingUp}
          colorClass={roiColorClass}
          isLoading={isLandingLoading || shouldShowLoading}
          badge="est."
        />

        {/* PnL Card */}
        <MetricCard
          title="Estimated Yearly PnL"
          value={
            estimatedYearlyPnL !== null
              ? formatCurrency(estimatedYearlyPnL, {
                  smartPrecision: true,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : "—"
          }
          subtext={estimatedYearlyPnL !== null ? "Estimated profit/loss" : "No data"}
          change={portfolioChangePercentage}
          icon={DollarSign}
          colorClass={pnlColorClass}
          isLoading={isLandingLoading || shouldShowLoading}
          badge="est."
        />

        {/* Yield Card */}
        <MetricCard
          title="Average Daily Yield"
          value={
            avgDailyYield !== null
              ? formatCurrency(avgDailyYield, {
                  smartPrecision: true,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"
          }
          subtext={
            avgDailyYield !== null
              ? `${daysWithData} days${outliersRemoved > 0 ? ` (${outliersRemoved} outliers removed)` : ""}`
              : "No data"
          }
          icon={Clock}
          colorClass="text-emerald-300"
          isLoading={isYieldLoading}
          badge={daysWithData < 7 ? "preliminary" : daysWithData < 14 ? "improving" : undefined}
        />
      </div>
    </div>
  );
}

/**
 * Individual Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string;
  subtext: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  isLoading: boolean;
  badge?: string | undefined;
}

function MetricCard({
  title,
  value,
  subtext,
  change,
  icon: Icon,
  colorClass,
  isLoading,
  badge,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-400 mb-3">{title}</p>
        <WalletMetricsSkeleton showValue showPercentage={false} />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 hover:border-purple-500/50 transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{title}</p>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900/20 text-purple-400">
            {badge}
          </span>
        )}
      </div>

      {/* Value Section */}
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-6 h-6 ${colorClass}`} />
        <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      </div>

      {/* Change Indicator */}
      {change !== undefined && change !== 0 && (
        <div className="flex items-center gap-1 mb-2">
          <span className={`text-sm ${colorClass}`}>
            {change > 0 ? "↗" : "↘"} {formatPercentage(Math.abs(change), true, 1)}
          </span>
          <span className="text-xs text-gray-500">vs previous period</span>
        </div>
      )}

      {/* Trend Bar (Visual indicator) */}
      {change !== undefined && (
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              change > 0
                ? "bg-gradient-to-r from-green-500 to-emerald-400"
                : change < 0
                ? "bg-gradient-to-r from-red-500 to-orange-400"
                : "bg-gray-600"
            }`}
            style={{ width: `${Math.min(Math.abs(change) * 5, 100)}%` }}
          />
        </div>
      )}

      {/* Subtext */}
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}
